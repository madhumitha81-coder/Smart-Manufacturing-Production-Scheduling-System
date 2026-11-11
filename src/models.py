"""
Data Models and Schemas for YottaFlex Production Scheduling System
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class ProductFamily(str, Enum):
    SMART_FRAME = "SmartFrame"
    OPTIC_SENSOR = "OpticSensor"
    PRECISION_ALLOY = "PrecisionAlloy"
    POWER_MODULE = "PowerModule"
    MICRO_CONTROLLER = "MicroController"


class UnitOfMeasure(str, Enum):
    EA = "EA"
    SET = "SET"
    UNIT = "UNIT"
    KG = "KG"
    SHEET = "SHEET"
    LITER = "LITER"
    PCS = "PCS"
    BAR = "BAR"


class OperationType(str, Enum):
    CUTTING = "Cutting"
    CNC_MILLING = "CNC_Milling"
    DRILLING = "Drilling"
    HEAT_TREATMENT = "Heat_Treatment"
    POLISHING = "Polishing"
    CLEANROOM_ASSEMBLY = "Cleanroom_Assembly"
    QC_INSPECTION = "QC_Inspection"


class Workcenter(str, Enum):
    CUTTING_BAY = "CUTTING_BAY"
    CNC_MACHINING = "CNC_MACHINING"
    DRILL_PRESS = "DRILL_PRESS"
    THERMAL_CELL = "THERMAL_CELL"
    SURFACE_FINISH = "SURFACE_FINISH"
    ASSEMBLY_LINE = "ASSEMBLY_LINE"
    QUALITY_LAB = "QUALITY_LAB"


class MachineStatus(str, Enum):
    ACTIVE = "ACTIVE"
    MAINTENANCE = "MAINTENANCE"
    STANDBY = "STANDBY"


class OrderPriority(str, Enum):
    URGENT = "Urgent"
    HIGH = "High"
    NORMAL = "Normal"
    LOW = "Low"


class OrderStatus(str, Enum):
    RELEASED = "RELEASED"
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    INFEASIBLE = "INFEASIBLE"


class ScheduleStatus(str, Enum):
    PLANNED = "PLANNED"
    DISPATCHED = "DISPATCHED"
    COMPLETED = "COMPLETED"
    VIOLATED = "VIOLATED"


class AnomalyCategory(str, Enum):
    MACHINE_OVERLAP = "MACHINE_OVERLAP"
    PRECEDENCE_VIOLATION = "PRECEDENCE_VIOLATION"
    MATERIAL_UNAVAILABLE = "MATERIAL_UNAVAILABLE"
    CALENDAR_VIOLATION = "CALENDAR_VIOLATION"
    CHANGEOVER_OMITTED = "CHANGEOVER_OMITTED"


# 1. Product
class Product(BaseModel):
    product_id: str = Field(..., pattern=r"^PROD-2026-\d{6}$")
    product_name: str
    product_family: ProductFamily
    unit_of_measure: UnitOfMeasure = UnitOfMeasure.EA
    base_cost: float = Field(..., gt=0.0)
    created_at: str


# 2. Routing
class Routing(BaseModel):
    routing_id: str = Field(..., pattern=r"^ROUTE-[A-Z0-9-]+-01$")
    product_id: str
    version: int = Field(default=1, ge=1)
    total_steps: int = Field(..., ge=2, le=6)
    is_active: bool = True
    description: Optional[str] = None


# 3. Operation
class Operation(BaseModel):
    operation_id: str = Field(..., pattern=r"^OP-ORD-2026-\d{6}-\d{2}$")
    order_id: str
    routing_id: str
    sequence_num: int = Field(..., ge=10)
    operation_type: OperationType
    eligible_machine_ids: str  # Semicolon-delimited e.g. "MACH-001;MACH-002"
    standard_duration_minutes: int = Field(..., ge=15)
    required_material_id: Optional[str] = "NONE"
    required_material_qty: float = Field(default=0.0, ge=0.0)
    predecessor_operation_id: Optional[str] = "NONE"


# 4. Machine
class Machine(BaseModel):
    machine_id: str = Field(..., pattern=r"^MACH-\d{3}$")
    machine_name: str
    workcenter: Workcenter
    capability: OperationType
    hourly_rate: float = Field(..., ge=45.0, le=350.0)
    status: MachineStatus = MachineStatus.ACTIVE


# 5. MachineCalendar
class MachineCalendar(BaseModel):
    calendar_id: str = Field(..., pattern=r"^CAL-\d{6}$")
    machine_id: str
    shift_name: str
    start_time: str
    end_time: str
    is_available: bool
    reason: str


# 6. Material
class Material(BaseModel):
    material_id: str = Field(..., pattern=r"^MAT-\d{4}$")
    material_name: str
    material_category: str
    unit_of_measure: UnitOfMeasure
    standard_unit_cost: float = Field(..., gt=0.0)
    lead_time_days: int = Field(..., ge=1)


# 7. InventoryLot
class InventoryLot(BaseModel):
    lot_id: str = Field(..., pattern=r"^LOT-\d{6}$")
    material_id: str
    initial_quantity: float = Field(..., ge=0.0)
    allocated_quantity: float = Field(default=0.0, ge=0.0)
    available_quantity: float = Field(..., ge=0.0)
    availability_date: str
    storage_bin: str
    supplier_code: str


# 8. ProductionOrder
class ProductionOrder(BaseModel):
    order_id: str = Field(..., pattern=r"^ORD-2026-\d{6}$")
    product_id: str
    routing_id: str
    order_quantity: int = Field(..., gt=0)
    priority: OrderPriority
    release_date: str
    due_date: str
    customer_id: str
    order_status: OrderStatus = OrderStatus.RELEASED


# 9. OperationSchedule
class OperationSchedule(BaseModel):
    schedule_id: str = Field(..., pattern=r"^SCH-2026-\d{6}$")
    operation_id: str
    order_id: str
    machine_id: str
    changeover_start_time: str
    scheduled_start_time: str
    scheduled_end_time: str
    changeover_duration_minutes: int = Field(default=0, ge=0)
    execution_duration_minutes: int = Field(..., ge=15)
    schedule_status: ScheduleStatus = ScheduleStatus.PLANNED


# 10. ChangeoverMatrix
class ChangeoverMatrix(BaseModel):
    changeover_id: str = Field(..., pattern=r"^CHG-\d{6}$")
    workcenter: Workcenter
    from_product_family: ProductFamily
    to_product_family: ProductFamily
    setup_duration_minutes: int = Field(..., ge=0)
    requires_sterilization: bool = False


# Ground Truth Anomaly Record
class GroundTruthAnomaly(BaseModel):
    anomaly_id: str = Field(..., pattern=r"^ANOM-\d{4}$")
    anomaly_category: AnomalyCategory
    target_schedule_id: str
    order_id: str
    operation_id: str
    machine_id: str
    description: str
    expected_flag: str


# Schedule Violation Record (Emitted by ConstraintValidator)
class ScheduleViolation(BaseModel):
    violation_id: str
    violation_category: AnomalyCategory
    schedule_id: str
    order_id: str
    operation_id: str
    machine_id: str
    severity: str  # HARD or WARNING
    details: str
    timestamp: str
