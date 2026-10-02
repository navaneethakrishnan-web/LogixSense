-- ====================================================================
-- LogixSense - Oracle SQL DDL Schema & Seed Data Script
-- Compatible with Oracle 11g, 12c, 19c, 21c, 23c (SQL*Plus)
-- ====================================================================

-- Clean up existing tables (optional, un-comment if re-creating)
/*
DROP TABLE sos_alerts CASCADE CONSTRAINTS;
DROP TABLE driver_scores CASCADE CONSTRAINTS;
DROP TABLE behavior_events CASCADE CONSTRAINTS;
DROP TABLE trip_logs CASCADE CONSTRAINTS;
DROP TABLE notifications CASCADE CONSTRAINTS;
DROP TABLE assignments CASCADE CONSTRAINTS;
DROP TABLE stoppages CASCADE CONSTRAINTS;
DROP TABLE alerts CASCADE CONSTRAINTS;
DROP TABLE routes CASCADE CONSTRAINTS;
DROP TABLE shipments CASCADE CONSTRAINTS;
DROP TABLE companies CASCADE CONSTRAINTS;
DROP TABLE users CASCADE CONSTRAINTS;
*/

-- 1. Users Table
CREATE TABLE users (
  id VARCHAR2(100) PRIMARY KEY,
  email VARCHAR2(150) UNIQUE NOT NULL,
  password_hash VARCHAR2(255),
  name VARCHAR2(150) NOT NULL,
  role VARCHAR2(50) DEFAULT 'driver',
  company_id VARCHAR2(100),
  preferred_language VARCHAR2(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Companies Table
CREATE TABLE companies (
  id VARCHAR2(100) PRIMARY KEY,
  name VARCHAR2(150) NOT NULL,
  code VARCHAR2(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Shipments Table
CREATE TABLE shipments (
  id VARCHAR2(100) PRIMARY KEY,
  shipment_number VARCHAR2(100) UNIQUE NOT NULL,
  company_id VARCHAR2(100),
  driver_id VARCHAR2(100),
  origin VARCHAR2(255) NOT NULL,
  destination VARCHAR2(255) NOT NULL,
  status VARCHAR2(50) DEFAULT 'pending',
  risk_level VARCHAR2(50) DEFAULT 'low',
  eta VARCHAR2(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipment_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_shipment_driver FOREIGN KEY (driver_id) REFERENCES users(id)
);

-- 4. Routes Table
CREATE TABLE routes (
  id VARCHAR2(100) PRIMARY KEY,
  shipment_id VARCHAR2(100),
  origin VARCHAR2(255) NOT NULL,
  destination VARCHAR2(255) NOT NULL,
  distance_km NUMBER(10,2),
  est_time_mins NUMBER(10,0),
  time_saved_mins NUMBER(10,0) DEFAULT 0,
  risk_score NUMBER(5,0) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_route_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);

-- 5. Disruptions / Alerts Table
CREATE TABLE alerts (
  id VARCHAR2(100) PRIMARY KEY,
  shipment_id VARCHAR2(100),
  route_info VARCHAR2(500),
  risk_score NUMBER(5,0) DEFAULT 0,
  explanation VARCHAR2(1000),
  status VARCHAR2(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alert_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);

-- 6. Stoppages Table
CREATE TABLE stoppages (
  id VARCHAR2(100) PRIMARY KEY,
  shipment_id VARCHAR2(100),
  driver_id VARCHAR2(100),
  location VARCHAR2(255),
  duration_mins NUMBER(10,0) DEFAULT 0,
  reason VARCHAR2(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stoppage_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id),
  CONSTRAINT fk_stoppage_driver FOREIGN KEY (driver_id) REFERENCES users(id)
);

-- 7. Assignments Table
CREATE TABLE assignments (
  id VARCHAR2(100) PRIMARY KEY,
  shipment_id VARCHAR2(100),
  driver_uid VARCHAR2(100),
  company_id VARCHAR2(100),
  status VARCHAR2(50) DEFAULT 'assigned',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Notifications Table
CREATE TABLE notifications (
  id VARCHAR2(100) PRIMARY KEY,
  user_id VARCHAR2(100),
  driver_uid VARCHAR2(100),
  company_id VARCHAR2(100),
  title VARCHAR2(255) NOT NULL,
  message VARCHAR2(1000) NOT NULL,
  is_read NUMBER(1,0) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Trip Logs Table (Fuel & Carbon Emissions)
CREATE TABLE trip_logs (
  id VARCHAR2(100) PRIMARY KEY,
  driver_id VARCHAR2(100),
  month VARCHAR2(20) NOT NULL,
  co2_emitted_kg NUMBER(10,2) DEFAULT 0,
  co2_saved_kg NUMBER(10,2) DEFAULT 0,
  fuel_consumed_l NUMBER(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Driving Behavior Events Table
CREATE TABLE behavior_events (
  id VARCHAR2(100) PRIMARY KEY,
  driver_id VARCHAR2(100),
  shipment_id VARCHAR2(100),
  event_type VARCHAR2(100) NOT NULL,
  severity VARCHAR2(50) DEFAULT 'medium',
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Driver Safety Scores Table
CREATE TABLE driver_scores (
  driver_id VARCHAR2(100) PRIMARY KEY,
  driver_name VARCHAR2(150),
  safety_score NUMBER(5,0) DEFAULT 100,
  eco_score NUMBER(5,0) DEFAULT 100,
  total_trips NUMBER(10,0) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. SOS Emergency Alerts Table
CREATE TABLE sos_alerts (
  id VARCHAR2(100) PRIMARY KEY,
  driver_id VARCHAR2(100),
  shipment_id VARCHAR2(100),
  location_lat NUMBER(10,6),
  location_lng NUMBER(10,6),
  status VARCHAR2(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- SEED INITIAL LOGIXSENSE DEMO DATA
-- ====================================================================

-- Insert Companies
INSERT INTO companies (id, name, code) VALUES ('comp_01', 'Express Logistics India', 'ELI-01');
INSERT INTO companies (id, name, code) VALUES ('comp_02', 'Southern Freight Lines', 'SFL-02');

-- Insert Users
INSERT INTO users (id, email, name, role, company_id, preferred_language) 
VALUES ('usr_admin', 'admin@logixsense.com', 'System Admin', 'admin', 'comp_01', 'en');

INSERT INTO users (id, email, name, role, company_id, preferred_language) 
VALUES ('usr_driver1', 'arun@logixsense.com', 'Arun Kumar', 'driver', 'comp_01', 'ta');

INSERT INTO users (id, email, name, role, company_id, preferred_language) 
VALUES ('usr_driver2', 'rahul@logixsense.com', 'Rahul Sharma', 'driver', 'comp_01', 'hi');

-- Insert Shipments
INSERT INTO shipments (id, shipment_number, company_id, driver_id, origin, destination, status, risk_level, eta) 
VALUES ('SHP1001', 'SHP-2026-001', 'comp_01', 'usr_driver1', 'Chennai Port, TN', 'Bengaluru Hub, KA', 'in_transit', 'low', '4 hours');

INSERT INTO shipments (id, shipment_number, company_id, driver_id, origin, destination, status, risk_level, eta) 
VALUES ('SHP1002', 'SHP-2026-002', 'comp_01', 'usr_driver2', 'Mumbai JNPT, MH', 'Pune Industrial Zone, MH', 'in_transit', 'high', '2 hours');

INSERT INTO shipments (id, shipment_number, company_id, driver_id, origin, destination, status, risk_level, eta) 
VALUES ('SHP1003', 'SHP-2026-003', 'comp_01', 'usr_driver1', 'Delhi NCR Cargo Term', 'Agra Freight Depot, UP', 'pending', 'medium', '3 hours');

-- Insert Routes
INSERT INTO routes (id, shipment_id, origin, destination, distance_km, est_time_mins, time_saved_mins, risk_score)
VALUES ('ROT001', 'SHP1001', 'Chennai Port, TN', 'Bengaluru Hub, KA', 346.5, 360, 45, 12);

INSERT INTO routes (id, shipment_id, origin, destination, distance_km, est_time_mins, time_saved_mins, risk_score)
VALUES ('ROT002', 'SHP1002', 'Mumbai JNPT, MH', 'Pune Industrial Zone, MH', 148.0, 180, 15, 82);

-- Insert Disruption Alerts
INSERT INTO alerts (id, shipment_id, route_info, risk_score, explanation, status)
VALUES ('ALT001', 'SHP1002', 'Mumbai to Pune via NH48', 82, 'Heavy congestion at Khopoli ghat. Monsoon-related road damage detected.', 'active');

INSERT INTO alerts (id, shipment_id, route_info, risk_score, explanation, status)
VALUES ('ALT002', 'SHP1003', 'Delhi to Agra via NH19', 55, 'Toll plaza congestion near Mathura. Moderate delay expected.', 'active');

-- Insert Stoppages
INSERT INTO stoppages (id, shipment_id, driver_id, location, duration_mins, reason)
VALUES ('STP001', 'SHP1001', 'usr_driver1', 'Vellore Toll Plaza, TN', 25, 'Scheduled mandatory driver break & rest');

INSERT INTO stoppages (id, shipment_id, driver_id, location, duration_mins, reason)
VALUES ('STP002', 'SHP1002', 'usr_driver2', 'Lonavala Expressway Rest Area', 40, 'Vehicle tire inspection & refueling');

-- Insert Driver Scores
INSERT INTO driver_scores (driver_id, driver_name, safety_score, eco_score, total_trips)
VALUES ('usr_driver1', 'Arun Kumar', 94, 91, 142);

INSERT INTO driver_scores (driver_id, driver_name, safety_score, eco_score, total_trips)
VALUES ('usr_driver2', 'Rahul Sharma', 87, 85, 98);

-- Insert Trip Logs
INSERT INTO trip_logs (id, driver_id, month, co2_emitted_kg, co2_saved_kg, fuel_consumed_l)
VALUES ('LOG001', 'usr_driver1', '2026-08', 420.5, 68.0, 155.2);

INSERT INTO trip_logs (id, driver_id, month, co2_emitted_kg, co2_saved_kg, fuel_consumed_l)
VALUES ('LOG002', 'usr_driver2', '2026-08', 510.0, 42.5, 188.0);

COMMIT;
