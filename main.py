"""
Main CLI Pipeline for YottaFlex Production Scheduling System
Executes synthetic data generation, scheduling, constraint validation,
anomaly injection, metrics calculation, and dashboard rendering.
"""

import argparse
import json
import os
import sys
from datetime import datetime
import pandas as pd

from src.constraint_validator import ConstraintValidator
from src.data_generator import DataGenerator, FIXED_SEED
from src.material_manager import MaterialManager
from src.metrics import MetricsCalculator
from src.scheduler import ProductionScheduler
from src.visualization import ScheduleVisualizer


def run_pipeline(
    mode: str = "full",
    seed: int = FIXED_SEED,
    data_dir: str = "data",
    outputs_dir: str = "outputs",
    sync_postgres: bool = False,
):
    print("=" * 75)
    print("  YottaFlex Smart Manufacturing: Production Scheduling Engine")
    print("=" * 75)
    print(f"[*] Configuration: Mode = {mode.upper()} | Seed = {seed}")
    print(f"[*] Data Directory = '{data_dir}' | Outputs Directory = '{outputs_dir}'\n")

    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(outputs_dir, exist_ok=True)

    # -------------------------------------------------------------------------
    # STEP 1: Data Generation
    # -------------------------------------------------------------------------
    print(">>> STEP 1: Generating Master & Transactional Data...")
    gen = DataGenerator(mode=mode, seed=seed)
    dfs = gen.generate_all()

    for name, df in dfs.items():
        print(f"    - {name:<22}: {len(df):>5} records")

    # -------------------------------------------------------------------------
    # STEP 2: Material Manager Initialization & Allocation
    # -------------------------------------------------------------------------
    print("\n>>> STEP 2: Initializing Material Manager...")
    mat_mgr = MaterialManager(
        materials_df=dfs["materials"],
        inventory_lots_df=dfs["inventory_lots"],
    )

    # -------------------------------------------------------------------------
    # STEP 3: Production Scheduling
    # -------------------------------------------------------------------------
    print("\n>>> STEP 3: Running Production Scheduling Engine...")
    scheduler = ProductionScheduler(
        products_df=dfs["products"],
        routings_df=dfs["routings"],
        operations_df=dfs["operations"],
        machines_df=dfs["machines"],
        machine_calendar_df=dfs["machine_calendar"],
        changeover_matrix_df=dfs["changeover_matrix"],
        material_manager=mat_mgr,
    )

    schedules_list, schedules_df, infeasible = scheduler.schedule_heuristic(
        orders_df=dfs["production_orders"]
    )
    print(f"    - Successfully Scheduled Operations : {len(schedules_df):>5}")
    print(f"    - Infeasible / Shortage Orders       : {len(infeasible):>5}")
    if infeasible:
        print(f"      [!] Infeasibility details logged for {len(infeasible)} orders.")

    # Update inventory lots with reconciled allocations
    updated_lots_df = mat_mgr.get_updated_inventory_lots_df()
    dfs["inventory_lots"] = updated_lots_df

    # -------------------------------------------------------------------------
    # STEP 4: Independent Constraint Validation (Baseline Schedule)
    # -------------------------------------------------------------------------
    print("\n>>> STEP 4: Auditing Baseline Schedule with Constraint Validator...")
    validator = ConstraintValidator(
        products_df=dfs["products"],
        operations_df=dfs["operations"],
        orders_df=dfs["production_orders"],
        machines_df=dfs["machines"],
        calendar_df=dfs["machine_calendar"],
        inventory_lots_df=updated_lots_df,
        changeover_df=dfs["changeover_matrix"],
    )

    clean_violations, clean_counts = validator.validate_schedule(schedules_df)
    if clean_violations.empty:
        print("    [+] BASELINE SCHEDULE AUDIT: 100% FEASIBLE (0 VIOLATIONS)")
    else:
        print(f"    [!] Baseline schedule has {len(clean_violations)} violations: {clean_counts}")

    # -------------------------------------------------------------------------
    # STEP 5: Metric Calculation & Derivations
    # -------------------------------------------------------------------------
    print("\n>>> STEP 5: Computing Factory Operational Metrics...")
    metrics_calc = MetricsCalculator(
        orders_df=dfs["production_orders"],
        operations_df=dfs["operations"],
        schedules_df=schedules_df,
        machines_df=dfs["machines"],
        calendar_df=dfs["machine_calendar"],
    )
    metrics = metrics_calc.calculate_all_metrics()

    print(f"    - Total Makespan             : {metrics['makespan_hours']} hrs ({metrics['makespan_days']} days)")
    print(f"    - On-Time Delivery (OTD)     : {metrics['on_time_delivery_pct']}%")
    print(f"    - Average Order Lateness     : {metrics['average_lateness_hours']} hrs")
    print(f"    - Machine Productive Util.   : {metrics['productive_utilization_pct']}%")
    print(f"    - Setup / Changeover Share   : {metrics['changeover_pct']}%")
    print(f"    - Total Operating Cost       : ${metrics['total_operating_cost_usd']:,.2f}")

    # Save metrics JSON
    metrics_path = os.path.join(outputs_dir, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    # -------------------------------------------------------------------------
    # STEP 6: Edge Case Injection & Ground Truth Anomaly Testing
    # -------------------------------------------------------------------------
    print("\n>>> STEP 6: Injecting 5 Negative Edge Cases for Validation Testing...")
    corrupted_schedules_list, ground_truth_list = gen.inject_edge_cases(
        base_schedules=schedules_list,
        inventory_lots_df=updated_lots_df,
    )
    corrupted_schedules_df = pd.DataFrame(corrupted_schedules_list)
    ground_truth_df = pd.DataFrame(ground_truth_list)

    print(f"    - Injected Ground Truth Anomalies    : {len(ground_truth_df):>5}")
    for _, gt in ground_truth_df.iterrows():
        print(f"      * [{gt['anomaly_category']:<22}] {gt['target_schedule_id']} : {gt['description']}")

    # Audit the test schedule
    test_violations, test_counts = validator.validate_schedule(corrupted_schedules_df)
    print(f"\n    - Auditor Detected Violations        : {len(test_violations):>5}")
    for cat, count in test_counts.items():
        print(f"      * {cat:<22}: {count}")

    # Evaluate Precision, Recall, F1 against Ground Truth
    eval_scores = validator.evaluate_against_ground_truth(
        detected_violations_df=test_violations,
        ground_truth_df=ground_truth_df,
    )
    print(f"\n    [+] Anomaly Detection Precision      : {eval_scores['precision'] * 100:.1f}%")
    print(f"    [+] Anomaly Detection Recall         : {eval_scores['recall'] * 100:.1f}%")
    print(f"    [+] Anomaly Detection F1-Score       : {eval_scores['f1_score'] * 100:.1f}%")

    # -------------------------------------------------------------------------
    # STEP 7: Exporting Datasets, Database & Outputs
    # -------------------------------------------------------------------------
    print("\n>>> STEP 7: Exporting Final Tables, SQLite Database, and Reports...")
    dfs["operation_schedule"] = schedules_df
    dfs["ground_truth"] = ground_truth_df

    # Export CSVs and SQLite
    for name, df in dfs.items():
        df.to_csv(os.path.join(data_dir, f"{name}.csv"), index=False)

    import sqlite3
    db_path = os.path.join(data_dir, "factory_schedule.db")
    conn = sqlite3.connect(db_path)
    for name, df in dfs.items():
        df.to_sql(name, conn, if_exists="replace", index=False)
    conn.close()

    # Export violations and schedule to outputs
    schedules_df.to_csv(os.path.join(outputs_dir, "schedule.csv"), index=False)
    test_violations.to_csv(os.path.join(outputs_dir, "violations.csv"), index=False)

    # Sync to PostgreSQL if requested
    if sync_postgres:
        print("\n>>> STEP 7b: Syncing to PostgreSQL Database (smart_manufacturing_aps)...")
        from src.db_postgres import PostgresManager, export_postgres_sql_file
        export_postgres_sql_file(os.path.join(data_dir, "schema_postgres.sql"))
        pg_mgr = PostgresManager()
        pg_mgr.init_schema()
        pg_counts = pg_mgr.sync_data(data_dir=data_dir, outputs_dir=outputs_dir)
        print("    [+] PostgreSQL Synchronization Complete:")
        for tbl, cnt in pg_counts.items():
            print(f"        * {tbl:<22}: {cnt} rows")

    # -------------------------------------------------------------------------
    # STEP 8: Rendering Executive Dashboard Image
    # -------------------------------------------------------------------------
    print("\n>>> STEP 8: Generating Executive Visual Dashboard...")
    visualizer = ScheduleVisualizer(
        schedules_df=schedules_df,
        orders_df=dfs["production_orders"],
        machines_df=dfs["machines"],
        products_df=dfs["products"],
    )
    img_path = visualizer.generate_dashboard_image(
        metrics=metrics,
        violations_summary=test_counts,
        output_path=os.path.join(outputs_dir, "dashboard.png"),
    )
    print(f"    [+] Visual dashboard saved to: {img_path}")

    # Manifest and Validation Summary
    manifest = {
        "pipeline_completed_at": datetime.now().isoformat(),
        "fixed_seed": seed,
        "mode": mode,
        "record_counts": {k: len(v) for k, v in dfs.items()},
        "metrics": metrics,
        "evaluation_scores": eval_scores,
    }
    with open(os.path.join(data_dir, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)

    print("\n" + "=" * 75)
    print("  [SUCCESS] End-to-End Pipeline Completed Successfully!")
    print("=" * 75)
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="YottaFlex Production Scheduling Pipeline")
    parser.add_argument("--mode", type=str, default="full", choices=["full", "starter"], help="Dataset volume mode")
    parser.add_argument("--seed", type=int, default=FIXED_SEED, help="Deterministic random seed")
    parser.add_argument("--data-dir", type=str, default="data", help="Directory to save generated CSVs and DB")
    parser.add_argument("--outputs-dir", type=str, default="outputs", help="Directory to save outputs and plots")
    parser.add_argument("--postgres", action="store_true", help="Sync schema and data to local PostgreSQL database")
    args = parser.parse_args()

    run_pipeline(
        mode=args.mode,
        seed=args.seed,
        data_dir=args.data_dir,
        outputs_dir=args.outputs_dir,
        sync_postgres=args.postgres,
    )

