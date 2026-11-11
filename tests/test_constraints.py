"""
Automated Tests for Constraint Validator and Negative Edge-Case Anomaly Detection.
"""

from datetime import datetime, timedelta
import pandas as pd
import pytest

from src.constraint_validator import ConstraintValidator
from src.data_generator import DataGenerator, FIXED_SEED
from src.material_manager import MaterialManager
from src.models import AnomalyCategory
from src.scheduler import ProductionScheduler


@pytest.fixture(scope="module")
def setup_validation():
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
    schedules_list, schedules_df, _ = scheduler.schedule_heuristic(dfs["production_orders"])

    validator = ConstraintValidator(
        products_df=dfs["products"],
        operations_df=dfs["operations"],
        orders_df=dfs["production_orders"],
        machines_df=dfs["machines"],
        calendar_df=dfs["machine_calendar"],
        inventory_lots_df=dfs["inventory_lots"],
        changeover_df=dfs["changeover_matrix"],
    )

    corrupted_list, ground_truth_list = gen.inject_edge_cases(schedules_list, dfs["inventory_lots"])
    corrupted_df = pd.DataFrame(corrupted_list)
    ground_truth_df = pd.DataFrame(ground_truth_list)

    return {
        "validator": validator,
        "clean_schedules_df": schedules_df,
        "corrupted_df": corrupted_df,
        "ground_truth_df": ground_truth_df,
    }


def test_clean_schedule_has_zero_violations(setup_validation):
    """Verifies that the validator reports zero violations for an untouched, valid schedule."""
    validator = setup_validation["validator"]
    clean_df = setup_validation["clean_schedules_df"]

    violations_df, counts = validator.validate_schedule(clean_df)
    assert violations_df.empty, f"Expected 0 violations on clean schedule, found: {counts}"


def test_detects_all_five_anomaly_categories(setup_validation):
    """Verifies that all 5 required edge cases are present in ground truth and detected."""
    gt_df = setup_validation["ground_truth_df"]
    validator = setup_validation["validator"]
    corrupted_df = setup_validation["corrupted_df"]

    expected_categories = {
        AnomalyCategory.MACHINE_OVERLAP.value,
        AnomalyCategory.PRECEDENCE_VIOLATION.value,
        AnomalyCategory.MATERIAL_UNAVAILABLE.value,
        AnomalyCategory.CALENDAR_VIOLATION.value,
        AnomalyCategory.CHANGEOVER_OMITTED.value,
    }

    assert set(gt_df["anomaly_category"]) == expected_categories

    violations_df, counts = validator.validate_schedule(corrupted_df)
    detected_cats = set(counts.keys())
    assert expected_categories.issubset(detected_cats), f"Missing categories: {expected_categories - detected_cats}"


def test_anomaly_evaluation_metrics(setup_validation):
    """Verifies that precision and recall against ground truth meet high acceptance thresholds."""
    validator = setup_validation["validator"]
    corrupted_df = setup_validation["corrupted_df"]
    gt_df = setup_validation["ground_truth_df"]

    violations_df, _ = validator.validate_schedule(corrupted_df)
    eval_res = validator.evaluate_against_ground_truth(violations_df, gt_df)

    assert eval_res["recall"] >= 0.90, f"Recall too low: {eval_res['recall']}"
    assert eval_res["precision"] >= 0.90, f"Precision too low: {eval_res['precision']}"
    assert eval_res["f1_score"] >= 0.90, f"F1 score too low: {eval_res['f1_score']}"

