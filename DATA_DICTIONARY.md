# YottaFlex Smart Manufacturing: Data Dictionary

This document provides the granular data dictionary for all 10 core entities in the YottaFlex Production Scheduling System.

---

## 1. Product (`products.csv`)
Master catalog of finished products and sub-assemblies manufactured by the factory.

| Field Name | Type | Req / Opt | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `product_id` | String | Required | Matches regex `^PROD-2026-\d{6}$` | N/A | Unique (PK) | Primary Key. Immutable, zero-padded 6 digits. |
| `product_name` | String | Required | Non-empty alphanumeric string | N/A | Non-unique | Length between 3 and 100 characters. |
| `product_family` | String | Required | `SmartFrame`, `OpticSensor`, `PrecisionAlloy`, `PowerModule`, `MicroController` | N/A | Non-unique | Must belong to pre-defined product families. |
| `unit_of_measure`| String | Required | `EA`, `SET`, `UNIT` | N/A | Non-unique | Standard ISO unit of measure. |
| `base_cost` | Float | Required | Positive float (`>= 1.00`) | USD ($) | Non-unique | Standard production target cost. Must be `> 0`. |
| `created_at` | DateTime | Required | ISO 8601 (`YYYY-MM-DDTHH:MM:SS`) | UTC | Non-unique | Must be valid timestamp prior to production dates. |

---

## 2. Routing (`routings.csv`)
Defines the standard sequence of manufacturing processes for a specific product.

| Field Name | Type | Req / Opt | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `routing_id` | String | Required | Matches regex `^ROUTE-[A-Z0-9-]+-01$` | N/A | Unique (PK) | Primary Key. Format: `ROUTE-<product_id>-01`. |
| `product_id` | String | Required | Valid `product_id` in `Product` table | N/A | Unique per active version (FK) | Foreign Key -> `Product.product_id`. |
| `version` | Integer | Required | Positive integer (`>= 1`) | N/A | Non-unique | Routing revision number. |
| `total_steps` | Integer | Required | Integer between `2` and `6` | Steps | Non-unique | Number of sequential operations in this routing. |
| `is_active` | Boolean | Required | `TRUE`, `FALSE` | N/A | Non-unique | Flag indicating active standard routing. |
| `description` | String | Optional | Text description of routing path | N/A | Non-unique | Max length 250 characters. |

---

## 3. Operation (`operations.csv`)
Discrete manufacturing operations belonging to production orders, sequenced according to product routings.

| Field Name | Type | Req / Opt | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `operation_id` | String | Required | Matches regex `^OP-ORD-2026-\d{6}-\d{2}$` | N/A | Unique (PK) | Primary Key. Format: `OP-<order_id>-<seq>`. |
| `order_id` | String | Required | Valid `order_id` in `ProductionOrder` | N/A | Non-unique (FK) | Foreign Key -> `ProductionOrder.order_id`. |
| `routing_id` | String | Required | Valid `routing_id` in `Routing` | N/A | Non-unique (FK) | Foreign Key -> `Routing.routing_id`. |
| `sequence_num` | Integer | Required | `10`, `20`, `30`, `40`, `50`, `60` | Step # | Unique within `order_id` | Standard 10-increment sequence numbers. |
| `operation_type`| String | Required | `Cutting`, `CNC_Milling`, `Drilling`, `Heat_Treatment`, `Polishing`, `Cleanroom_Assembly`, `QC_Inspection` | N/A | Non-unique | Must match eligible machine capabilities. |
| `eligible_machine_ids` | String | Required | Semicolon-separated list of `machine_id`s | N/A | Non-unique | Every referenced machine must exist and match `operation_type`. |
| `standard_duration_minutes` | Integer | Required | Positive integer (`>= 15`) | Minutes | Non-unique | Calculated as `(cycle_time_per_unit * quantity) + base_setup`. |
| `required_material_id` | String | Optional | Valid `material_id` in `Material` or `NONE` | N/A | Non-unique (FK) | Foreign Key -> `Material.material_id`. Required for ops consuming raw stock. |
| `required_material_qty` | Float | Required | Non-negative float (`>= 0.0`) | UOM | Non-unique | Exact consumption required for the order lot size. |
| `predecessor_operation_id` | String | Optional | Valid `operation_id` or `NONE` | N/A | Non-unique (Self-FK) | Must reference the immediately prior operation in the same order. |

