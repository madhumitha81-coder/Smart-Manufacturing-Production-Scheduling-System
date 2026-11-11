"""
YottaFlex Production Scheduling System - Interactive Streamlit Dashboard
Real-time schedule visualization, constraint validation, and KPI analysis.
"""

import json
import os
import pandas as pd
import plotly.express as px
import plotly.figure_factory as ff
import streamlit as st

st.set_page_config(
    page_title="YottaFlex | Smart Manufacturing APS",
    page_icon="🏭",
    layout="wide",
)

st.title("🏭 YottaFlex: Smart Manufacturing Production Scheduling System")
st.markdown("Advanced Planning & Scheduling (APS) respecting routing, capacity, changeovers, labor shifts, and materials.")

# Sidebar Controls
st.sidebar.header("📁 Data Source & Configuration")
data_dir = st.sidebar.text_input("Data Directory", value="data")
outputs_dir = st.sidebar.text_input("Outputs Directory", value="outputs")

# Helper to load CSVs safely
@st.cache_data
def load_data(directory: str):
    data = {}
    files = [
        "products.csv", "routings.csv", "operations.csv", "machines.csv",
        "machine_calendar.csv", "materials.csv", "inventory_lots.csv",
        "production_orders.csv", "changeover_matrix.csv", "ground_truth.csv"
    ]
    for f in files:
        path = os.path.join(directory, f)
        if os.path.exists(path):
            data[f.replace(".csv", "")] = pd.read_csv(path)
        else:
            data[f.replace(".csv", "")] = pd.DataFrame()
    return data

@st.cache_data
def load_outputs(directory: str):
    outputs = {}
    sched_path = os.path.join(directory, "schedule.csv")
    viol_path = os.path.join(directory, "violations.csv")
    metrics_path = os.path.join(directory, "metrics.json")

    if os.path.exists(sched_path):
        outputs["schedule"] = pd.read_csv(sched_path)
    if os.path.exists(viol_path):
        outputs["violations"] = pd.read_csv(viol_path)
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            outputs["metrics"] = json.load(f)
    return outputs

data = load_data(data_dir)
outputs = load_outputs(outputs_dir)

# Top KPI Summary Cards
metrics = outputs.get("metrics", {})
c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("Total Makespan", f"{metrics.get('makespan_hours', 0):.1f} hrs", f"{metrics.get('makespan_days', 0):.1f} days")
c2.metric("On-Time Delivery", f"{metrics.get('on_time_delivery_pct', 0):.1f}%", f"{metrics.get('on_time_orders', 0)}/{metrics.get('orders_scheduled', 0)}")
c3.metric("Machine Utilization", f"{metrics.get('productive_utilization_pct', 0):.1f}%", f"Setup: {metrics.get('changeover_pct', 0):.1f}%")
c4.metric("Avg / Max Lateness", f"{metrics.get('average_lateness_hours', 0):.1f} hrs", f"Max: {metrics.get('maximum_lateness_hours', 0):.1f}h")
viol_df = outputs.get("violations", pd.DataFrame())
c5.metric("Constraint Violations", len(viol_df), "Audited" if len(viol_df) > 0 else "0 (Feasible)")

# Navigation Tabs
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📊 Interactive Gantt Schedule",
    "🛡️ Constraint Violations & Ground Truth",
    "📦 Material & Inventory Balances",
    "⚙️ Machine Calendars & Shifts",
    "📑 Master Data Explorer"
])

# TAB 1: GANTT SCHEDULE
with tab1:
    st.subheader("Interactive Production Gantt Timeline")
    sched_df = outputs.get("schedule", pd.DataFrame())

    if not sched_df.empty:
        # Merge with product & order metadata for rich hover
        orders_df = data.get("production_orders", pd.DataFrame())
        prods_df = data.get("products", pd.DataFrame())
        merged = pd.merge(sched_df, orders_df[["order_id", "priority", "due_date", "product_id"]], on="order_id", how="left")
        merged = pd.merge(merged, prods_df[["product_id", "product_family", "product_name"]], on="product_id", how="left")

        # Filters
        f1, f2, f3 = st.columns(3)
        with f1:
            all_machs = sorted(merged["machine_id"].unique())
            selected_machs = st.multiselect("Filter Machines", options=all_machs, default=all_machs[:10])
        with f2:
            all_fams = sorted(merged["product_family"].dropna().unique())
            selected_fams = st.multiselect("Filter Product Families", options=all_fams, default=all_fams)
        with f3:
            color_by = st.selectbox("Color By", options=["product_family", "priority", "machine_id"])

        filtered = merged[
            merged["machine_id"].isin(selected_machs) &
            merged["product_family"].isin(selected_fams)
        ].copy()

        if not filtered.empty:
            fig = px.timeline(
                filtered,
                x_start="scheduled_start_time",
                x_end="scheduled_end_time",
                y="machine_id",
                color=color_by,
                hover_data=["operation_id", "order_id", "product_name", "execution_duration_minutes", "changeover_duration_minutes"],
                title="Production Operations Timeline by Workstation",
            )
            fig.update_yaxes(categoryorder="category ascending")
            fig.update_layout(height=650)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No operations match the selected filter criteria.")
    else:
        st.warning("No schedule records found. Run the scheduler via `python main.py` first.")

