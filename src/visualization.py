"""
Visualization Engine for YottaFlex Production Scheduling System
Generates Gantt charts, utilization heatmaps, lateness distributions,
and multi-panel executive dashboard images.
"""

import os
from datetime import datetime
from typing import Dict, Optional
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import matplotlib.patches as mpatches
import pandas as pd


class ScheduleVisualizer:
    """
    Renders high-resolution charts and dashboard visuals for factory scheduling.
    """

    def __init__(
        self,
        schedules_df: pd.DataFrame,
        orders_df: pd.DataFrame,
        machines_df: pd.DataFrame,
        products_df: pd.DataFrame,
    ):
        self.schedules_df = schedules_df.copy()
        self.orders_df = orders_df.copy()
        self.machines_df = machines_df.copy()
        self.products_df = products_df.copy()

        # Preprocess dates
        if not self.schedules_df.empty:
            self.schedules_df["start_dt"] = pd.to_datetime(self.schedules_df["scheduled_start_time"])
            self.schedules_df["end_dt"] = pd.to_datetime(self.schedules_df["scheduled_end_time"])

        self.order_to_prod = dict(zip(self.orders_df["order_id"], self.orders_df["product_id"]))
        self.prod_to_family = dict(zip(self.products_df["product_id"], self.products_df["product_family"]))
        self.order_to_priority = dict(zip(self.orders_df["order_id"], self.orders_df["priority"]))

        # Colors for product families
        self.family_colors = {
            "SmartFrame": "#1f77b4",
            "OpticSensor": "#2ca02c",
            "PrecisionAlloy": "#ff7f0e",
            "PowerModule": "#9467bd",
            "MicroController": "#d62728",
        }
        self.priority_colors = {
            "Urgent": "#d62728",
            "High": "#ff7f0e",
            "Normal": "#2ca02c",
            "Low": "#7f7f7f",
        }

    def generate_dashboard_image(
        self,
        metrics: Dict,
        violations_summary: Dict[str, int],
        output_path: str = "outputs/dashboard.png",
    ):
        """
        Creates an executive 4-panel manufacturing dashboard:
        Panel 1: Gantt Timeline Overview (top 20 machines)
        Panel 2: Machine Workcenter Utilization & Run Hours
        Panel 3: On-Time Delivery & Order Lateness Distribution
        Panel 4: Constraint Violations Audit Summary
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        fig = plt.figure(figsize=(18, 12), dpi=150)
        plt.subplots_adjust(hspace=0.35, wspace=0.3)

        # -------------------------------------------------------------
        # Panel 1: Machine Gantt Timeline (top 15 machines)
        # -------------------------------------------------------------
        ax1 = fig.add_subplot(2, 2, 1)
        machs_to_plot = sorted(self.machines_df["machine_id"].unique())[:15]
        mach_y_map = {m: idx for idx, m in enumerate(machs_to_plot)}

        for _, row in self.schedules_df.iterrows():
            m_id = row["machine_id"]
            if m_id not in mach_y_map:
                continue
            y_pos = mach_y_map[m_id]
            st = mdates.date2num(row["start_dt"])
            et = mdates.date2num(row["end_dt"])
            width = et - st
            if width <= 0:
                width = 0.01

            o_id = row["order_id"]
            p_id = self.order_to_prod.get(o_id, "")
            fam = self.prod_to_family.get(p_id, "SmartFrame")
            color = self.family_colors.get(fam, "#1f77b4")

            ax1.barh(y_pos, width, left=st, height=0.6, align="center", color=color, alpha=0.85, edgecolor="black", linewidth=0.3)

        ax1.set_yticks(range(len(machs_to_plot)))
        ax1.set_yticklabels(machs_to_plot, fontsize=8)
        ax1.xaxis_date()
        ax1.xaxis.set_major_formatter(mdates.DateFormatter("%m/%d %H:%M"))
        ax1.set_title("Machine Schedule Gantt Timeline (Sample 15 Machines)", fontsize=11, fontweight="bold")
        ax1.set_xlabel("Timeline")
        ax1.grid(True, linestyle="--", alpha=0.4)

        # Legend for families
        patches = [mpatches.Patch(color=c, label=f) for f, c in self.family_colors.items()]
        ax1.legend(handles=patches, loc="upper right", fontsize=7, framealpha=0.8)

        # -------------------------------------------------------------
        # Panel 2: Workcenter Run Hours & Setup Breakdown
        # -------------------------------------------------------------
        ax2 = fig.add_subplot(2, 2, 2)
        wc_breakdown = metrics.get("workcenter_breakdown", {})
        if wc_breakdown:
            wcs = list(wc_breakdown.keys())
            run_hrs = [wc_breakdown[wc]["total_run_hours"] for wc in wcs]
            setup_hrs = [wc_breakdown[wc]["total_setup_hours"] for wc in wcs]

            y_pos = range(len(wcs))
            ax2.barh(y_pos, run_hrs, color="#2b5c8f", height=0.5, label="Run Time (hrs)")
            ax2.barh(y_pos, setup_hrs, left=run_hrs, color="#e67e22", height=0.5, label="Changeover Setup (hrs)")
            ax2.set_yticks(y_pos)
            ax2.set_yticklabels(wcs, fontsize=8)
            ax2.set_xlabel("Hours")
            ax2.set_title("Workcenter Workload: Run Time vs. Changeover", fontsize=11, fontweight="bold")
            ax2.legend(loc="lower right", fontsize=8)
            ax2.grid(True, linestyle="--", alpha=0.4)
        else:
            ax2.text(0.5, 0.5, "No Workcenter Data", ha="center", va="center")

        # -------------------------------------------------------------
        # Panel 3: Order Lateness Distribution & OTD KPI
        # -------------------------------------------------------------
        ax3 = fig.add_subplot(2, 2, 3)
        # Calculate order lateness
        order_comp = self.schedules_df.groupby("order_id")["end_dt"].max().reset_index()
        m_orders = pd.merge(self.orders_df, order_comp, on="order_id", how="left")
        m_orders["due_dt"] = pd.to_datetime(m_orders["due_date"])
        lateness_hrs = ((m_orders["end_dt"] - m_orders["due_dt"]).dt.total_seconds() / 3600.0).clip(lower=0)

        ax3.hist(lateness_hrs.dropna(), bins=15, color="#16a085", edgecolor="black", alpha=0.8)
        otd = metrics.get("on_time_delivery_pct", 0.0)
        avg_late = metrics.get("average_lateness_hours", 0.0)
        ax3.set_title(f"Delivery Lateness Distribution (OTD: {otd}%, Avg Late: {avg_late}h)", fontsize=11, fontweight="bold")
        ax3.set_xlabel("Lateness (Hours Past Due Date)")
        ax3.set_ylabel("Order Count")
        ax3.grid(True, linestyle="--", alpha=0.4)

        # -------------------------------------------------------------
        # Panel 4: Constraint Violations Audit Summary
        # -------------------------------------------------------------
        ax4 = fig.add_subplot(2, 2, 4)
        if violations_summary:
            v_cats = list(violations_summary.keys())
            v_counts = [violations_summary[c] for c in v_cats]
            colors = ["#c0392b" if c != "CLEAN" else "#27ae60" for c in v_cats]

            bars = ax4.bar(v_cats, v_counts, color=colors, edgecolor="black", alpha=0.85)
            ax4.set_title("Audit Constraint Violations by Category", fontsize=11, fontweight="bold")
            ax4.set_ylabel("Violation Count")
            ax4.set_xticks(range(len(v_cats)))
            ax4.set_xticklabels(v_cats, rotation=25, ha="right", fontsize=8)
            ax4.grid(True, linestyle="--", alpha=0.4)
            for bar in bars:
                height = bar.get_height()
                ax4.annotate(f"{height}",
                             xy=(bar.get_x() + bar.get_width() / 2, height),
                             xytext=(0, 3),
                             textcoords="offset points",
                             ha="center", va="bottom", fontsize=9, fontweight="bold")
        else:
            ax4.text(0.5, 0.5, "Zero Violations Detected (100% Feasible)", ha="center", va="center", color="#27ae60", fontsize=12, fontweight="bold")
            ax4.set_axis_off()

        plt.suptitle(
            f"YottaFlex Smart Manufacturing: Production Scheduling Dashboard\n"
            f"Makespan: {metrics.get('makespan_hours', 0)} hrs ({metrics.get('makespan_days', 0)} days) | "
            f"Orders: {metrics.get('orders_scheduled', 0)}/{metrics.get('total_orders', 0)} | "
            f"OTD: {metrics.get('on_time_delivery_pct', 0)}% | Utilization: {metrics.get('productive_utilization_pct', 0)}%",
            fontsize=13, fontweight="bold", y=0.98
        )

        plt.savefig(output_path, bbox_inches="tight")
        plt.close()
        return output_path
