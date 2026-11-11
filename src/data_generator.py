"""
Synthetic Data Generator for YottaFlex Production Scheduling System
Generates reproducible master and transactional manufacturing datasets.
Fixed seed: 20261022
"""

import json
import os
import random
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import pandas as pd

from src.models import (
    AnomalyCategory,
    MachineStatus,
    OperationType,
    OrderPriority,
    OrderStatus,
    ProductFamily,
    ScheduleStatus,
    UnitOfMeasure,
    Workcenter,
)

FIXED_SEED = 20261022
BASE_DATE = datetime(2026, 11, 2, 6, 0, 0)  # Monday 06:00:00 UTC


class DataGenerator:
    """
    Deterministic synthetic data generator for manufacturing scheduling.
    Supports starter and full volumes.
    """

    def __init__(self, mode: str = "full", seed: int = FIXED_SEED):
        self.mode = mode
        self.seed = seed
        self.rng = random.Random(seed)

        if mode == "starter":
            self.num_products = 10
            self.num_machines = 14
            self.num_orders = 25
            self.num_materials = 20
            self.ops_per_order = 4  # 25 * 4 = 100 operations
            self.horizon_days = 14
        else:  # full mode
            self.num_products = 100
            self.num_machines = 40
            self.num_orders = 500
            self.num_materials = 200
            self.ops_per_order = 4  # 500 * 4 = 2,000 operations
            self.horizon_days = 45

        self.products: List[dict] = []
        self.routings: List[dict] = []
        self.operations: List[dict] = []
        self.machines: List[dict] = []
        self.machine_calendars: List[dict] = []
        self.materials: List[dict] = []
        self.inventory_lots: List[dict] = []
        self.production_orders: List[dict] = []
        self.operation_schedules: List[dict] = []
        self.changeover_matrix: List[dict] = []
        self.ground_truth: List[dict] = []

    def generate_all(self) -> Dict[str, pd.DataFrame]:
        """Generate all 10 entities in topological dependency order."""
        self.rng = random.Random(self.seed)

        # 1. Master Data
        self._generate_materials()
        self._generate_products_and_routings()
        self._generate_machines()
        self._generate_changeover_matrix()
        self._generate_machine_calendars()

        # 2. Inventory Lots
        self._generate_inventory_lots()

        # 3. Transactional Orders & Operations
        self._generate_orders_and_operations()

        return self.to_dataframes()

    def _generate_materials(self):
        categories = [
            ("Titanium_Alloy", UnitOfMeasure.BAR, 150.0, 450.0),
            ("Aircraft_Aluminum", UnitOfMeasure.SHEET, 40.0, 180.0),
            ("Optical_Glass", UnitOfMeasure.PCS, 85.0, 320.0),
            ("Polymer_Resin", UnitOfMeasure.LITER, 18.0, 65.0),
            ("Silicon_Wafer", UnitOfMeasure.PCS, 250.0, 750.0),
            ("Fastener_Hardware", UnitOfMeasure.PCS, 5.0, 35.0),
        ]
        self.materials = []
        for i in range(1, self.num_materials + 1):
            mat_id = f"MAT-{i:04d}"
            cat_tuple = categories[(i - 1) % len(categories)]
            cat_name, uom, min_cost, max_cost = cat_tuple
            cost = round(self.rng.uniform(min_cost, max_cost), 2)
            lead_time = self.rng.randint(2, 14)
            self.materials.append({
                "material_id": mat_id,
                "material_name": f"{cat_name}_Grade_{i:03d}",
                "material_category": cat_name,
                "unit_of_measure": uom.value,
                "standard_unit_cost": cost,
                "lead_time_days": lead_time,
            })

    def _generate_products_and_routings(self):
        families = list(ProductFamily)
        self.products = []
        self.routings = []

        for i in range(1, self.num_products + 1):
            prod_id = f"PROD-2026-{i:06d}"
            family = families[(i - 1) % len(families)]
            base_cost = round(self.rng.uniform(120.0, 1850.0), 2)
            created_at = (BASE_DATE - timedelta(days=self.rng.randint(30, 90))).isoformat()

            self.products.append({
                "product_id": prod_id,
                "product_name": f"{family.value}_Model_{i:03d}",
                "product_family": family.value,
                "unit_of_measure": UnitOfMeasure.EA.value,
                "base_cost": base_cost,
                "created_at": created_at,
            })

            routing_id = f"ROUTE-{prod_id}-01"
            self.routings.append({
                "routing_id": routing_id,
                "product_id": prod_id,
                "version": 1,
                "total_steps": self.ops_per_order,
                "is_active": True,
                "description": f"Standard {self.ops_per_order}-stage routing for {prod_id}",
            })

    def _generate_machines(self):
        # Define workcenters and their machine counts (summing to num_machines)
        wc_configs = [
            (Workcenter.CUTTING_BAY, OperationType.CUTTING, 6),
            (Workcenter.CNC_MACHINING, OperationType.CNC_MILLING, 8),
            (Workcenter.DRILL_PRESS, OperationType.DRILLING, 6),
            (Workcenter.THERMAL_CELL, OperationType.HEAT_TREATMENT, 4),
            (Workcenter.SURFACE_FINISH, OperationType.POLISHING, 6),
            (Workcenter.ASSEMBLY_LINE, OperationType.CLEANROOM_ASSEMBLY, 6),
            (Workcenter.QUALITY_LAB, OperationType.QC_INSPECTION, 4),
        ]

        if self.mode == "starter":
            wc_configs = [
                (Workcenter.CUTTING_BAY, OperationType.CUTTING, 2),
                (Workcenter.CNC_MACHINING, OperationType.CNC_MILLING, 2),
                (Workcenter.DRILL_PRESS, OperationType.DRILLING, 2),
                (Workcenter.THERMAL_CELL, OperationType.HEAT_TREATMENT, 2),
                (Workcenter.SURFACE_FINISH, OperationType.POLISHING, 2),
                (Workcenter.ASSEMBLY_LINE, OperationType.CLEANROOM_ASSEMBLY, 2),
                (Workcenter.QUALITY_LAB, OperationType.QC_INSPECTION, 2),
            ]

        self.machines = []
        mach_idx = 1
        for wc, op_type, count in wc_configs:
            for _ in range(count):
                if mach_idx > self.num_machines:
                    break
                m_id = f"MACH-{mach_idx:03d}"
                hourly_rate = round(self.rng.uniform(65.0, 280.0), 2)
                self.machines.append({
                    "machine_id": m_id,
                    "machine_name": f"{wc.value}_Unit_{mach_idx:02d}",
                    "workcenter": wc.value,
                    "capability": op_type.value,
                    "hourly_rate": hourly_rate,
                    "status": MachineStatus.ACTIVE.value,
                })
                mach_idx += 1

    def _generate_changeover_matrix(self):
        families = list(ProductFamily)
        workcenters = [
            Workcenter.CUTTING_BAY,
            Workcenter.CNC_MACHINING,
            Workcenter.DRILL_PRESS,
            Workcenter.SURFACE_FINISH,
            Workcenter.ASSEMBLY_LINE,
        ]
        self.changeover_matrix = []
        chg_id = 1
        for wc in workcenters:
            for f_from in families:
                for f_to in families:
                    matrix_id = f"CHG-{chg_id:06d}"
                    if f_from == f_to:
                        setup = 0  # No setup needed within same family
                        sterilize = False
                    else:
                        setup = self.rng.choice([30, 45, 60, 90])
                        sterilize = self.rng.choice([True, False])
                    self.changeover_matrix.append({
                        "changeover_id": matrix_id,
                        "workcenter": wc.value,
                        "from_product_family": f_from.value,
                        "to_product_family": f_to.value,
                        "setup_duration_minutes": setup,
                        "requires_sterilization": sterilize,
                    })
                    chg_id += 1

    def _generate_machine_calendars(self):
        """
        Creates shift schedule across the horizon:
        Shift 1: 06:00 - 14:00 (Available: True)
        Shift 2: 14:00 - 22:00 (Available: True)
        Night: 22:00 - 06:00 (Available: False, Reason: Shift_Break)
        Plus preventative maintenance blocks on designated machines every week.
        """
        self.machine_calendars = []
        cal_id = 1

        for mach in self.machines:
            m_id = mach["machine_id"]
            # Pick a maintenance day for this machine (e.g. Wednesday or Saturday)
            maint_day_offset = (int(m_id.split("-")[1]) % 6) + 1  # 1 to 6 days

            for day in range(self.horizon_days):
                day_start = BASE_DATE + timedelta(days=day)

                # Shift 1: 06:00 - 14:00
                s1_start = day_start.replace(hour=6, minute=0, second=0)
                s1_end = day_start.replace(hour=14, minute=0, second=0)

                # Check if maintenance scheduled during Shift 1 on maintenance day
                is_maint_day = (day % 7) == maint_day_offset
                if is_maint_day and (int(m_id.split("-")[1]) % 3 == 0):
                    # Preventative maintenance from 09:00 to 13:00
                    pm_start = day_start.replace(hour=9, minute=0, second=0)
                    pm_end = day_start.replace(hour=13, minute=0, second=0)
                    self.machine_calendars.append({
                        "calendar_id": f"CAL-{cal_id:06d}",
                        "machine_id": m_id,
                        "shift_name": "Planned_Maintenance",
                        "start_time": pm_start.isoformat(),
                        "end_time": pm_end.isoformat(),
                        "is_available": False,
                        "reason": "Preventative_Maintenance",
                    })
                    cal_id += 1

                self.machine_calendars.append({
                    "calendar_id": f"CAL-{cal_id:06d}",
                    "machine_id": m_id,
                    "shift_name": "Shift_1_Morning",
                    "start_time": s1_start.isoformat(),
                    "end_time": s1_end.isoformat(),
                    "is_available": True,
                    "reason": "Standard_Production",
                })
                cal_id += 1

                # Shift 2: 14:00 - 22:00
                s2_start = day_start.replace(hour=14, minute=0, second=0)
                s2_end = day_start.replace(hour=22, minute=0, second=0)
                self.machine_calendars.append({
                    "calendar_id": f"CAL-{cal_id:06d}",
                    "machine_id": m_id,
                    "shift_name": "Shift_2_Afternoon",
                    "start_time": s2_start.isoformat(),
                    "end_time": s2_end.isoformat(),
                    "is_available": True,
                    "reason": "Standard_Production",
                })
                cal_id += 1

                # Night Off-Shift: 22:00 - Next Day 06:00
                night_start = day_start.replace(hour=22, minute=0, second=0)
                night_end = (day_start + timedelta(days=1)).replace(hour=6, minute=0, second=0)
                self.machine_calendars.append({
                    "calendar_id": f"CAL-{cal_id:06d}",
                    "machine_id": m_id,
                    "shift_name": "Night_Off_Shift",
                    "start_time": night_start.isoformat(),
                    "end_time": night_end.isoformat(),
                    "is_available": False,
                    "reason": "Shift_Break",
                })
                cal_id += 1

    def _generate_inventory_lots(self):
        """
        Creates inventory lots for all materials.
        Staggers arrival dates: 80% available at Day 0, 20% delayed arrivals (Days 2 to 6).
        """
        self.inventory_lots = []
        lot_id = 1
        for mat in self.materials:
            m_id = mat["material_id"]
            # Generate 2 to 3 lots per material
            num_lots = self.rng.randint(2, 3)
            for l_idx in range(num_lots):
                lid_str = f"LOT-{lot_id:06d}"
                initial_qty = float(self.rng.randint(250, 1500))
                # 80% available immediately at Base Date; 20% delayed arrivals
                is_delayed = (lot_id % 5 == 0)
                if is_delayed:
                    arr_date = BASE_DATE + timedelta(days=self.rng.randint(2, min(6, self.horizon_days - 1)))
                else:
                    arr_date = BASE_DATE - timedelta(days=self.rng.randint(1, 5))

                self.inventory_lots.append({
                    "lot_id": lid_str,
                    "material_id": m_id,
                    "initial_quantity": initial_qty,
                    "allocated_quantity": 0.0,
                    "available_quantity": initial_qty,
                    "availability_date": arr_date.isoformat(),
                    "storage_bin": f"BIN-{chr(65 + (lot_id % 6))}-{(lot_id % 20):02d}-01",
                    "supplier_code": f"SUP-{(lot_id % 15) + 1:03d}",
                })
                lot_id += 1

    def _generate_orders_and_operations(self):
        """
        Generates production orders with priorities, release dates, due dates.
        Generates sequential operations per order (sequence 10, 20, 30, 40).
        Total operations: num_orders * ops_per_order = 500 * 4 = 2,000 operations!
        """
        self.production_orders = []
        self.operations = []

        priorities = [
            (OrderPriority.URGENT, 0.10),   # 10% Urgent
            (OrderPriority.HIGH, 0.25),     # 25% High
            (OrderPriority.NORMAL, 0.50),   # 50% Normal
            (OrderPriority.LOW, 0.15),      # 15% Low
        ]
        priority_choices = []
        for p, weight in priorities:
            priority_choices.extend([p.value] * int(weight * 100))

        # Map capabilities to machine IDs for fast eligibility lookup
        capability_to_machines: Dict[str, List[str]] = {}
        for m in self.machines:
            cap = m["capability"]
            capability_to_machines.setdefault(cap, []).append(m["machine_id"])

        # Standard 4-stage operation workflow types per product family
        family_workflows = {
            ProductFamily.SMART_FRAME.value: [
                OperationType.CUTTING.value,
                OperationType.CNC_MILLING.value,
                OperationType.POLISHING.value,
                OperationType.QC_INSPECTION.value,
            ],
            ProductFamily.OPTIC_SENSOR.value: [
                OperationType.CUTTING.value,
                OperationType.CLEANROOM_ASSEMBLY.value,
                OperationType.POLISHING.value,
                OperationType.QC_INSPECTION.value,
            ],
            ProductFamily.PRECISION_ALLOY.value: [
                OperationType.CUTTING.value,
                OperationType.CNC_MILLING.value,
                OperationType.HEAT_TREATMENT.value,
                OperationType.POLISHING.value,
            ],
            ProductFamily.POWER_MODULE.value: [
                OperationType.CUTTING.value,
                OperationType.HEAT_TREATMENT.value,
                OperationType.CLEANROOM_ASSEMBLY.value,
                OperationType.QC_INSPECTION.value,
            ],
            ProductFamily.MICRO_CONTROLLER.value: [
                OperationType.CLEANROOM_ASSEMBLY.value,
                OperationType.DRILLING.value,
                OperationType.POLISHING.value,
                OperationType.QC_INSPECTION.value,
            ],
        }

        # Materials by ID lookup
        mat_ids = [m["material_id"] for m in self.materials]

        for o_idx in range(1, self.num_orders + 1):
            order_id = f"ORD-2026-{o_idx:06d}"
            # Choose product deterministically
            prod = self.products[(o_idx - 1) % len(self.products)]
            prod_id = prod["product_id"]
            prod_family = prod["product_family"]
            routing_id = f"ROUTE-{prod_id}-01"

            quantity = self.rng.randint(25, 200)
            priority = self.rng.choice(priority_choices)

            # Stagger release dates across days
            day_offset = (o_idx - 1) % max(1, (self.horizon_days - 4))
            release_dt = BASE_DATE + timedelta(days=day_offset, hours=self.rng.randint(0, 4))

            # Cumulative estimated operation duration
            total_duration_estimate = quantity * 1.5 + 180  # minutes
            lead_days = max(2, int(total_duration_estimate / (8 * 60)) + 3)
            if priority == OrderPriority.URGENT.value:
                due_dt = release_dt + timedelta(days=lead_days)
            elif priority == OrderPriority.HIGH.value:
                due_dt = release_dt + timedelta(days=lead_days + 2)
            else:
                due_dt = release_dt + timedelta(days=lead_days + 4)

            self.production_orders.append({
                "order_id": order_id,
                "product_id": prod_id,
                "routing_id": routing_id,
                "order_quantity": quantity,
                "priority": priority,
                "release_date": release_dt.isoformat(),
                "due_date": due_dt.isoformat(),
                "customer_id": f"CUST-{(o_idx % 35) + 1001:04d}",
                "order_status": OrderStatus.RELEASED.value,
            })

            # Create the 4 sequential operations
            workflow = family_workflows.get(prod_family, [
                OperationType.CUTTING.value,
                OperationType.CNC_MILLING.value,
                OperationType.POLISHING.value,
                OperationType.QC_INSPECTION.value,
            ])

            prev_op_id = "NONE"
            for step_idx, op_type in enumerate(workflow):
                seq_num = (step_idx + 1) * 10
                op_id = f"OP-{order_id}-{seq_num:02d}"

                # Calculate duration from quantity and standard run rate
                base_cycle_min = 0.35 + (step_idx * 0.1)
                duration_min = max(20, int(quantity * base_cycle_min) + 15)

                # Eligible machines
                avail_machs = capability_to_machines.get(op_type, [])
                if not avail_machs:
                    avail_machs = [self.machines[0]["machine_id"]]
                eligible_str = ";".join(avail_machs)

                # First step consumes primary raw material
                if step_idx == 0:
                    mat_idx = (int(prod_id.split("-")[2]) + o_idx) % len(mat_ids)
                    req_mat_id = mat_ids[mat_idx]
                    req_qty = float(round(quantity * 1.25, 1))
                else:
                    req_mat_id = "NONE"
                    req_qty = 0.0

                self.operations.append({
                    "operation_id": op_id,
                    "order_id": order_id,
                    "routing_id": routing_id,
                    "sequence_num": seq_num,
                    "operation_type": op_type,
                    "eligible_machine_ids": eligible_str,
                    "standard_duration_minutes": duration_min,
                    "required_material_id": req_mat_id,
                    "required_material_qty": req_qty,
                    "predecessor_operation_id": prev_op_id,
                })
                prev_op_id = op_id

    def inject_edge_cases(
        self,
        base_schedules: List[dict],
        inventory_lots_df: pd.DataFrame,
    ) -> Tuple[List[dict], List[dict]]:
        """
        Injects the 5 required negative scenarios into distinct, isolated schedules
        across distinct orders and machines to avoid cross-contamination:
        1. MACHINE_OVERLAP: Two operations overlapping on the same machine.
        2. PRECEDENCE_VIOLATION: Op 20 scheduled before Op 10 finishes.
        3. MATERIAL_UNAVAILABLE: Op scheduled before material lot availability date.
        4. CALENDAR_VIOLATION: Op scheduled during off-shift / maintenance.
        5. CHANGEOVER_OMITTED: Machine switches product family without setup buffer.

        Returns (corrupted_schedules, ground_truth_records).
        """
        import copy
        schedules = copy.deepcopy(base_schedules)
        ground_truth: List[dict] = []
        anomaly_id = 1

        if len(schedules) < 25:
            return schedules, []

        ops_by_id = {op["operation_id"]: op for op in self.operations}
        orders_by_id = {o["order_id"]: o for o in self.production_orders}
        prod_to_family = {p["product_id"]: p["product_family"] for p in self.products}
        lots_by_mat = {lot["material_id"]: lot for _, lot in inventory_lots_df.iterrows()}

        used_schedule_ids = set()
        used_order_ids = set()

        # -------------------------------------------------------------
        # Anomaly 1: PRECEDENCE_VIOLATION (2 instances)
        # -------------------------------------------------------------
        prec_count = 0
        for s in schedules:
            if s["schedule_id"] in used_schedule_ids or s["order_id"] in used_order_ids:
                continue
            op = ops_by_id.get(s["operation_id"])
            if op and op["sequence_num"] == 20:
                pred_op_id = op["predecessor_operation_id"]
                pred_sched = next((sc for sc in schedules if sc["operation_id"] == pred_op_id), None)
                if pred_sched and pred_sched["schedule_id"] not in used_schedule_ids:
                    pred_end = datetime.fromisoformat(pred_sched["scheduled_end_time"])
                    # Set op 20 to start 30 mins before pred_end, ensuring it does not overlap with other jobs on its machine
                    viol_start = pred_end - timedelta(minutes=30)
                    s["scheduled_start_time"] = viol_start.isoformat()
                    s["scheduled_end_time"] = (viol_start + timedelta(minutes=s["execution_duration_minutes"])).isoformat()
                    s["changeover_start_time"] = viol_start.isoformat()

                    ground_truth.append({
                        "anomaly_id": f"ANOM-{anomaly_id:04d}",
                        "anomaly_category": AnomalyCategory.PRECEDENCE_VIOLATION.value,
                        "target_schedule_id": s["schedule_id"],
                        "order_id": s["order_id"],
                        "operation_id": s["operation_id"],
                        "machine_id": s["machine_id"],
                        "description": f"Operation {s['operation_id']} starts at {s['scheduled_start_time']}, prior to predecessor {pred_op_id} completion at {pred_sched['scheduled_end_time']}",
                        "expected_flag": AnomalyCategory.PRECEDENCE_VIOLATION.value,
                    })
                    anomaly_id += 1
                    used_schedule_ids.add(s["schedule_id"])
                    used_order_ids.add(s["order_id"])
                    prec_count += 1
                    if prec_count >= 2:
                        break

        # Precompute earliest arrival per material
        mat_earliest_avail: Dict[str, datetime] = {}
        for _, lot in inventory_lots_df.iterrows():
            m_id = lot["material_id"]
            avail_dt = datetime.fromisoformat(str(lot["availability_date"]))
            if m_id not in mat_earliest_avail or avail_dt < mat_earliest_avail[m_id]:
                mat_earliest_avail[m_id] = avail_dt

        # -------------------------------------------------------------
        # Anomaly 2: MATERIAL_UNAVAILABLE (2 instances)
        # -------------------------------------------------------------
        mat_count = 0
        for s in schedules:
            if s["schedule_id"] in used_schedule_ids or s["order_id"] in used_order_ids:
                continue
            op = ops_by_id.get(s["operation_id"])
            if op and op["sequence_num"] == 10 and op["required_material_id"] != "NONE":
                req_mat = op["required_material_id"]
                earliest_lot_avail = mat_earliest_avail.get(req_mat)
                if earliest_lot_avail is not None:
                    # Force start to be 24 hours prior to the EARLIEST available lot!
                    early_start = earliest_lot_avail - timedelta(hours=24)
                    s["scheduled_start_time"] = early_start.isoformat()
                    s["scheduled_end_time"] = (early_start + timedelta(minutes=s["execution_duration_minutes"])).isoformat()
                    s["changeover_start_time"] = early_start.isoformat()

                    ground_truth.append({
                        "anomaly_id": f"ANOM-{anomaly_id:04d}",
                        "anomaly_category": AnomalyCategory.MATERIAL_UNAVAILABLE.value,
                        "target_schedule_id": s["schedule_id"],
                        "order_id": s["order_id"],
                        "operation_id": s["operation_id"],
                        "machine_id": s["machine_id"],
                        "description": f"Operation {s['operation_id']} starts at {s['scheduled_start_time']} before material {req_mat} earliest lot arrives at {earliest_lot_avail.isoformat()}",
                        "expected_flag": AnomalyCategory.MATERIAL_UNAVAILABLE.value,
                    })
                    anomaly_id += 1
                    used_schedule_ids.add(s["schedule_id"])
                    used_order_ids.add(s["order_id"])
                    mat_count += 1
                    if mat_count >= 2:
                        break

        # -------------------------------------------------------------
        # Anomaly 3: CALENDAR_VIOLATION (2 instances)
        # -------------------------------------------------------------
        cal_count = 0
        for s in schedules:
            if s["schedule_id"] in used_schedule_ids or s["order_id"] in used_order_ids:
                continue
            op = ops_by_id.get(s["operation_id"])
            # Target seq 40 (last operation of an order) to avoid cascading precedence violations
            if op and op["sequence_num"] == 40:
                curr_start = datetime.fromisoformat(s["scheduled_start_time"])
                night_start = curr_start.replace(hour=2, minute=0, second=0)
                # Ensure night_start is after current start
                if night_start <= curr_start:
                    night_start += timedelta(days=1)
                s["scheduled_start_time"] = night_start.isoformat()
                s["scheduled_end_time"] = (night_start + timedelta(minutes=s["execution_duration_minutes"])).isoformat()
                s["changeover_start_time"] = night_start.isoformat()

                ground_truth.append({
                    "anomaly_id": f"ANOM-{anomaly_id:04d}",
                    "anomaly_category": AnomalyCategory.CALENDAR_VIOLATION.value,
                    "target_schedule_id": s["schedule_id"],
                    "order_id": s["order_id"],
                    "operation_id": s["operation_id"],
                    "machine_id": s["machine_id"],
                    "description": f"Operation {s['operation_id']} scheduled on {s['machine_id']} during inactive off-shift period ({night_start.isoformat()})",
                    "expected_flag": AnomalyCategory.CALENDAR_VIOLATION.value,
                })
                anomaly_id += 1
                used_schedule_ids.add(s["schedule_id"])
                used_order_ids.add(s["order_id"])
                cal_count += 1
                if cal_count >= 2:
                    break

        # -------------------------------------------------------------
        # Anomaly 4: CHANGEOVER_OMITTED (2 instances)
        # -------------------------------------------------------------
        chg_count = 0
        # Sort schedules by machine and start time
        schedules_sorted = sorted(schedules, key=lambda x: (x["machine_id"], x["scheduled_start_time"]))
        for i in range(1, len(schedules_sorted)):
            curr_s = schedules_sorted[i]
            prev_s = schedules_sorted[i - 1]
            if curr_s["schedule_id"] in used_schedule_ids or prev_s["schedule_id"] in used_schedule_ids:
                continue
            if curr_s["order_id"] in used_order_ids or prev_s["order_id"] in used_order_ids:
                continue
            if curr_s["machine_id"] == prev_s["machine_id"]:
                curr_order = orders_by_id.get(curr_s["order_id"])
                prev_order = orders_by_id.get(prev_s["order_id"])
                if curr_order and prev_order:
                    prev_fam = prod_to_family.get(prev_order["product_id"])
                    curr_fam = prod_to_family.get(curr_order["product_id"])
                    if prev_fam and curr_fam and prev_fam != curr_fam:
                        prev_end = datetime.fromisoformat(prev_s["scheduled_end_time"])
                        curr_dur = curr_s["execution_duration_minutes"]
                        # Set curr_s start exactly equal to prev_s end (zero changeover)
                        curr_s["changeover_start_time"] = prev_end.isoformat()
                        curr_s["scheduled_start_time"] = prev_end.isoformat()
                        curr_s["changeover_duration_minutes"] = 0
                        curr_s["scheduled_end_time"] = (prev_end + timedelta(minutes=curr_dur)).isoformat()

                        ground_truth.append({
                            "anomaly_id": f"ANOM-{anomaly_id:04d}",
                            "anomaly_category": AnomalyCategory.CHANGEOVER_OMITTED.value,
                            "target_schedule_id": curr_s["schedule_id"],
                            "order_id": curr_s["order_id"],
                            "operation_id": curr_s["operation_id"],
                            "machine_id": curr_s["machine_id"],
                            "description": f"Product switch on {curr_s['machine_id']} from order {prev_s['order_id']} ({prev_fam}) to {curr_s['order_id']} ({curr_fam}) scheduled with zero changeover buffer",
                            "expected_flag": AnomalyCategory.CHANGEOVER_OMITTED.value,
                        })
                        anomaly_id += 1
                        used_schedule_ids.add(curr_s["schedule_id"])
                        used_order_ids.add(curr_s["order_id"])
                        chg_count += 1
                        if chg_count >= 2:
                            break

        # -------------------------------------------------------------
        # Anomaly 5: MACHINE_OVERLAP (2 instances)
        # -------------------------------------------------------------
        overlap_count = 0
        # Re-sort to pick from different machines
        mach_scheds: Dict[str, List[dict]] = {}
        for s in schedules:
            mach_scheds.setdefault(s["machine_id"], []).append(s)

        for m_id, m_list in mach_scheds.items():
            if len(m_list) >= 3:
                for i in range(1, len(m_list) - 1):
                    s_prev = m_list[i - 1]
                    s_target = m_list[i]
                    s_next = m_list[i + 1]
                    if (s_target["schedule_id"] in used_schedule_ids or
                        s_prev["schedule_id"] in used_schedule_ids or
                        s_next["schedule_id"] in used_schedule_ids):
                        continue
                    if (s_target["order_id"] in used_order_ids or
                        s_prev["order_id"] in used_order_ids):
                        continue

                    # Pick jobs with the SAME product family to avoid incidental changeover violations!
                    curr_order = orders_by_id.get(s_target["order_id"])
                    prev_order = orders_by_id.get(s_prev["order_id"])
                    if not curr_order or not prev_order or curr_order["product_id"] != prev_order["product_id"]:
                        continue

                    prev_st = datetime.fromisoformat(s_prev["scheduled_start_time"])
                    prev_et = datetime.fromisoformat(s_prev["scheduled_end_time"])
                    # Shift target to overlap right in the middle of prev's execution window
                    overlap_st = prev_st + (prev_et - prev_st) / 2
                    s_target["scheduled_start_time"] = overlap_st.isoformat()
                    s_target["scheduled_end_time"] = (overlap_st + timedelta(minutes=s_target["execution_duration_minutes"])).isoformat()
                    s_target["changeover_start_time"] = overlap_st.isoformat()
                    s_target["changeover_duration_minutes"] = 0

                    ground_truth.append({
                        "anomaly_id": f"ANOM-{anomaly_id:04d}",
                        "anomaly_category": AnomalyCategory.MACHINE_OVERLAP.value,
                        "target_schedule_id": s_target["schedule_id"],
                        "order_id": s_target["order_id"],
                        "operation_id": s_target["operation_id"],
                        "machine_id": s_target["machine_id"],
                        "description": f"Operation {s_target['operation_id']} overlaps with {s_prev['operation_id']} on {s_target['machine_id']}",
                        "expected_flag": AnomalyCategory.MACHINE_OVERLAP.value,
                    })
                    anomaly_id += 1
                    used_schedule_ids.add(s_target["schedule_id"])
                    used_order_ids.add(s_target["order_id"])
                    overlap_count += 1
                    if overlap_count >= 2:
                        break
            if overlap_count >= 2:
                break

        return schedules, ground_truth

    def to_dataframes(self) -> Dict[str, pd.DataFrame]:
        return {
            "products": pd.DataFrame(self.products),
            "routings": pd.DataFrame(self.routings),
            "operations": pd.DataFrame(self.operations),
            "machines": pd.DataFrame(self.machines),
            "machine_calendar": pd.DataFrame(self.machine_calendars),
            "materials": pd.DataFrame(self.materials),
            "inventory_lots": pd.DataFrame(self.inventory_lots),
            "production_orders": pd.DataFrame(self.production_orders),
            "changeover_matrix": pd.DataFrame(self.changeover_matrix),
        }

    def export_data(self, output_dir: str = "data"):
        """Save CSV, JSON, and SQLite files."""
        os.makedirs(output_dir, exist_ok=True)
        dfs = self.to_dataframes()

        for name, df in dfs.items():
            csv_path = os.path.join(output_dir, f"{name}.csv")
            df.to_csv(csv_path, index=False)

        # Export SQLite database
        db_path = os.path.join(output_dir, "factory_schedule.db")
        conn = sqlite3.connect(db_path)
        for name, df in dfs.items():
            df.to_sql(name, conn, if_exists="replace", index=False)
        conn.close()

        # Export Manifest
        manifest = {
            "generated_at": datetime.now().isoformat(),
            "fixed_seed": self.seed,
            "mode": self.mode,
            "counts": {name: len(df) for name, df in dfs.items()},
        }
        with open(os.path.join(output_dir, "manifest.json"), "w") as f:
            json.dump(manifest, f, indent=2)

        return dfs
