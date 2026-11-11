// Realistic Industrial Manufacturing Dataset for Smart Production Scheduling System (APS)

export const initialOrders = [
  {
    order_id: "ORD-2026-000101",
    product: "SmartFrame Alpha",
    product_family: "SmartFrame",
    quantity: 250,
    priority: "Urgent",
    release_date: "2026-11-02",
    due_date: "2026-11-08",
    status: "In Production",
    progress: 75,
    customer: "Tesla Gigafactory Texas",
    revenue: "$62,500"
  },
  {
    order_id: "ORD-2026-000102",
    product: "OpticSensor Pro X9",
    product_family: "OpticSensor",
    quantity: 600,
    priority: "High",
    release_date: "2026-11-03",
    due_date: "2026-11-10",
    status: "Scheduled",
    progress: 35,
    customer: "Apple Supply Operations",
    revenue: "$114,000"
  },
  {
    order_id: "ORD-2026-000103",
    product: "PrecisionAlloy Rotor V2",
    product_family: "PrecisionAlloy",
    quantity: 120,
    priority: "Normal",
    release_date: "2026-11-04",
    due_date: "2026-11-15",
    status: "Scheduled",
    progress: 10,
    customer: "GE Aerospace Cincinnati",
    revenue: "$88,800"
  },
  {
    order_id: "ORD-2026-000104",
    product: "PowerModule 400V SiC",
    product_family: "PowerModule",
    quantity: 450,
    priority: "Urgent",
    release_date: "2026-11-02",
    due_date: "2026-11-07",
    status: "In Production",
    progress: 90,
    customer: "Rivian Automotive",
    revenue: "$142,500"
  },
  {
    order_id: "ORD-2026-000105",
    product: "MicroController Cortex M8",
    product_family: "MicroController",
    quantity: 1200,
    priority: "Low",
    release_date: "2026-11-05",
    due_date: "2026-11-20",
    status: "Pending",
    progress: 0,
    customer: "Bosch Industrial GmbH",
    revenue: "$96,000"
  },
  {
    order_id: "ORD-2026-000106",
    product: "SmartFrame Titanium Aero",
    product_family: "SmartFrame",
    quantity: 80,
    priority: "High",
    release_date: "2026-11-01",
    due_date: "2026-11-05",
    status: "Completed",
    progress: 100,
    customer: "Boeing Commercial Seattle",
    revenue: "$176,000"
  },
  {
    order_id: "ORD-2026-000107",
    product: "OpticSensor Dual LiDAR",
    product_family: "OpticSensor",
    quantity: 340,
    priority: "Normal",
    release_date: "2026-11-04",
    due_date: "2026-11-14",
    status: "Scheduled",
    progress: 20,
    customer: "Waymo Autonomous Systems",
    revenue: "$91,800"
  },
  {
    order_id: "ORD-2026-000108",
    product: "PowerModule Ultra 800V",
    product_family: "PowerModule",
    quantity: 500,
    priority: "Urgent",
    release_date: "2026-11-03",
    due_date: "2026-11-09",
    status: "Scheduled",
    progress: 15,
    customer: "Lucid Motors Casa Grande",
    revenue: "$210,000"
  },
  {
    order_id: "ORD-2026-000109",
    product: "PrecisionAlloy Impeller 5X",
    product_family: "PrecisionAlloy",
    quantity: 180,
    priority: "Normal",
    release_date: "2026-11-06",
    due_date: "2026-11-18",
    status: "Pending",
    progress: 0,
    customer: "Siemens Energy Berlin",
    revenue: "$77,400"
  },
  {
    order_id: "ORD-2026-000110",
    product: "MicroController Secure Node",
    product_family: "MicroController",
    quantity: 950,
    priority: "Low",
    release_date: "2026-11-07",
    due_date: "2026-11-25",
    status: "Pending",
    progress: 0,
    customer: "Schneider Electric Paris",
    revenue: "$57,000"
  }
];

