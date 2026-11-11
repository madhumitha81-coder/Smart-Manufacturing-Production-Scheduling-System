"""
Independent Constraint Validator and Audit Engine for YottaFlex
Rigorously checks schedules against all hard manufacturing constraints,
detects injected edge cases, and calculates classification audit metrics.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple
import pandas as pd

from src.models import AnomalyCategory


class ConstraintValidator:
    """
    Validates manufacturing schedules against physical and operational rules.
    Detects 5 key negative edge cases:
    1. MACHINE_OVERLAP
    2. PRECEDENCE_VIOLATION
    3. MATERIAL_UNAVAILABLE
    4. CALENDAR_VIOLATION
    5. CHANGEOVER_OMITTED
    """

    def __init__(
        self,
        products_df: pd.DataFrame,
        operations_df: pd.DataFrame,
        orders_df: pd.DataFrame,
        machines_df: pd.DataFrame,
        calendar_df: pd.DataFrame,
        inventory_lots_df: pd.DataFrame,
        changeover_df: pd.DataFrame,
    ):
        self.products_df = products_df.copy()
        self.operations_df = operations_df.copy()
        self.orders_df = orders_df.copy()
        self.machines_df = machines_df.copy()
        self.calendar_df = calendar_df.copy()
        self.lots_df = inventory_lots_df.copy()
        self.changeover_df = changeover_df.copy()

        # Build fast lookup maps
        self.prod_to_family = dict(zip(self.products_df["product_id"], self.products_df["product_family"]))
        self.order_to_prod = dict(zip(self.orders_df["order_id"], self.orders_df["product_id"]))
        self.ops_map = {row["operation_id"]: row.to_dict() for _, row in self.operations_df.iterrows()}
        self.machines_set = set(self.machines_df["machine_id"])
        self.mach_to_wc = dict(zip(self.machines_df["machine_id"], self.machines_df["workcenter"]))

        # Material lot earliest availability date lookup: material_id -> earliest availability date
        self.mat_earliest_avail: Dict[str, datetime] = {}
        for _, lot in self.lots_df.iterrows():
            m_id = lot["material_id"]
            avail_dt = datetime.fromisoformat(str(lot["availability_date"]))
            if m_id not in self.mat_earliest_avail or avail_dt < self.mat_earliest_avail[m_id]:
                self.mat_earliest_avail[m_id] = avail_dt

        # Changeover lookup: (workcenter, from_family, to_family) -> required_setup
        self.changeover_lookup: Dict[Tuple[str, str, str], int] = {}
        for _, row in self.changeover_df.iterrows():
            key = (row["workcenter"], row["from_product_family"], row["to_product_family"])
            self.changeover_lookup[key] = int(row["setup_duration_minutes"])

        # Calendar lookup: machine_id -> list of unavailable intervals (maintenance / off-shifts)
        self.mach_unavail_blocks: Dict[str, List[Tuple[datetime, datetime, str]]] = {}
        for _, row in self.calendar_df.iterrows():
            if not row["is_available"]:
                m_id = row["machine_id"]
                st = datetime.fromisoformat(str(row["start_time"]))
                et = datetime.fromisoformat(str(row["end_time"]))
                reason = str(row["reason"])
                self.mach_unavail_blocks.setdefault(m_id, []).append((st, et, reason))

    def validate_schedule(self, schedule_df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, int]]:
        """
        Audits schedule dataframe against all constraints.
        Returns:
            (violations_df, violation_counts_dict)
        """
        violations: List[dict] = []
        viol_id = 1

        if schedule_df.empty:
            return pd.DataFrame(), {}

        # ---------------------------------------------------------
        # Check 0: Referential Integrity & Data Types
        # ---------------------------------------------------------
        sched_records = schedule_df.to_dict(orient="records")
        sched_by_op: Dict[str, dict] = {}
        seen_sched_ids: Set[str] = set()

        for s in sched_records:
            s_id = s["schedule_id"]
            op_id = s["operation_id"]
            m_id = s["machine_id"]

            if s_id in seen_sched_ids:
                violations.append({
                    "violation_id": f"VIOL-{viol_id:05d}",
                    "violation_category": "PRIMARY_KEY_DUPLICATE",
                    "schedule_id": s_id,
                    "order_id": s["order_id"],
                    "operation_id": op_id,
                    "machine_id": m_id,
                    "severity": "HARD",
                    "details": f"Duplicate schedule_id: {s_id}",
                })
                viol_id += 1
            seen_sched_ids.add(s_id)
            sched_by_op[op_id] = s

            # Check machine exists
            if m_id not in self.machines_set:
                violations.append({
                    "violation_id": f"VIOL-{viol_id:05d}",
                    "violation_category": "INVALID_MACHINE",
                    "schedule_id": s_id,
                    "order_id": s["order_id"],
                    "operation_id": op_id,
                    "machine_id": m_id,
                    "severity": "HARD",
                    "details": f"Referenced machine {m_id} does not exist in machines master",
                })
                viol_id += 1

            # Check date ordering: start < end
            st = datetime.fromisoformat(str(s["scheduled_start_time"]))
            et = datetime.fromisoformat(str(s["scheduled_end_time"]))
            if st >= et:
                violations.append({
                    "violation_id": f"VIOL-{viol_id:05d}",
                    "violation_category": "INVALID_DATE_ORDERING",
                    "schedule_id": s_id,
                    "order_id": s["order_id"],
                    "operation_id": op_id,
                    "machine_id": m_id,
                    "severity": "HARD",
                    "details": f"Scheduled start {st} >= scheduled end {et}",
                })
                viol_id += 1

        # ---------------------------------------------------------
        # Check 1: MACHINE_OVERLAP
        # ---------------------------------------------------------
        # Group by machine and sort by scheduled start
        mach_groups: Dict[str, List[dict]] = {}
        for s in sched_records:
            mach_groups.setdefault(s["machine_id"], []).append(s)

        for m_id, s_list in mach_groups.items():
            s_list_sorted = sorted(s_list, key=lambda x: datetime.fromisoformat(str(x["scheduled_start_time"])))
            for i in range(len(s_list_sorted)):
                s_curr = s_list_sorted[i]
                c_st = datetime.fromisoformat(str(s_curr["scheduled_start_time"]))
                c_et = datetime.fromisoformat(str(s_curr["scheduled_end_time"]))

                for j in range(i + 1, len(s_list_sorted)):
                    s_next = s_list_sorted[j]
                    n_st = datetime.fromisoformat(str(s_next["scheduled_start_time"]))
                    n_et = datetime.fromisoformat(str(s_next["scheduled_end_time"]))

                    if n_st < c_et:
                        # Overlap detected!
                        violations.append({
                            "violation_id": f"VIOL-{viol_id:05d}",
                            "violation_category": AnomalyCategory.MACHINE_OVERLAP.value,
                            "schedule_id": s_next["schedule_id"],
                            "order_id": s_next["order_id"],
                            "operation_id": s_next["operation_id"],
                            "machine_id": m_id,
                            "severity": "HARD",
                            "details": f"Machine overlap with {s_curr['operation_id']} [{c_st} - {c_et}] vs [{n_st} - {n_et}]",
                        })
                        viol_id += 1
                    else:
                        break  # sorted list, no further overlaps for s_curr

        # ---------------------------------------------------------
        # Check 2: PRECEDENCE_VIOLATION
        # ---------------------------------------------------------
        for s in sched_records:
            op_id = s["operation_id"]
            op_info = self.ops_map.get(op_id)
            if not op_info:
                continue

            pred_op_id = op_info.get("predecessor_operation_id")
            if pred_op_id and pred_op_id != "NONE" and pred_op_id in sched_by_op:
                pred_s = sched_by_op[pred_op_id]
                pred_end = datetime.fromisoformat(str(pred_s["scheduled_end_time"]))
                curr_start = datetime.fromisoformat(str(s["scheduled_start_time"]))

                if curr_start < pred_end:
                    violations.append({
                        "violation_id": f"VIOL-{viol_id:05d}",
                        "violation_category": AnomalyCategory.PRECEDENCE_VIOLATION.value,
                        "schedule_id": s["schedule_id"],
                        "order_id": s["order_id"],
                        "operation_id": op_id,
                        "machine_id": s["machine_id"],
                        "severity": "HARD",
                        "details": f"Operation started at {curr_start} before predecessor {pred_op_id} ended at {pred_end}",
                    })
                    viol_id += 1

        # ---------------------------------------------------------
        # Check 3: MATERIAL_UNAVAILABLE
        # ---------------------------------------------------------
        for s in sched_records:
            op_id = s["operation_id"]
            op_info = self.ops_map.get(op_id)
            if not op_info:
                continue

            req_mat_id = op_info.get("required_material_id")
            if req_mat_id and req_mat_id != "NONE":
                lot_avail_dt = self.mat_earliest_avail.get(req_mat_id)
                if lot_avail_dt:
                    curr_start = datetime.fromisoformat(str(s["scheduled_start_time"]))
                    if curr_start < lot_avail_dt:
                        violations.append({
                            "violation_id": f"VIOL-{viol_id:05d}",
                            "violation_category": AnomalyCategory.MATERIAL_UNAVAILABLE.value,
                            "schedule_id": s["schedule_id"],
                            "order_id": s["order_id"],
                            "operation_id": op_id,
                            "machine_id": s["machine_id"],
                            "severity": "HARD",
                            "details": f"Operation started at {curr_start} before material {req_mat_id} availability at {lot_avail_dt}",
                        })
                        viol_id += 1

        # ---------------------------------------------------------
        # Check 4: CALENDAR_VIOLATION
        # ---------------------------------------------------------
        for s in sched_records:
            m_id = s["machine_id"]
            unavail_blocks = self.mach_unavail_blocks.get(m_id, [])
            if not unavail_blocks:
                continue

            c_start = datetime.fromisoformat(str(s.get("changeover_start_time", s["scheduled_start_time"])))
            s_end = datetime.fromisoformat(str(s["scheduled_end_time"]))

            for blk_st, blk_et, reason in unavail_blocks:
                # Intersection check
                if max(c_start, blk_st) < min(s_end, blk_et):
                    violations.append({
                        "violation_id": f"VIOL-{viol_id:05d}",
                        "violation_category": AnomalyCategory.CALENDAR_VIOLATION.value,
                        "schedule_id": s["schedule_id"],
                        "order_id": s["order_id"],
                        "operation_id": s["operation_id"],
                        "machine_id": m_id,
                        "severity": "HARD",
                        "details": f"Scheduled execution [{c_start} - {s_end}] intersects machine unavail block [{blk_st} - {blk_et}] ({reason})",
                    })
                    viol_id += 1
                    break

        # ---------------------------------------------------------
        # Check 5: CHANGEOVER_OMITTED
        # ---------------------------------------------------------
        for m_id, s_list in mach_groups.items():
            wc = self.mach_to_wc.get(m_id, "")
            s_list_sorted = sorted(s_list, key=lambda x: datetime.fromisoformat(str(x["scheduled_start_time"])))

            for i in range(1, len(s_list_sorted)):
                s_prev = s_list_sorted[i - 1]
                s_curr = s_list_sorted[i]

                prev_prod = self.order_to_prod.get(s_prev["order_id"])
                curr_prod = self.order_to_prod.get(s_curr["order_id"])

                if prev_prod and curr_prod and prev_prod != curr_prod:
                    prev_fam = self.prod_to_family.get(prev_prod)
                    curr_fam = self.prod_to_family.get(curr_prod)

                    req_setup = self.changeover_lookup.get((wc, prev_fam, curr_fam), 0)
                    if req_setup > 0:
                        # Check actual gap between prev end and curr start
                        prev_end = datetime.fromisoformat(str(s_prev["scheduled_end_time"]))
                        curr_start = datetime.fromisoformat(str(s_curr["scheduled_start_time"]))
                        actual_setup_minutes = int((curr_start - prev_end).total_seconds() / 60)

                        if actual_setup_minutes < req_setup:
                            violations.append({
                                "violation_id": f"VIOL-{viol_id:05d}",
                                "violation_category": AnomalyCategory.CHANGEOVER_OMITTED.value,
                                "schedule_id": s_curr["schedule_id"],
                                "order_id": s_curr["order_id"],
                                "operation_id": s_curr["operation_id"],
                                "machine_id": m_id,
                                "severity": "HARD",
                                "details": f"Switch from {prev_fam} to {curr_fam} requires {req_setup}m setup, but only {actual_setup_minutes}m allocated",
                            })
                            viol_id += 1

        viol_df = pd.DataFrame(violations)
        counts = {}
        if not viol_df.empty:
            counts = viol_df["violation_category"].value_counts().to_dict()

        return viol_df, counts

    def evaluate_against_ground_truth(
        self,
        detected_violations_df: pd.DataFrame,
        ground_truth_df: pd.DataFrame,
    ) -> Dict:
        """
        Calculates Precision, Recall, F1 Score, and per-category detection rates.
        Matches (schedule_id, expected_category).
        """
        if ground_truth_df.empty:
            return {
                "ground_truth_count": 0,
                "detected_count": len(detected_violations_df),
                "precision": 1.0 if detected_violations_df.empty else 0.0,
                "recall": 1.0,
                "f1_score": 1.0 if detected_violations_df.empty else 0.0,
            }

        gt_records = ground_truth_df.to_dict(orient="records")
        gt_keys = set((row["target_schedule_id"], row["anomaly_category"]) for row in gt_records)

        det_keys = set()
        if not detected_violations_df.empty:
            det_keys = set(
                (row["schedule_id"], row["violation_category"])
                for _, row in detected_violations_df.iterrows()
            )

        true_positives = len(gt_keys.intersection(det_keys))
        false_positives = len(det_keys - gt_keys)
        false_negatives = len(gt_keys - det_keys)

        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        # Per category metrics
        categories = [c.value for c in AnomalyCategory]
        category_breakdown = {}
        for cat in categories:
            cat_gt = set(k for k in gt_keys if k[1] == cat)
            cat_det = set(k for k in det_keys if k[1] == cat)
            cat_tp = len(cat_gt.intersection(cat_det))
            cat_fp = len(cat_det - cat_gt)
            cat_fn = len(cat_gt - cat_det)
            cat_prec = cat_tp / (cat_tp + cat_fp) if (cat_tp + cat_fp) > 0 else (1.0 if not cat_gt else 0.0)
            cat_rec = cat_tp / (cat_tp + cat_fn) if (cat_tp + cat_fn) > 0 else 1.0
            category_breakdown[cat] = {
                "ground_truth": len(cat_gt),
                "detected": len(cat_det),
                "true_positives": cat_tp,
                "precision": round(cat_prec, 4),
                "recall": round(cat_rec, 4),
            }

        return {
            "ground_truth_count": len(gt_keys),
            "detected_count": len(det_keys),
            "true_positives": true_positives,
            "false_positives": false_positives,
            "false_negatives": false_negatives,
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "category_breakdown": category_breakdown,
        }