# TAB 2: CONSTRAINT VIOLATIONS & GROUND TRUTH
with tab2:
    st.subheader("Constraint Audit & Ground Truth Confusion Matrix")
    gt_df = data.get("ground_truth", pd.DataFrame())

    col_a, col_b = st.columns([1, 1])

    with col_a:
        st.markdown("#### Detected Violations by Auditor")
        if not viol_df.empty:
            st.dataframe(viol_df[["violation_id", "violation_category", "schedule_id", "machine_id", "details"]], use_container_width=True)
        else:
            st.success("No constraint violations detected in baseline schedule!")

    with col_b:
        st.markdown("#### Injected Ground Truth Anomalies (Test Set)")
        if not gt_df.empty:
            st.dataframe(gt_df[["anomaly_id", "anomaly_category", "target_schedule_id", "machine_id", "description"]], use_container_width=True)
        else:
            st.info("Ground truth anomalies empty or not loaded.")

    if not viol_df.empty and not gt_df.empty:
        st.markdown("#### Detection Accuracy & Metric Scores")
        gt_keys = set(zip(gt_df["target_schedule_id"], gt_df["anomaly_category"]))
        det_keys = set(zip(viol_df["schedule_id"], viol_df["violation_category"]))

        tp = len(gt_keys.intersection(det_keys))
        fp = len(det_keys - gt_keys)
        fn = len(gt_keys - det_keys)
        prec = (tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        rec = (tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Precision", f"{prec * 100:.1f}%")
        m2.metric("Recall", f"{rec * 100:.1f}%")
        m3.metric("F1 Score", f"{f1 * 100:.1f}%")
        m4.metric("True Positives", f"{tp}/{len(gt_keys)}")

# TAB 3: MATERIAL & INVENTORY
with tab3:
    st.subheader("Raw Material Inventory & Lot Allocations")
    lots_df = data.get("inventory_lots", pd.DataFrame())
    mats_df = data.get("materials", pd.DataFrame())

    if not lots_df.empty and not mats_df.empty:
        merged_lots = pd.merge(lots_df, mats_df[["material_id", "material_name", "material_category", "unit_of_measure"]], on="material_id", how="left")
        st.dataframe(merged_lots, use_container_width=True)

        # Inventory balance chart
        st.markdown("#### Stock Availability vs Allocation")
        summary = lots_df.groupby("material_id")[["allocated_quantity", "available_quantity"]].sum().reset_index()
        fig_inv = px.bar(
            summary.head(25),
            x="material_id",
            y=["available_quantity", "allocated_quantity"],
            barmode="stack",
            title="Material Inventory Balances (First 25 Materials)",
            labels={"value": "Quantity", "variable": "Status"}
        )
        st.plotly_chart(fig_inv, use_container_width=True)

# TAB 4: MACHINE CALENDARS
with tab4:
    st.subheader("Machine Shift Calendars and Maintenance Windows")
    cal_df = data.get("machine_calendar", pd.DataFrame())
    if not cal_df.empty:
        mach_filter = st.selectbox("Select Machine for Calendar Inspection", options=sorted(cal_df["machine_id"].unique()))
        m_cal = cal_df[cal_df["machine_id"] == mach_filter]
        st.dataframe(m_cal, use_container_width=True)

# TAB 5: MASTER DATA EXPLORER
with tab5:
    st.subheader("Master Datasets")
    table_choice = st.selectbox("Select Table", options=list(data.keys()))
    if table_choice in data and not data[table_choice].empty:
        st.dataframe(data[table_choice], use_container_width=True)
        st.caption(f"Total Rows: {len(data[table_choice])}")