---

## 4. Machine (`machines.csv`)
Factory workstations, production equipment, and specialized automated cells.

| Field Name | Type | Req / Opt | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `machine_id` | String | Required | Matches regex `^MACH-\d{3}$` | N/A | Unique (PK) | Primary Key. Zero-padded 3 digits (`MACH-001` .. `MACH-040`). |
| `machine_name` | String | Required | Alphanumeric workstation name | N/A | Unique | Descriptive machine label. |
| `workcenter` | String | Required | `CUTTING_BAY`, `CNC_MACHINING`, `DRILL_PRESS`, `THERMAL_CELL`, `SURFACE_FINISH`, `ASSEMBLY_LINE`, `QUALITY_LAB` | N/A | Non-unique | Factory physical department. |
| `capability` | String | Required | `Cutting`, `CNC_Milling`, `Drilling`, `Heat_Treatment`, `Polishing`, `Cleanroom_Assembly`, `QC_Inspection` | N/A | Non-unique | Must match `operation_type` for scheduling eligibility. |
| `hourly_rate` | Float | Required | Float between `45.0` and `350.0` | USD ($/hr) | Non-unique | Operating cost per hour for scheduling optimization. |
| `status` | String | Required | `ACTIVE`, `MAINTENANCE`, `STANDBY` | N/A | Non-unique | Operational state of the machine asset. |

---

## 5. MachineCalendar (`machine_calendar.csv`)
Shift intervals, operating windows, and scheduled preventative maintenance/downtime blocks.

| Field Name | Type | Req / Opt | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `calendar_id` | String | Required | Matches regex `^CAL-\d{6}$` | N/A | Unique (PK) | Primary Key. Zero-padded 6 digits. |
| `machine_id` | String | Required | Valid `machine_id` in `Machine` | N/A | Non-unique (FK) | Foreign Key -> `Machine.machine_id`. |
| `shift_name` | String | Required | `Shift_1_Morning`, `Shift_2_Afternoon`, `Shift_3_Night`, `Planned_Maintenance`, `Weekend_Downtime` | N/A | Non-unique | Shift descriptor. |
| `start_time` | DateTime | Required | ISO 8601 (`YYYY-MM-DDTHH:MM:SS`) | Timestamp | Non-unique | Must be strictly earlier than `end_time`. |
| `end_time` | DateTime | Required | ISO 8601 (`YYYY-MM-DDTHH:MM:SS`) | Timestamp | Non-unique | Must be strictly later than `start_time`. |
| `is_available` | Boolean | Required | `TRUE` (working shift), `FALSE` (downtime/off-shift) | N/A | Non-unique | Production only permitted during `is_available = TRUE`. |
| `reason` | String | Required | `Standard_Production`, `Preventative_Maintenance`, `Tooling_Overhaul`, `Shift_Break` | N/A | Non-unique | Explanation for calendar block. |

---

## 6. Material (`materials.csv`)
Catalog of raw materials, sheet stock, polymer resins, fasteners, and optical components.

| Field Name | Type | Req / Opt | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `material_id` | String | Required | Matches regex `^MAT-\d{4}$` | N/A | Unique (PK) | Primary Key. Zero-padded 4 digits (`MAT-0001` .. `MAT-0200`). |
| `material_name` | String | Required | Alphanumeric material description | N/A | Unique | Specific chemical / structural grade name. |
| `material_category` | String | Required | `Titanium_Alloy`, `Aircraft_Aluminum`, `Optical_Glass`, `Polymer_Resin`, `Silicon_Wafer`, `Fastener_Hardware` | N/A | Non-unique | Material family category. |
| `unit_of_measure` | String | Required | `KG`, `SHEET`, `LITER`, `PCS`, `BAR` | N/A | Non-unique | Standard measurement unit. |
| `standard_unit_cost` | Float | Required | Float between `5.00` and `850.00` | USD ($) | Non-unique | Must be positive float `> 0`. |
| `lead_time_days` | Integer | Required | Integer between `2` and `21` | Days | Non-unique | Procurement lead time. |

