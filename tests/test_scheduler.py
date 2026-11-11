"""
Automated Tests for Scheduling Engine, Machine Allocation, and CP-SAT Solver.
"""

from datetime import datetime
import pandas as pd
import pytest

from src.data_generator import DataGenerator, FIXED_SEED
from src.material_manager import MaterialManager
from src.metrics import MetricsCalculator
from src.scheduler import ProductionScheduler


@pytest.fixture(scope="module")
def setup_scheduler():
    gen = DataGenerator(mode="starter", seed=FIXED_SEED)
    dfs = gen.generate_all()

    mat_mgr = MaterialManager(dfs["materials"], dfs["inventory_lots"])
    scheduler = ProductionScheduler(
        products_df=dfs["products"],
        routings_df=dfs["routings"],
        operations_df=dfs["operations"],
        machines_df=dfs["machines"],
        machine_calendar_df=dfs["machine_calendar"],
        changeover_matrix_df=dfs["changeover_matrix"],
        material_manager=mat_mgr,
    )
    schedules_list, schedules_df, infeasible = scheduler.schedule_heuristic(dfs["production_orders"])
    return {
        "dfs": dfs,
        "scheduler": scheduler,
        "schedules_df": schedules_df,
        "infeasible": infeasible,
    }


def test_schedule_completeness(setup_scheduler):
    """Verifies all 100 starter operations are scheduled."""
    schedules_df = setup_scheduler["schedules_df"]
    assert len(schedules_df) == 100, f"Expected 100 operations scheduled, found {len(schedules_df)}"
    assert len(setup_scheduler["infeasible"]) == 0


def test_machine_eligibility(setup_scheduler):
    """Verifies that every operation is scheduled on a machine listed in eligible_machine_ids."""
    schedules_df = setup_scheduler["schedules_df"]
    ops_df = setup_scheduler["dfs"]["operations"]
    ops_map = dict(zip(ops_df["operation_id"], ops_df["eligible_machine_ids"]))

    for _, row in schedules_df.iterrows():
        op_id = row["operation_id"]
        assigned_mach = row["machine_id"]
        eligible = ops_map[op_id].split(";")
        assert assigned_mach in eligible, f"Operation {op_id} assigned to ineligible machine {assigned_mach}"


def test_operation_precedence(setup_scheduler):
    """Verifies that operation n+1 starts after operation n ends."""
    schedules_df = setup_scheduler["schedules_df"]
    ops_df = setup_scheduler["dfs"]["operations"]
    pred_map = dict(zip(ops_df["operation_id"], ops_df["predecessor_operation_id"]))

    sched_by_op = {row["operation_id"]: row for _, row in schedules_df.iterrows()}

    for op_id, row in sched_by_op.items():
        pred_id = pred_map.get(op_id)
        if pred_id and pred_id != "NONE" and pred_id in sched_by_op:
            pred_end = datetime.fromisoformat(str(sched_by_op[pred_id]["scheduled_end_time"]))
            curr_start = datetime.fromisoformat(str(row["scheduled_start_time"]))
            assert curr_start >= pred_end, f"Precedence violation: {op_id} started at {curr_start} before {pred_id} ended at {pred_end}"


def test_metrics_computability(setup_scheduler):
    """Verifies that makespan, lateness, utilization and costs are computable and within valid bounds."""
    dfs = setup_scheduler["dfs"]
    schedules_df = setup_scheduler["schedules_df"]

    metrics_calc = MetricsCalculator(
        orders_df=dfs["production_orders"],
        operations_df=dfs["operations"],
        schedules_df=schedules_df,
        machines_df=dfs["machines"],
        calendar_df=dfs["machine_calendar"],
    )
    metrics = metrics_calc.calculate_all_metrics()

    assert metrics["makespan_hours"] > 0
    assert 0.0 <= metrics["on_time_delivery_pct"] <= 100.0
    assert 0.0 <= metrics["productive_utilization_pct"] <= 100.0
    assert metrics["total_operating_cost_usd"] > 0.0
    assert metrics["orders_scheduled"] == 25


def test_cp_sat_solver(setup_scheduler):
    """Verifies that Google OR-Tools CP-SAT exact solver solves a small scheduling problem."""
    scheduler = setup_scheduler["scheduler"]
    orders_df = setup_scheduler["dfs"]["production_orders"].head(5)
    # Test CP-SAT
    cp_schedule = scheduler.solve_cp_sat(orders_df, time_limit_seconds=10)
    assert cp_schedule is not None
    # 5 orders * 4 ops = 20 operations
    assert len(cp_schedule) == 20
