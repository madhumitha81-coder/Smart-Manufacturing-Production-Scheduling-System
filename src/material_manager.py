"""
Material and Inventory Management for YottaFlex
Handles lot allocation, availability date lookups, and inventory reconciliation.
"""

from datetime import datetime
from typing import Dict, List, Optional, Tuple
import pandas as pd


class MaterialManager:
    """
    Manages material availability, lot allocations, and inventory traceability.
    """

    def __init__(self, materials_df: pd.DataFrame, inventory_lots_df: pd.DataFrame):
        self.materials_df = materials_df.copy()
        # Keep internal working state of inventory lots
        self.lots = inventory_lots_df.copy().to_dict(orient="records")
        # Lookup by material_id -> list of lot dicts sorted by availability_date
        self.lots_by_material: Dict[str, List[dict]] = {}
        for lot in self.lots:
            mat_id = lot["material_id"]
            self.lots_by_material.setdefault(mat_id, []).append(lot)
        for mat_id in self.lots_by_material:
            self.lots_by_material[mat_id].sort(
                key=lambda x: datetime.fromisoformat(str(x["availability_date"]))
            )

        self.allocation_log: List[dict] = []

    def allocate_material(
        self,
        material_id: str,
        required_qty: float,
        order_id: str,
        operation_id: str,
        earliest_permitted_date: datetime,
    ) -> Tuple[bool, Optional[datetime], str]:
        """
        Allocates required material quantity from available lots using FIFO on availability date.
        Returns:
            (is_allocated, earliest_material_available_date, status_message)
        """
        if material_id == "NONE" or required_qty <= 0:
            return True, earliest_permitted_date, "No raw material required"

        lots = self.lots_by_material.get(material_id, [])
        if not lots:
            return False, None, f"Material {material_id} has no inventory lots"

        # Check total available quantity
        total_available = sum(lot["available_quantity"] for lot in lots)
        if total_available < required_qty:
            return False, None, f"Insufficient stock: required {required_qty}, available {total_available}"

        # Allocate across lots in chronological order of availability
        qty_needed = required_qty
        latest_lot_avail_dt = earliest_permitted_date

        for lot in lots:
            if lot["available_quantity"] <= 0:
                continue
            alloc = min(qty_needed, lot["available_quantity"])
            lot["allocated_quantity"] += alloc
            lot["available_quantity"] -= alloc
            qty_needed -= alloc

            lot_avail_dt = datetime.fromisoformat(str(lot["availability_date"]))
            if lot_avail_dt > latest_lot_avail_dt:
                latest_lot_avail_dt = lot_avail_dt

            self.allocation_log.append({
                "lot_id": lot["lot_id"],
                "material_id": material_id,
                "order_id": order_id,
                "operation_id": operation_id,
                "allocated_quantity": alloc,
                "lot_availability_date": lot["availability_date"],
            })

            if qty_needed <= 0:
                break

        return True, latest_lot_avail_dt, "Material successfully allocated"

    def get_updated_inventory_lots_df(self) -> pd.DataFrame:
        """Returns dataframe with updated allocations and reconciled balances."""
        df = pd.DataFrame(self.lots)
        # Verify reconciliation
        df["reconciled"] = (
            abs((df["allocated_quantity"] + df["available_quantity"]) - df["initial_quantity"]) < 1e-4
        )
        return df

    def get_allocation_audit_log(self) -> pd.DataFrame:
        """Returns complete audit trail of material allocations."""
        return pd.DataFrame(self.allocation_log)
