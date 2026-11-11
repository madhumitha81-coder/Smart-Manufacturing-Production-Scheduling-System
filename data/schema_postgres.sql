
-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS schedule_violations CASCADE;
DROP TABLE IF EXISTS ground_truth CASCADE;
DROP TABLE IF EXISTS operation_schedule CASCADE;
DROP TABLE IF EXISTS operations CASCADE;
DROP TABLE IF EXISTS production_orders CASCADE;
DROP TABLE IF EXISTS inventory_lots CASCADE;
DROP TABLE IF EXISTS machine_calendar CASCADE;
DROP TABLE IF EXISTS changeover_matrix CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS routings CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS materials CASCADE;

-- 1. Materials
CREATE TABLE materials (
    material_id VARCHAR(30) PRIMARY KEY,
    material_name VARCHAR(150) NOT NULL,
    material_category VARCHAR(100) NOT NULL,
    unit_of_measure VARCHAR(20) NOT NULL,
    standard_unit_cost NUMERIC(10, 2) NOT NULL CHECK (standard_unit_cost > 0),
    lead_time_days INTEGER NOT NULL CHECK (lead_time_days >= 1)
);

-- 2. Products
CREATE TABLE products (
    product_id VARCHAR(30) PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    product_family VARCHAR(50) NOT NULL,
    unit_of_measure VARCHAR(20) NOT NULL,
    base_cost NUMERIC(10, 2) NOT NULL CHECK (base_cost > 0),
    created_at TIMESTAMP NOT NULL
);

-- 3. Routings
CREATE TABLE routings (
    routing_id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(30) NOT NULL REFERENCES products(product_id),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    total_steps INTEGER NOT NULL CHECK (total_steps BETWEEN 2 AND 6),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT
);

-- 4. Machines
CREATE TABLE machines (
    machine_id VARCHAR(30) PRIMARY KEY,
    machine_name VARCHAR(100) NOT NULL,
    workcenter VARCHAR(50) NOT NULL,
    capability VARCHAR(50) NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
);

-- 5. Machine Calendar
CREATE TABLE machine_calendar (
    calendar_id VARCHAR(30) PRIMARY KEY,
    machine_id VARCHAR(30) NOT NULL REFERENCES machines(machine_id),
    shift_name VARCHAR(100) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_available BOOLEAN NOT NULL,
    reason VARCHAR(100) NOT NULL,
    CONSTRAINT chk_cal_dates CHECK (start_time < end_time)
);

-- 6. Inventory Lots
CREATE TABLE inventory_lots (
    lot_id VARCHAR(30) PRIMARY KEY,
    material_id VARCHAR(30) NOT NULL REFERENCES materials(material_id),
    initial_quantity NUMERIC(12, 2) NOT NULL CHECK (initial_quantity >= 0),
    allocated_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.0 CHECK (allocated_quantity >= 0),
    available_quantity NUMERIC(12, 2) NOT NULL CHECK (available_quantity >= 0),
    availability_date TIMESTAMP NOT NULL,
    storage_bin VARCHAR(50) NOT NULL,
    supplier_code VARCHAR(50) NOT NULL,
    reconciled BOOLEAN NOT NULL DEFAULT TRUE
);

-- 7. Production Orders
CREATE TABLE production_orders (
    order_id VARCHAR(30) PRIMARY KEY,
    product_id VARCHAR(30) NOT NULL REFERENCES products(product_id),
    routing_id VARCHAR(50) NOT NULL REFERENCES routings(routing_id),
    order_quantity INTEGER NOT NULL CHECK (order_quantity > 0),
    priority VARCHAR(20) NOT NULL,
    release_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    order_status VARCHAR(30) NOT NULL DEFAULT 'RELEASED',
    CONSTRAINT chk_order_dates CHECK (release_date < due_date)
);

-- 8. Operations
CREATE TABLE operations (
    operation_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(30) NOT NULL REFERENCES production_orders(order_id),
    routing_id VARCHAR(50) NOT NULL REFERENCES routings(routing_id),
    sequence_num INTEGER NOT NULL CHECK (sequence_num >= 10),
    operation_type VARCHAR(50) NOT NULL,
    eligible_machine_ids TEXT NOT NULL,
    standard_duration_minutes INTEGER NOT NULL CHECK (standard_duration_minutes >= 15),
    required_material_id VARCHAR(30) NOT NULL,
    required_material_qty NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    predecessor_operation_id VARCHAR(50) NOT NULL
);

-- 9. Operation Schedule
CREATE TABLE operation_schedule (
    schedule_id VARCHAR(30) PRIMARY KEY,
    operation_id VARCHAR(50) NOT NULL REFERENCES operations(operation_id),
    order_id VARCHAR(30) NOT NULL REFERENCES production_orders(order_id),
    machine_id VARCHAR(30) NOT NULL REFERENCES machines(machine_id),
    changeover_start_time TIMESTAMP NOT NULL,
    scheduled_start_time TIMESTAMP NOT NULL,
    scheduled_end_time TIMESTAMP NOT NULL,
    changeover_duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (changeover_duration_minutes >= 0),
    execution_duration_minutes INTEGER NOT NULL CHECK (execution_duration_minutes >= 15),
    schedule_status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    CONSTRAINT chk_sched_dates CHECK (scheduled_start_time < scheduled_end_time)
);

-- 10. Changeover Matrix
CREATE TABLE changeover_matrix (
    changeover_id VARCHAR(30) PRIMARY KEY,
    workcenter VARCHAR(50) NOT NULL,
    from_product_family VARCHAR(50) NOT NULL,
    to_product_family VARCHAR(50) NOT NULL,
    setup_duration_minutes INTEGER NOT NULL CHECK (setup_duration_minutes >= 0),
    requires_sterilization BOOLEAN NOT NULL DEFAULT FALSE
);

-- 11. Ground Truth Anomalies
CREATE TABLE ground_truth (
    anomaly_id VARCHAR(30) PRIMARY KEY,
    anomaly_category VARCHAR(50) NOT NULL,
    target_schedule_id VARCHAR(30) NOT NULL,
    order_id VARCHAR(30) NOT NULL,
    operation_id VARCHAR(50) NOT NULL,
    machine_id VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    expected_flag VARCHAR(50) NOT NULL
);

-- 12. Schedule Violations
CREATE TABLE schedule_violations (
    violation_id VARCHAR(30) PRIMARY KEY,
    violation_category VARCHAR(50) NOT NULL,
    schedule_id VARCHAR(30) NOT NULL,
    order_id VARCHAR(30) NOT NULL,
    operation_id VARCHAR(50) NOT NULL,
    machine_id VARCHAR(30) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    details TEXT NOT NULL
);

-- Helpful Indexes for Performance
CREATE INDEX idx_ops_order ON operations(order_id);
CREATE INDEX idx_sched_machine ON operation_schedule(machine_id, scheduled_start_time);
CREATE INDEX idx_cal_machine ON machine_calendar(machine_id, start_time);
CREATE INDEX idx_lots_material ON inventory_lots(material_id);
