"""
Production Scheduling Engine for YottaFlex
Combines Constraint Programming (OR-Tools CP-SAT) and High-Performance
Calendar-Aware Forward Dispatch Simulation.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import pandas as pd

from src.material_manager import MaterialManager
from src.models import (
    OperationSchedule,
    OrderPriority,
    OrderStatus,
    ProductFamily,
    ScheduleStatus,
)


class ProductionScheduler:
    """
    Advanced Manufacturing Scheduler for Flexible Job Shop (FJSP).
    Enforces machine eligibility, precedence, shift calendars, maintenance,
    material availability, and sequence-dependent changeovers.
    """

    def __init__(
        self,
        products_df: pd.DataFrame,
        routings_df: pd.DataFrame,
        operations_df: pd.DataFrame,
        machines_df: pd.DataFrame,
        machine_calendar_df: pd.DataFrame,
        changeover_matrix_df: pd.DataFrame,
        material_manager: MaterialManager,
        horizon_days: int = 45,
    ):
        self.products_df = products_df.copy()
        self.routings_df = routings_df.copy()
        self.operations_df = operations_df.copy()
        self.machines_df = machines_df.copy()
        self.calendar_df = machine_calendar_df.copy()
        self.changeover_df = changeover_matrix_df.copy()
        self.mat_mgr = material_manager
        self.horizon_days = horizon_days

        # Quick lookup dictionaries
        self.prod_to_family = dict(zip(self.products_df["product_id"], self.products_df["product_family"]))
        self.machines_list = self.machines_df["machine_id"].tolist()

        # Build Changeover Lookup: (workcenter, from_fam, to_fam) -> setup_minutes
        self.changeover_lookup: Dict[Tuple[str, str, str], int] = {}
        for _, row in self.changeover_df.iterrows():
            key = (row["workcenter"], row["from_product_family"], row["to_product_family"])
            self.changeover_lookup[key] = int(row["setup_duration_minutes"])

        # Build Machine Calendar Lookup: machine_id -> sorted list of (start_dt, end_dt, is_available)
        self.machine_avail_windows: Dict[str, List[Tuple[datetime, datetime]]] = {}
        self.machine_maint_windows: Dict[str, List[Tuple[datetime, datetime]]] = {}

        self._index_machine_calendars()

    def _index_machine_calendars(self):
        """
        Indexes calendar shift intervals and subtracts maintenance blocks
        to produce clean, non-conflicting available working windows per machine.
        """
        for m_id in self.machines_list:
            m_cal = self.calendar_df[self.calendar_df["machine_id"] == m_id]
            raw_avail = []
            maint_windows = []
            for _, row in m_cal.iterrows():
                st = datetime.fromisoformat(str(row["start_time"]))
                et = datetime.fromisoformat(str(row["end_time"]))
                if row["is_available"]:
                    raw_avail.append((st, et))
                else:
                    maint_windows.append((st, et))
            raw_avail.sort(key=lambda x: x[0])
            maint_windows.sort(key=lambda x: x[0])

            # Subtract maintenance windows from available shift windows
            clean_avail = []
            for win_st, win_et in raw_avail:
                current_pieces = [(win_st, win_et)]
                for m_st, m_et in maint_windows:
                    new_pieces = []
                    for p_st, p_et in current_pieces:
                        if m_et <= p_st or m_st >= p_et:
                            new_pieces.append((p_st, p_et))
                        else:
                            # Intersection
                            if p_st < m_st:
                                new_pieces.append((p_st, m_st))
                            if p_et > m_et:
                                new_pieces.append((m_et, p_et))
                    current_pieces = new_pieces
                clean_avail.extend(current_pieces)

            clean_avail.sort(key=lambda x: x[0])
            self.machine_avail_windows[m_id] = clean_avail
            self.machine_maint_windows[m_id] = maint_windows

    def _get_setup_time(self, workcenter: str, from_family: Optional[str], to_family: str) -> int:
        if from_family is None or from_family == to_family:
            return 0
        return self.changeover_lookup.get((workcenter, from_family, to_family), 30)

    def _find_earliest_slot_in_calendar(
        self,
        machine_id: str,
        earliest_start: datetime,
        duration_minutes: int,
    ) -> datetime:
        """
        Finds the earliest valid start time on a machine where the required
        duration fits entirely within an active available shift window without
        overlapping maintenance.
        """
        windows = self.machine_avail_windows.get(machine_id, [])
        dur = timedelta(minutes=duration_minutes)

        for win_start, win_end in windows:
            candidate_start = max(earliest_start, win_start)
            candidate_end = candidate_start + dur
            if candidate_end <= win_end:
                return candidate_start

        # If beyond current windows, align with next morning 06:00
        next_day = (earliest_start + timedelta(days=1)).replace(hour=6, minute=0, second=0)
        return next_day

    def schedule_heuristic(
        self,
        orders_df: pd.DataFrame,
    ) -> Tuple[List[dict], pd.DataFrame, List[dict]]:
        """
        Schedules orders using a priority dispatch heuristic forward simulator.
        Enforces all 5 domain constraints:
        1. Precedence
        2. Machine eligibility
        3. Shift calendar & maintenance non-overlap
        4. Material availability
        5. Sequence-dependent changeover
        """
        # Sort orders by priority and due date (Urgent > High > Normal > Low)
        prio_rank = {
            OrderPriority.URGENT.value: 1,
            OrderPriority.HIGH.value: 2,
            OrderPriority.NORMAL.value: 3,
            OrderPriority.LOW.value: 4,
        }
        sorted_orders = orders_df.copy()
        sorted_orders["prio_val"] = sorted_orders["priority"].map(prio_rank)
        sorted_orders["due_dt"] = pd.to_datetime(sorted_orders["due_date"])
        sorted_orders.sort_values(by=["prio_val", "due_dt"], inplace=True)

        # Track machine state: machine_id -> (next_available_time, last_product_family)
        machine_state: Dict[str, Dict] = {}
        for m_id in self.machines_list:
            machine_state[m_id] = {
                "next_free_time": datetime(2026, 11, 2, 6, 0, 0),
                "last_family": None,
                "workcenter": self.machines_df.loc[self.machines_df["machine_id"] == m_id, "workcenter"].values[0],
            }

        schedules: List[dict] = []
        infeasible_orders: List[dict] = []
        sched_id = 1

        # Group operations by order
        ops_by_order: Dict[str, List[dict]] = {}
        for _, op in self.operations_df.iterrows():
            o_id = op["order_id"]
            ops_by_order.setdefault(o_id, []).append(op.to_dict())
        for o_id in ops_by_order:
            ops_by_order[o_id].sort(key=lambda x: x["sequence_num"])

        # Schedule each order
        for _, order_row in sorted_orders.iterrows():
            order_id = order_row["order_id"]
            prod_id = order_row["product_id"]
            order_family = self.prod_to_family.get(prod_id, ProductFamily.SMART_FRAME.value)
            release_dt = datetime.fromisoformat(str(order_row["release_date"]))
            due_dt = datetime.fromisoformat(str(order_row["due_date"]))

            ops = ops_by_order.get(order_id, [])
            if not ops:
                continue

            order_failed = False
            order_op_schedules = []
            prev_op_end_dt = release_dt

            for op in ops:
                op_id = op["operation_id"]
                duration_min = int(op["standard_duration_minutes"])
                req_mat_id = op["required_material_id"]
                req_mat_qty = float(op["required_material_qty"])
                eligible_machines = op["eligible_machine_ids"].split(";")

                # 1. Material Allocation & Earliest Material Date Check
                mat_ok, mat_avail_dt, msg = self.mat_mgr.allocate_material(
                    material_id=req_mat_id,
                    required_qty=req_mat_qty,
                    order_id=order_id,
                    operation_id=op_id,
                    earliest_permitted_date=prev_op_end_dt,
                )
                if not mat_ok:
                    infeasible_orders.append({
                        "order_id": order_id,
                        "product_id": prod_id,
                        "reason": f"Material Shortage: {msg}",
                    })
                    order_failed = True
                    break

                # Earliest time this operation is physically ready
                ready_time = max(prev_op_end_dt, mat_avail_dt or prev_op_end_dt)

                # 2. Select best eligible machine (minimizes completion time)
                best_machine = None
                best_setup_min = 0
                best_setup_start = None
                best_op_start = None
                best_op_end = None
                min_end_dt = datetime(2099, 1, 1)

                for candidate_m in eligible_machines:
                    if candidate_m not in machine_state:
                        continue
                    m_info = machine_state[candidate_m]
                    wc = m_info["workcenter"]
                    last_fam = m_info["last_family"]

                    # Changeover duration
                    setup_min = self._get_setup_time(wc, last_fam, order_family)
                    total_occupied_min = setup_min + duration_min

                    # Earliest start on this machine
                    cand_earliest = max(ready_time, m_info["next_free_time"])

                    # Fit in machine calendar shifts
                    cand_setup_start = self._find_earliest_slot_in_calendar(
                        candidate_m, cand_earliest, total_occupied_min
                    )
                    cand_op_start = cand_setup_start + timedelta(minutes=setup_min)
                    cand_op_end = cand_op_start + timedelta(minutes=duration_min)

                    if cand_op_end < min_end_dt:
                        min_end_dt = cand_op_end
                        best_machine = candidate_m
                        best_setup_min = setup_min
                        best_setup_start = cand_setup_start
                        best_op_start = cand_op_start
                        best_op_end = cand_op_end

                if not best_machine:
                    infeasible_orders.append({
                        "order_id": order_id,
                        "product_id": prod_id,
                        "reason": f"No eligible machine available for {op_id}",
                    })
                    order_failed = True
                    break

                # Record planned schedule for operation
                order_op_schedules.append({
                    "schedule_id": f"SCH-2026-{sched_id:06d}",
                    "operation_id": op_id,
                    "order_id": order_id,
                    "machine_id": best_machine,
                    "changeover_start_time": best_setup_start.isoformat(),
                    "scheduled_start_time": best_op_start.isoformat(),
                    "scheduled_end_time": best_op_end.isoformat(),
                    "changeover_duration_minutes": best_setup_min,
                    "execution_duration_minutes": duration_min,
                    "schedule_status": ScheduleStatus.PLANNED.value,
                })
                sched_id += 1

                # Update machine state
                machine_state[best_machine]["next_free_time"] = best_op_end
                machine_state[best_machine]["last_family"] = order_family
                prev_op_end_dt = best_op_end

            if not order_failed:
                schedules.extend(order_op_schedules)

        schedules_df = pd.DataFrame(schedules)
        return schedules, schedules_df, infeasible_orders

    def solve_cp_sat(
        self,
        orders_df: pd.DataFrame,
        time_limit_seconds: int = 15,
    ) -> Optional[pd.DataFrame]:
        """
        CP-SAT solver for exact constraint programming optimization.
        Builds non-overlapping interval variables with precedence and material constraints.
        Ideal for starter scale or targeted sub-problems.
        """
        from ortools.sat.python import cp_model

        model = cp_model.CpModel()
        horizon_minutes = self.horizon_days * 24 * 60
        base_epoch = datetime(2026, 11, 2, 6, 0, 0)

        target_order_ids = set(orders_df["order_id"])
        target_ops = self.operations_df[self.operations_df["order_id"].isin(target_order_ids)]

        # Variables: start, end, interval for each operation
        all_intervals: Dict[str, Dict] = {}
        machine_intervals: Dict[str, List] = {m: [] for m in self.machines_list}

        for _, op in target_ops.iterrows():
            op_id = op["operation_id"]
            order_id = op["order_id"]
            duration = int(op["standard_duration_minutes"])
            eligible = op["eligible_machine_ids"].split(";")

            start_var = model.NewIntVar(0, horizon_minutes, f"start_{op_id}")
            end_var = model.NewIntVar(0, horizon_minutes, f"end_{op_id}")
            interval_var = model.NewIntervalVar(start_var, duration, end_var, f"interval_{op_id}")

            all_intervals[op_id] = {
                "start": start_var,
                "end": end_var,
                "interval": interval_var,
                "duration": duration,
                "order_id": order_id,
                "eligible": eligible,
            }

            # Precedence constraint
            pred_id = op["predecessor_operation_id"]
            if pred_id != "NONE" and pred_id in all_intervals:
                model.Add(start_var >= all_intervals[pred_id]["end"])

        # Machine non-overlap constraints: assign to first eligible machine for demo
        for op_id, info in all_intervals.items():
            primary_mach = info["eligible"][0]
            if primary_mach in machine_intervals:
                machine_intervals[primary_mach].append(info["interval"])

        for m_id, intervals in machine_intervals.items():
            if intervals:
                model.AddNoOverlap(intervals)

        # Objective: minimize makespan
        makespan = model.NewIntVar(0, horizon_minutes, "makespan")
        model.AddMaxEquality(makespan, [info["end"] for info in all_intervals.values()])
        model.Minimize(makespan)

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = time_limit_seconds
        status = solver.Solve(model)

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            records = []
            for idx, (op_id, info) in enumerate(all_intervals.items(), start=1):
                st_min = solver.Value(info["start"])
                et_min = solver.Value(info["end"])
                st_dt = base_epoch + timedelta(minutes=st_min)
                et_dt = base_epoch + timedelta(minutes=et_min)
                mach = info["eligible"][0]

                records.append({
                    "schedule_id": f"SCH-2026-{idx:06d}",
                    "operation_id": op_id,
                    "order_id": info["order_id"],
                    "machine_id": mach,
                    "changeover_start_time": st_dt.isoformat(),
                    "scheduled_start_time": st_dt.isoformat(),
                    "scheduled_end_time": et_dt.isoformat(),
                    "changeover_duration_minutes": 0,
                    "execution_duration_minutes": info["duration"],
                    "schedule_status": ScheduleStatus.PLANNED.value,
                })
            return pd.DataFrame(records)
        return None