export const initialMachines = [
  {
    machine_id: "MACH-001",
    machine_name: "5-Axis CNC Milling Center A1",
    workcenter: "CNC_MACHINING",
    status: "running",
    capacity: "24 hrs/day",
    utilization: 92.4,
    oee: 89.2,
    hourly_rate: "$185/hr",
    current_job: "OP-ORD-2026-000101-02",
    downtime_info: "Next planned PM: Nov 14 (3 hrs) • MTBF: 420 hrs • Zero unplanned stops in 14 days"
  },
  {
    machine_id: "MACH-002",
    machine_name: "High-Speed CNC Milling Center A2",
    workcenter: "CNC_MACHINING",
    status: "running",
    capacity: "24 hrs/day",
    utilization: 87.1,
    oee: 86.4,
    hourly_rate: "$195/hr",
    current_job: "OP-ORD-2026-000104-02",
    downtime_info: "Next planned PM: Nov 18 (2 hrs) • Spindle vibration: Nominal 0.42 mm/s"
  },
  {
    machine_id: "MACH-003",
    machine_name: "Fiber Laser Cutting Gantry 10kW",
    workcenter: "CUTTING_BAY",
    status: "running",
    capacity: "20 hrs/day",
    utilization: 94.8,
    oee: 91.5,
    hourly_rate: "$145/hr",
    current_job: "OP-ORD-2026-000102-01",
    downtime_info: "Optical lens cleaned Nov 08 • Auto-nozzle calibration OK • Assist gas: 99.99% N2"
  },
  {
    machine_id: "MACH-004",
    machine_name: "Abrasive Waterjet Precision Cell",
    workcenter: "CUTTING_BAY",
    status: "available",
    capacity: "16 hrs/day",
    utilization: 64.2,
    oee: 78.9,
    hourly_rate: "$130/hr",
    current_job: "Standby (Ready for batch)",
    downtime_info: "Garnet abrasive hopper at 88% • Intensifier pump pressure: 60,000 PSI"
  },
  {
    machine_id: "MACH-005",
    machine_name: "Multi-Spindle Automated Drill Press",
    workcenter: "DRILL_PRESS",
    status: "available",
    capacity: "16 hrs/day",
    utilization: 58.5,
    oee: 82.0,
    hourly_rate: "$85/hr",
    current_job: "Standby",
    downtime_info: "Carbide tooling replaced Nov 06 • Collet runout check: <0.003 mm"
  },
  {
    machine_id: "MACH-006",
    machine_name: "Vacuum Induction Thermal Furnace",
    workcenter: "THERMAL_CELL",
    status: "maintenance",
    capacity: "24 hrs/day",
    utilization: 42.0,
    oee: 65.4,
    hourly_rate: "$240/hr",
    current_job: "Under Calibrated Bake-Out",
    downtime_info: "Scheduled thermocouple re-certification in progress (est. completion in 2.5 hrs)"
  },
  {
    machine_id: "MACH-007",
    machine_name: "Automated Anodizing & Polish Line",
    workcenter: "SURFACE_FINISH",
    status: "running",
    capacity: "20 hrs/day",
    utilization: 83.3,
    oee: 85.0,
    hourly_rate: "$110/hr",
    current_job: "OP-ORD-2026-000106-03",
    downtime_info: "Bath pH: 5.4 (nominal) • Ultrasonic agitation online • Next purge: Nov 16"
  },
  {
    machine_id: "MACH-008",
    machine_name: "Robotic Cleanroom Cell ISO-Class 5",
    workcenter: "ASSEMBLY_LINE",
    status: "running",
    capacity: "24 hrs/day",
    utilization: 95.2,
    oee: 93.8,
    hourly_rate: "$320/hr",
    current_job: "OP-ORD-2026-000102-03",
    downtime_info: "Laminar airflow: 0.45 m/s • Particle count: 0 ppm • HEPA differential: 120 Pa"
  },
  {
    machine_id: "MACH-009",
    machine_name: "Surface Mount Technology (SMT) Line",
    workcenter: "ASSEMBLY_LINE",
    status: "running",
    capacity: "24 hrs/day",
    utilization: 89.0,
    oee: 88.5,
    hourly_rate: "$280/hr",
    current_job: "OP-ORD-2026-000104-03",
    downtime_info: "Solder paste inspection 3D yield: 99.82% • Feeder bank utilization: 94%"
  },
  {
    machine_id: "MACH-010",
    machine_name: "Optical Coordinate Metrology Lab (CMM)",
    workcenter: "QUALITY_LAB",
    status: "available",
    capacity: "16 hrs/day",
    utilization: 71.0,
    oee: 90.2,
    hourly_rate: "$160/hr",
    current_job: "Inspecting Batch ORD-106",
    downtime_info: "Laser interferometer self-calibrated 04:00 AM • Ruby stylus probe calibrated"
  }
];

