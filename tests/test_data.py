"""
Automated Tests for Data Integrity, Schema Conformance, and Fixed-Seed Reproducibility.
"""

import hashlib
import pandas as pd
import pytest

from src.data_generator import DataGenerator, FIXED_SEED
from src.material_manager import MaterialManager


@pytest.fixture(scope="module")
def starter_data():
    gen = DataGenerator(mode="starter", seed=FIXED_SEED)
    return gen.generate_all()


def test_starter_volume_counts(starter_data):
    """Verifies row counts in starter scale."""
    assert len(starter_data["products"]) == 10
    assert len(starter_data["routings"]) == 10
    assert len(starter_data["operations"]) == 100
    assert len(starter_data["machines"]) == 14
    assert len(starter_data["materials"]) == 20
    assert len(starter_data["production_orders"]) == 25
    assert len(starter_data["changeover_matrix"]) == 125


def test_primary_key_uniqueness(starter_data):
    """Validates that primary keys in all master and transaction tables are 100% unique."""
    pk_map = {
        "products": "product_id",
        "routings": "routing_id",
        "operations": "operation_id",
        "machines": "machine_id",
        "machine_calendar": "calendar_id",
        "materials": "material_id",
        "inventory_lots": "lot_id",
        "production_orders": "order_id",
        "changeover_matrix": "changeover_id",
    }
    for table_name, pk_col in pk_map.items():
        df = starter_data[table_name]
        assert df[pk_col].is_unique, f"Duplicate primary key found in {table_name}.{pk_col}"


def test_foreign_key_referential_integrity(starter_data):
    """Validates that foreign key references exist in parent tables."""
    # 1. Routing -> Product
    prod_ids = set(starter_data["products"]["product_id"])
    assert set(starter_data["routings"]["product_id"]).issubset(prod_ids)

    # 2. ProductionOrder -> Product & Routing
    route_ids = set(starter_data["routings"]["routing_id"])
    assert set(starter_data["production_orders"]["product_id"]).issubset(prod_ids)
    assert set(starter_data["production_orders"]["routing_id"]).issubset(route_ids)

    # 3. Operation -> Order & Routing
    order_ids = set(starter_data["production_orders"]["order_id"])
    assert set(starter_data["operations"]["order_id"]).issubset(order_ids)
    assert set(starter_data["operations"]["routing_id"]).issubset(route_ids)

    # 4. InventoryLot -> Material
    mat_ids = set(starter_data["materials"]["material_id"])
    assert set(starter_data["inventory_lots"]["material_id"]).issubset(mat_ids)

    # 5. MachineCalendar -> Machine
    mach_ids = set(starter_data["machines"]["machine_id"])
    assert set(starter_data["machine_calendar"]["machine_id"]).issubset(mach_ids)


def test_inventory_arithmetic_reconciliation(starter_data):
    """Verifies arithmetic equality: available + allocated == initial."""
    mat_mgr = MaterialManager(starter_data["materials"], starter_data["inventory_lots"])
    reconciled_df = mat_mgr.get_updated_inventory_lots_df()
    diff = (reconciled_df["available_quantity"] + reconciled_df["allocated_quantity"]) - reconciled_df["initial_quantity"]
    assert (diff.abs() < 1e-4).all(), "Inventory lot arithmetic reconciliation failed"


def test_date_ordering(starter_data):
    """Verifies that release_date < due_date and start_time < end_time."""
    orders = starter_data["production_orders"]
    assert (pd.to_datetime(orders["release_date"]) < pd.to_datetime(orders["due_date"])).all()

    cal = starter_data["machine_calendar"]
    assert (pd.to_datetime(cal["start_time"]) < pd.to_datetime(cal["end_time"])).all()


def test_fixed_seed_reproducibility():
    """Demonstrates that generating twice with seed 20261022 produces bitwise identical CSVs/checksums."""
    gen1 = DataGenerator(mode="starter", seed=FIXED_SEED)
    dfs1 = gen1.generate_all()

    gen2 = DataGenerator(mode="starter", seed=FIXED_SEED)
    dfs2 = gen2.generate_all()

    for name in dfs1:
        csv1 = dfs1[name].to_csv(index=False)
        csv2 = dfs2[name].to_csv(index=False)

        hash1 = hashlib.md5(csv1.encode("utf-8")).hexdigest()
        hash2 = hashlib.md5(csv2.encode("utf-8")).hexdigest()

        assert hash1 == hash2, f"Reproducibility mismatch in table: {name}"
        assert len(dfs1[name]) == len(dfs2[name]), f"Row count mismatch in table: {name}"