---

## 7. InventoryLot (`inventory_lots.csv`)
Physical inventory lots with allocation tracking and delivery availability dates.

| Field Name | Type | Req / Opt | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `lot_id` | String | Required | Matches regex `^LOT-\d{6}$` | N/A | Unique (PK) | Primary Key. Zero-padded 6 digits. |
| `material_id` | String | Required | Valid `material_id` in `Material` | N/A | Non-unique (FK) | Foreign Key -> `Material.material_id`. |
| `initial_quantity` | Float | Required | Positive float (`>= 50.0`) | Material UOM | Non-unique | Original quantity received in lot. |
| `allocated_quantity`| Float | Required | Float (`0.0 <= allocated <= initial`) | Material UOM | Non-unique | Reserved quantity for scheduled orders. |
| `available_quantity`| Float | Required | Float (`available = initial - allocated`) | Material UOM | Non-unique | Arithmetic reconciliation constraint: `available + allocated == initial`. |
| `availability_date` | DateTime | Required | ISO 8601 (`YYYY-MM-DDTHH:MM:SS`) | Timestamp | Non-unique | Date when lot is physically ready on factory floor. |
| `storage_bin` | String | Required | Matches regex `^BIN-[A-Z]-\d{2}-\d{2}$` | N/A | Non-unique | Warehouse bin address. |
| `supplier_code` | String | Required | Matches regex `^SUP-\d{3}$` | N/A | Non-unique | Supplier identifier. |

---

## 8. ProductionOrder (`production_orders.csv`)
Customer and replenishment demand orders requiring scheduled factory execution.

| Field Name | Type | Req / Opt | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `order_id` | String | Required | Matches regex `^ORD-2026-\d{6}$` | N/A | Unique (PK) | Primary Key. Format: `ORD-2026-000001` .. `ORD-2026-000500`. |
| `product_id` | String | Required | Valid `product_id` in `Product` | N/A | Non-unique (FK) | Foreign Key -> `Product.product_id`. |
| `routing_id` | String | Required | Valid `routing_id` in `Routing` | N/A | Non-unique (FK) | Foreign Key -> `Routing.routing_id`. |
| `order_quantity`| Integer | Required | Integer between `20` and `500` | EA | Non-unique | Batch quantity. Must be `> 0`. |
| `priority` | String | Required | `Urgent`, `High`, `Normal`, `Low` | N/A | Non-unique | Scheduling dispatch weight priority. |
| `release_date` | DateTime | Required | ISO 8601 (`YYYY-MM-DDTHH:MM:SS`) | Timestamp | Non-unique | Earliest permitted start date for manufacturing. |
| `due_date` | DateTime | Required | ISO 8601 (`YYYY-MM-DDTHH:MM:SS`) | Timestamp | Non-unique | Contractual deadline. Must be `> release_date`. |
| `customer_id` | String | Required | Matches regex `^CUST-\d{4}$` | N/A | Non-unique | Customer identifier. |
| `order_status` | String | Required | `RELEASED`, `SCHEDULED`, `COMPLETED`, `INFEASIBLE` | N/A | Non-unique | Lifecycle state. |

---

## 9. OperationSchedule (`operation_schedule.csv`)
Planned timeline assignments of operations to machines, including setup/changeover and run windows.