export const initialMaterials = [
  {
    material_id: "MAT-0101",
    material_name: "Aerospace Titanium Alloy Sheet (Ti-6Al-4V)",
    category: "Metals & Alloys",
    unit: "SHEET",
    available_qty: 480,
    required_qty: 320,
    safety_stock: 150,
    unit_cost: "$420.00",
    availability_date: "2026-11-02",
    storage_bin: "BAY-C-RACK-04",
    supplier: "Titanium Precision Metals Corp",
    status: "in_stock"
  },
  {
    material_id: "MAT-0102",
    material_name: "Optical Quartz Sensor Lens Grade AA",
    category: "Optics & Photonics",
    unit: "PCS",
    available_qty: 1250,
    required_qty: 940,
    safety_stock: 400,
    unit_cost: "$85.50",
    availability_date: "2026-11-02",
    storage_bin: "CLEAN-LOCK-02",
    supplier: "Zeiss Optronics Solutions",
    status: "in_stock"
  },
  {
    material_id: "MAT-0103",
    material_name: "High-Conductivity Copper Busbar (C11000)",
    category: "Electrical Conductors",
    unit: "BAR",
    available_qty: 85,
    required_qty: 160,
    safety_stock: 100,
    unit_cost: "$145.00",
    availability_date: "2026-11-06",
    storage_bin: "BAY-A-RACK-12",
    supplier: "Aurubis Copper Technologies",
    status: "low_stock"
  },
  {
    material_id: "MAT-0104",
    material_name: "Silicon Carbide (SiC) Power Substrate 150mm",
    category: "Semiconductors",
    unit: "PCS",
    available_qty: 24,
    required_qty: 90,
    safety_stock: 80,
    unit_cost: "$680.00",
    availability_date: "2026-11-08",
    storage_bin: "NITRO-CABINET-01",
    supplier: "Wolfspeed Power Materials",
    status: "critical"
  },
  {
    material_id: "MAT-0105",
    material_name: "Micro-BGA 64-bit Core Processor Die",
    category: "Semiconductors",
    unit: "PCS",
    available_qty: 2800,
    required_qty: 1200,
    safety_stock: 800,
    unit_cost: "$38.00",
    availability_date: "2026-11-02",
    storage_bin: "CLEAN-CABINET-08",
    supplier: "TSMC Distribution Center",
    status: "in_stock"
  },
  {
    material_id: "MAT-0106",
    material_name: "Thermal Interface Paste 12W/m-K",
    category: "Chemicals & Synthetics",
    unit: "LITER",
    available_qty: 42,
    required_qty: 35,
    safety_stock: 30,
    unit_cost: "$210.00",
    availability_date: "2026-11-03",
    storage_bin: "CHEM-STORAGE-03",
    supplier: "Dow Corning Specialty Chem",
    status: "low_stock"
  },
  {
    material_id: "MAT-0107",
    material_name: "Synthetic Coolant Bio-Stable Fluid",
    category: "Coolants & Fluids",
    unit: "LITER",
    available_qty: 850,
    required_qty: 400,
    safety_stock: 250,
    unit_cost: "$18.50",
    availability_date: "2026-11-01",
    storage_bin: "FLUID-DRUM-BAY",
    supplier: "Blaser Swisslube Inc",
    status: "in_stock"
  },
  {
    material_id: "MAT-0108",
    material_name: "Laser Assist Nitrogen Gas High-Purity Pack",
    category: "Industrial Gases",
    unit: "UNIT",
    available_qty: 18,
    required_qty: 14,
    safety_stock: 10,
    unit_cost: "$550.00",
    availability_date: "2026-11-02",
    storage_bin: "GAS-PAD-SOUTH",
    supplier: "Air Liquide Industrial",
    status: "in_stock"
  }
];

