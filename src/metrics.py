"""
Performance Measurement and KPI Calculation Engine for YottaFlex
Calculates Makespan, Order Lateness, On-Time Delivery Rate,
Machine Utilization Breakdown, and Financial Summaries.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import pandas as pd


class MetricsCalculator:
    """
    Computes factory operational and financial metrics directly from source tables.
    """

    def __init__(
        self,
        orders_df: pd.DataFrame,
        operations_df: pd.DataFrame,
        schedules_df: pd.DataFrame,
        machines_df: pd.DataFrame,
        calendar_df: pd.DataFrame,
    ):
        self.orders_df = orders_df.copy()
        self.operations_df = operations_df.copy()
        self.schedules_df = schedules_df.copy()
        self.machines_df = machines_df.copy()
        self.calendar_df = calendar_df.copy()

    def calculate_all_metrics(self) -> Dict:
        """Computes comprehensive factory operational KPIs."""
        if self.schedules_df.empty:
            return {"status": "NO_SCHEDULES_FOUND"}

        # Convert date columns
        self.schedules_df["start_dt"] = pd.to_datetime(self.schedules_df["scheduled_start_time"])
        self.schedules_df["end_dt"] = pd.to_datetime(self.schedules_df["scheduled_end_time"])
        self.orders_df["due_dt"] = pd.to_datetime(self.orders_df["due_date"])
        self.orders_df["release_dt"] = pd.to_datetime(self.orders_df["release_date"])

        # 1. Makespan
        earliest_start = self.schedules_df["start_dt"].min()
        latest_end = self.schedules_df["end_dt"].max()
        makespan_hours = (latest_end - earliest_start).total_seconds() / 3600.0

        # 2. Order Delivery & Lateness Analysis
        # An order's completion date is the max end_dt of its operations
        order_comp = self.schedules_df.groupby("order_id")["end_dt"].max().reset_index()
        order_comp.rename(columns={"end_dt": "completion_dt"}, inplace=True)

        merged_orders = pd.merge(self.orders_df, order_comp, on="order_id", how="left")
        merged_orders["scheduled"] = merged_orders["completion_dt"].notna()

        # Calculate lateness in hours: max(0, completion_dt - due_dt)
        lateness_hours = []
        is_on_time = []
        for _, row in merged_orders.iterrows():
            if pd.isna(row["completion_dt"]):
                continue
            diff_hours = (row["completion_dt"] - row["due_dt"]).total_seconds() / 3600.0
            lateness_hours.append(max(0.0, diff_hours))
            is_on_time.append(diff_hours <= 0.0)

        total_orders_scheduled = len(is_on_time)
        on_time_count = sum(is_on_time)
        on_time_delivery_pct = round((on_time_count / total_orders_scheduled * 100.0) if total_orders_scheduled > 0 else 0.0, 2)
        avg_lateness_hours = round(float(pd.Series(lateness_hours).mean()) if lateness_hours else 0.0, 2)
        max_lateness_hours = round(float(pd.Series(lateness_hours).max()) if lateness_hours else 0.0, 2)

        # 3. Machine Utilization Breakdown
        # Productive run minutes, Changeover minutes, Available shift minutes
        productive_minutes = float(self.schedules_df["execution_duration_minutes"].sum())
        changeover_minutes = float(self.schedules_df["changeover_duration_minutes"].sum())

        # Total available shift hours from machine calendar
        avail_cal = self.calendar_df[self.calendar_df["is_available"] == True].copy()
        avail_cal["st"] = pd.to_datetime(avail_cal["start_time"])
        avail_cal["et"] = pd.to_datetime(avail_cal["end_time"])
        total_shift_minutes = float((avail_cal["et"] - avail_cal["st"]).dt.total_seconds().sum() / 60.0)

        # In case total_shift_minutes is 0, estimate from horizon
        if total_shift_minutes == 0:
            total_shift_minutes = len(self.machines_df) * makespan_hours * 60.0

        productive_utilization_pct = round(min(100.0, (productive_minutes / total_shift_minutes) * 100.0), 2)
        changeover_pct = round((changeover_minutes / total_shift_minutes) * 100.0, 2)
        idle_pct = round(max(0.0, 100.0 - productive_utilization_pct - changeover_pct), 2)

        # 4. Hourly Machine Operating Cost
        merged_mach = pd.merge(self.schedules_df, self.machines_df[["machine_id", "hourly_rate"]], on="machine_id", how="left")
        merged_mach["operating_cost"] = (merged_mach["execution_duration_minutes"] / 60.0) * merged_mach["hourly_rate"]
        total_operating_cost = round(float(merged_mach["operating_cost"].sum()), 2)

        # 5. Workcenter summaries
        wc_summary = {}
        merged_wc = pd.merge(self.schedules_df, self.machines_df[["machine_id", "workcenter"]], on="machine_id", how="left")
        for wc, grp in merged_wc.groupby("workcenter"):
            wc_summary[str(wc)] = {
                "operations_count": len(grp),
                "total_run_hours": round(float(grp["execution_duration_minutes"].sum() / 60.0), 1),
                "total_setup_hours": round(float(grp["changeover_duration_minutes"].sum() / 60.0), 1),
            }

        return {
            "makespan_hours": round(makespan_hours, 2),
            "makespan_days": round(makespan_hours / 24.0, 2),
            "earliest_start": earliest_start.isoformat(),
            "latest_end": latest_end.isoformat(),
            "total_orders": len(self.orders_df),
            "orders_scheduled": total_orders_scheduled,
            "on_time_orders": on_time_count,
            "on_time_delivery_pct": on_time_delivery_pct,
            "delayed_orders": total_orders_scheduled - on_time_count,
            "average_lateness_hours": avg_lateness_hours,
            "maximum_lateness_hours": max_lateness_hours,
            "productive_utilization_pct": productive_utilization_pct,
            "changeover_pct": changeover_pct,
            "idle_pct": idle_pct,
            "total_operating_cost_usd": total_operating_cost,
            "workcenter_breakdown": wc_summary,
        }