| Field Name | Type | Req / Opt | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `schedule_id` | String | Required | Matches regex `^SCH-2026-\d{6}$` | N/A | Unique (PK) | Primary Key. Zero-padded 6 digits. |
| `operation_id` | String | Required | Valid `operation_id` in `Operation` | N/A | Unique (1:1 with Op) | Foreign Key -> `Operation.operation_id`. |
| `order_id` | String | Required | Valid `order_id` in `ProductionOrder` | N/A | Non-unique (FK) | Foreign Key -> `ProductionOrder.order_id`. |
| `machine_id` | String | Required | Valid `machine_id` in `Machine` | N/A | Non-unique (FK) | Machine must be in operation's eligible machine set. |
| `changeover_start_time` | DateTime | Required | ISO 8601 (`YYYY-MM-DDTHH:MM:SS`) | Timestamp | Non-unique | Start of machine setup / tooling change. |
| `scheduled_start_time` | DateTime | Required | ISO 8601 (`YYYY-MM-DDTHH:MM:SS`) | Timestamp | Non-unique | Start of active execution. `= changeover_start_time + changeover_duration`. |
| `scheduled_end_time` | DateTime | Required | ISO 8601 (`YYYY-MM-DDTHH:MM:SS`) | Timestamp | Non-unique | End of execution. `= scheduled_start_time + execution_duration`. |
| `changeover_duration_minutes` | Integer | Required | Non-negative integer (`>= 0`) | Minutes | Non-unique | Determined by `ChangeoverMatrix`. |
| `execution_duration_minutes` | Integer | Required | Positive integer (`>= 15`) | Minutes | Non-unique | Equals operation's calculated standard duration. |
| `schedule_status`| String | Required | `PLANNED`, `DISPATCHED`, `COMPLETED`, `VIOLATED` | N/A | Non-unique | Lifecycle state of schedule record. |

---

## 10. ChangeoverMatrix (`changeover_matrix.csv`)
Sequence-dependent setup and tooling changeover durations when transitioning between products on a machine.

| Field Name | Type | Req / Opt | Allowed Values | Units | Uniqueness | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `changeover_id` | String | Required | Matches regex `^CHG-\d{6}$` | N/A | Unique (PK) | Primary Key. Zero-padded 6 digits. |
| `workcenter` | String | Required | Factory workcenter / machine type | N/A | Non-unique | Workcenter where changeover rule applies. |
| `from_product_family`| String | Required | Valid `product_family` | N/A | Non-unique | Prior product family processed on machine. |
| `to_product_family` | String | Required | Valid `product_family` | N/A | Non-unique | Next product family scheduled on machine. |
| `setup_duration_minutes`| Integer | Required | Integer between `0` and `120` | Minutes | Non-unique | `0` if same family; `30`-`120` if family transition occurs. |
| `requires_sterilization`| Boolean | Required | `TRUE`, `FALSE` | N/A | Non-unique | High-purity wash/sterilization flag. |

---

## 11. Ground Truth Anomaly Table (`ground_truth.csv`)
Known injected edge-case anomalies for objective scoring of the `ConstraintValidator`. Strictly isolated from feature inputs.

| Field Name | Type | Req / Opt | Allowed Values | Units | Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `anomaly_id` | String | Required | Matches regex `^ANOM-\d{4}$` | N/A | Unique Primary Key. |
| `anomaly_category` | String | Required | `MACHINE_OVERLAP`, `PRECEDENCE_VIOLATION`, `MATERIAL_UNAVAILABLE`, `CALENDAR_VIOLATION`, `CHANGEOVER_OMITTED` | N/A | Must match one of 5 required edge cases. |
| `target_schedule_id`| String | Required | Valid `schedule_id` | N/A | Schedule row containing injected fault. |
| `order_id` | String | Required | Valid `order_id` | N/A | Order affected by fault. |
| `operation_id` | String | Required | Valid `operation_id` | N/A | Operation affected by fault. |
| `machine_id` | String | Required | Valid `machine_id` | N/A | Machine asset affected. |
| `description` | String | Required | Human-readable explanation | N/A | Explains the physical violation injected. |
| `expected_flag` | String | Required | Exact validator flag token | N/A | Expected category string emitted by auditor. |