export const initialAlerts = [
  {
    id: "ALT-001",
    category: "MACHINE_OVERLAP",
    type: "Critical Hard Conflict",
    title: "Dual Operations Overlap on MACH-001",
    description: "Laser sensor detected simultaneous dispatch of OP-ORD-2026-000101-02 and OP-ORD-2026-000104-02 between 14:00 and 15:30.",
    severity: "critical",
    target: "MACH-001 (5-Axis CNC Mill)",
    timestamp: "10 mins ago",
    resolved: false
  },
  {
    id: "ALT-002",
    category: "PRECEDENCE_VIOLATION",
    type: "Sequence Integrity",
    title: "Downstream Assembly Dispatched Prematurely",
    description: "Cleanroom Assembly OP-03 for Order ORD-102 was planned to start at 11:30, 45 minutes prior to CNC Predecessor OP-02 completion.",
    severity: "critical",
    target: "ORD-2026-000102 (Step 3)",
    timestamp: "24 mins ago",
    resolved: false
  },
  {
    id: "ALT-003",
    category: "MATERIAL_UNAVAILABLE",
    type: "Inventory Shortage",
    title: "SiC Substrates Not Released by Incoming QC",
    description: "Material MAT-0104 lot LOT-000412 arrives Nov 08, but PowerModule OP-01 is scheduled for Nov 06. 66 units short.",
    severity: "warning",
    target: "MAT-0104 / ORD-2026-000104",
    timestamp: "1 hr ago",
    resolved: false
  },
  {
    id: "ALT-004",
    category: "CALENDAR_VIOLATION",
    type: "Shift & Maintenance Conflict",
    title: "Execution Intersects Scheduled Thermal Re-Calibration",
    description: "Operation scheduled on MACH-006 collides with mandatory 3-hour preventive maintenance cycle between 08:00 and 11:00.",
    severity: "warning",
    target: "MACH-006 (Vacuum Furnace)",
    timestamp: "2 hrs ago",
    resolved: false
  },
  {
    id: "ALT-005",
    category: "CHANGEOVER_OMITTED",
    type: "Setup & Sanitization",
    title: "Missing 30m Changeover Between Product Families",
    description: "Direct switch from SmartFrame (Alloy) to OpticSensor (Optical Glass) without sterilization and nozzle decontamination purge.",
    severity: "warning",
    target: "MACH-003 (Fiber Laser)",
    timestamp: "3 hrs ago",
    resolved: false
  }
];

// Interactive Gantt Schedule Mock Data (Timeline over 24-hour cycle)
export const initialGanttMachines = [
  {
    machine_id: "MACH-001",
    name: "5-Axis CNC Mill A1",
    workcenter: "CNC",
    tasks: [
      { id: "T1", order: "ORD-101", op: "OP-10", start: 6, end: 11, color: "bg-blue-600", label: "SmartFrame Milling (ORD-101)", family: "SmartFrame" },
      { id: "C1", type: "changeover", start: 11, end: 11.75, color: "bg-amber-500", label: "Tool Change (45m)", family: "Setup" },
      { id: "T2", order: "ORD-103", op: "OP-20", start: 11.75, end: 17, color: "bg-indigo-600", label: "Rotor Profiling (ORD-103)", family: "PrecisionAlloy" },
      { id: "T3", order: "ORD-107", op: "OP-20", start: 17.5, end: 23, color: "bg-emerald-600", label: "LiDAR Bracket (ORD-107)", family: "OpticSensor" }
    ]
  },
  {
    machine_id: "MACH-002",
    name: "CNC Milling A2",
    workcenter: "CNC",
    tasks: [
      { id: "T4", order: "ORD-104", op: "OP-10", start: 6, end: 13, color: "bg-purple-600", label: "SiC Module Heat Sink (ORD-104)", family: "PowerModule" },
      { id: "T5", order: "ORD-108", op: "OP-10", start: 14, end: 21.5, color: "bg-purple-700", label: "800V Busbar Channel (ORD-108)", family: "PowerModule" }
    ]
  },
  {
    machine_id: "MACH-003",
    name: "Fiber Laser Gantry 10kW",
    workcenter: "Cutting",
    tasks: [
      { id: "T6", order: "ORD-102", op: "OP-10", start: 6, end: 10.5, color: "bg-cyan-600", label: "Lens Bezel Sheet Cut (ORD-102)", family: "OpticSensor" },
      { id: "C2", type: "changeover", start: 10.5, end: 11, color: "bg-amber-500", label: "Nozzle Swap (30m)", family: "Setup" },
      { id: "T7", order: "ORD-101", op: "OP-05", start: 11, end: 16.5, color: "bg-blue-600", label: "Titanium Frame Blanking (ORD-101)", family: "SmartFrame" },
      { id: "T8", order: "ORD-106", op: "OP-05", start: 17, end: 22, color: "bg-blue-700", label: "Aero Stiffener Blank (ORD-106)", family: "SmartFrame" }
    ]
  },
  {
    machine_id: "MACH-004",
    name: "Precision Waterjet Cell",
    workcenter: "Cutting",
    tasks: [
      { id: "T9", order: "ORD-103", op: "OP-10", start: 8, end: 14.5, color: "bg-indigo-600", label: "Precision Rotor Disk Blank (ORD-103)", family: "PrecisionAlloy" },
      { id: "T10", order: "ORD-109", op: "OP-10", start: 16, end: 22, color: "bg-indigo-700", label: "Impeller Hub Cut (ORD-109)", family: "PrecisionAlloy" }
    ]
  },
  {
    machine_id: "MACH-006",
    name: "Vacuum Induction Furnace",
    workcenter: "Thermal",
    tasks: [
      { id: "M1", type: "maintenance", start: 6, end: 9.5, color: "bg-rose-500", label: "Scheduled PM & Thermocouple Cal", family: "Maintenance" },
      { id: "T11", order: "ORD-106", op: "OP-20", start: 10, end: 16.5, color: "bg-blue-700", label: "Solution Heat Treat T6 (ORD-106)", family: "SmartFrame" },
      { id: "T12", order: "ORD-103", op: "OP-30", start: 17, end: 23.5, color: "bg-indigo-600", label: "Vacuum Stress Relief (ORD-103)", family: "PrecisionAlloy" }
    ]
  },
  {
    machine_id: "MACH-008",
    name: "Robotic Cleanroom Cell 01",
    workcenter: "Assembly",
    tasks: [
      { id: "T13", order: "ORD-102", op: "OP-30", start: 7, end: 13.5, color: "bg-cyan-600", label: "Optic Prism Micro-Alignment (ORD-102)", family: "OpticSensor" },
      { id: "C3", type: "changeover", start: 13.5, end: 14.25, color: "bg-amber-500", label: "Cleanroom Sterilization (45m)", family: "Setup" },
      { id: "T14", order: "ORD-107", op: "OP-30", start: 14.25, end: 21, color: "bg-emerald-600", label: "LiDAR Optical Engine Assy (ORD-107)", family: "OpticSensor" }
    ]
  },
  {
    machine_id: "MACH-010",
    name: "Optical CMM Metrology Lab",
    workcenter: "Quality",
    tasks: [
      { id: "T15", order: "ORD-106", op: "OP-40", start: 7, end: 11, color: "bg-emerald-700", label: "Final Geometric Inspection (ORD-106)", family: "Quality" },
      { id: "T16", order: "ORD-101", op: "OP-40", start: 12, end: 16.5, color: "bg-emerald-700", label: "CMM Coordinate Verification (ORD-101)", family: "Quality" },
      { id: "T17", order: "ORD-104", op: "OP-40", start: 17, end: 22, color: "bg-emerald-700", label: "Dielectric High-Pot & Thermal Scan", family: "Quality" }
    ]
  }
];

// Production Performance Chart Data
export const productionPerformanceData = [
  { day: "Mon", planned: 420, actual: 445, throughput: 92 },
  { day: "Tue", planned: 460, actual: 470, throughput: 95 },
  { day: "Wed", planned: 490, actual: 480, throughput: 91 },
  { day: "Thu", planned: 520, actual: 535, throughput: 97 },
  { day: "Fri", planned: 550, actual: 560, throughput: 96 },
  { day: "Sat", planned: 380, actual: 395, throughput: 94 },
  { day: "Sun", planned: 310, actual: 320, throughput: 98 }
];

// Machine Utilization by Workcenter
export const workcenterUtilizationData = [
  { workcenter: "CNC Machining", productive: 86, changeover: 8, idle: 6 },
  { workcenter: "Cutting Bay", productive: 89, changeover: 7, idle: 4 },
  { workcenter: "Thermal Cell", productive: 74, changeover: 12, idle: 14 },
  { workcenter: "Assembly Line", productive: 92, changeover: 5, idle: 3 },
  { workcenter: "Drill Press", productive: 68, changeover: 4, idle: 28 },
  { workcenter: "Surface Finish", productive: 82, changeover: 9, idle: 9 },
  { workcenter: "Quality Lab", productive: 88, changeover: 4, idle: 8 }
];

// On-time Delivery Trend
export const onTimeDeliveryData = [
  { month: "Jun", otd: 88.5, target: 90 },
  { month: "Jul", otd: 89.8, target: 90 },
  { month: "Aug", otd: 91.2, target: 92 },
  { month: "Sep", otd: 93.0, target: 92 },
  { month: "Oct", otd: 94.6, target: 94 },
  { month: "Nov (Current)", otd: 95.8, target: 94 }
];

