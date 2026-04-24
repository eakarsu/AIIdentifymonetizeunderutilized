const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'energy_grid_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  console.log('🌱 Starting database seed...');

  // Drop and recreate tables
  await pool.query(`
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS buildings CASCADE;
    DROP TABLE IF EXISTS energy_audits CASCADE;
    DROP TABLE IF EXISTS capacity_detections CASCADE;
    DROP TABLE IF EXISTS community_needs CASCADE;
    DROP TABLE IF EXISTS aggregation_plans CASCADE;
    DROP TABLE IF EXISTS grid_stability CASCADE;
    DROP TABLE IF EXISTS equity_scores CASCADE;
    DROP TABLE IF EXISTS redistribution_plans CASCADE;
    DROP TABLE IF EXISTS demand_response CASCADE;
    DROP TABLE IF EXISTS capacity_forecasts CASCADE;
    DROP TABLE IF EXISTS impact_reports CASCADE;
    DROP TABLE IF EXISTS energy_savings CASCADE;
    DROP TABLE IF EXISTS alerts CASCADE;
    DROP TABLE IF EXISTS compliance_reports CASCADE;
    DROP TABLE IF EXISTS partners CASCADE;
  `);

  // Create tables
  await pool.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'analyst',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE buildings (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address TEXT,
      building_type VARCHAR(100),
      total_capacity_kw DECIMAL(10,2),
      utilized_capacity_kw DECIMAL(10,2),
      floors INTEGER,
      square_footage INTEGER,
      year_built INTEGER,
      owner VARCHAR(255),
      contact_email VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE energy_audits (
      id SERIAL PRIMARY KEY,
      building_name VARCHAR(255) NOT NULL,
      auditor VARCHAR(255),
      audit_date DATE,
      energy_rating VARCHAR(10),
      total_consumption_kwh DECIMAL(12,2),
      waste_percentage DECIMAL(5,2),
      recommendations TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE capacity_detections (
      id SERIAL PRIMARY KEY,
      building_name VARCHAR(255) NOT NULL,
      location TEXT,
      capacity_type VARCHAR(100),
      total_capacity_kw DECIMAL(10,2),
      used_capacity_kw DECIMAL(10,2),
      available_capacity_kw DECIMAL(10,2),
      detection_method VARCHAR(100),
      confidence_score DECIMAL(5,2),
      status VARCHAR(50) DEFAULT 'detected',
      detected_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE community_needs (
      id SERIAL PRIMARY KEY,
      community_name VARCHAR(255) NOT NULL,
      location TEXT,
      population INTEGER,
      median_income DECIMAL(10,2),
      energy_burden_pct DECIMAL(5,2),
      current_provider VARCHAR(255),
      needs_description TEXT,
      priority INTEGER DEFAULT 3,
      status VARCHAR(50) DEFAULT 'assessed',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE aggregation_plans (
      id SERIAL PRIMARY KEY,
      plan_name VARCHAR(255) NOT NULL,
      region VARCHAR(255),
      buildings_count INTEGER,
      total_aggregated_kw DECIMAL(10,2),
      target_community VARCHAR(255),
      estimated_savings DECIMAL(12,2),
      start_date DATE,
      end_date DATE,
      status VARCHAR(50) DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE grid_stability (
      id SERIAL PRIMARY KEY,
      region VARCHAR(255) NOT NULL,
      frequency_hz DECIMAL(6,3),
      voltage_kv DECIMAL(8,2),
      load_mw DECIMAL(10,2),
      generation_mw DECIMAL(10,2),
      renewable_pct DECIMAL(5,2),
      stability_index DECIMAL(5,2),
      risk_level VARCHAR(50) DEFAULT 'low',
      status VARCHAR(50) DEFAULT 'normal',
      recorded_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE equity_scores (
      id SERIAL PRIMARY KEY,
      community_name VARCHAR(255) NOT NULL,
      region VARCHAR(255),
      score DECIMAL(5,2),
      energy_access_score DECIMAL(5,2),
      affordability_score DECIMAL(5,2),
      reliability_score DECIMAL(5,2),
      environmental_score DECIMAL(5,2),
      health_impact_score DECIMAL(5,2),
      assessment_date DATE,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE redistribution_plans (
      id SERIAL PRIMARY KEY,
      plan_name VARCHAR(255) NOT NULL,
      source_buildings TEXT,
      target_community VARCHAR(255),
      capacity_kw DECIMAL(10,2),
      estimated_beneficiaries INTEGER,
      cost_estimate DECIMAL(12,2),
      timeline_months INTEGER,
      priority INTEGER DEFAULT 3,
      status VARCHAR(50) DEFAULT 'proposed',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE demand_response (
      id SERIAL PRIMARY KEY,
      program_name VARCHAR(255) NOT NULL,
      program_type VARCHAR(100),
      region VARCHAR(255),
      enrolled_buildings INTEGER,
      capacity_committed_kw DECIMAL(10,2),
      incentive_rate DECIMAL(8,4),
      season VARCHAR(50),
      peak_hours VARCHAR(100),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE capacity_forecasts (
      id SERIAL PRIMARY KEY,
      region VARCHAR(255) NOT NULL,
      forecast_date DATE,
      predicted_demand_mw DECIMAL(10,2),
      predicted_supply_mw DECIMAL(10,2),
      predicted_surplus_mw DECIMAL(10,2),
      confidence_pct DECIMAL(5,2),
      weather_factor VARCHAR(100),
      season VARCHAR(50),
      model_version VARCHAR(50),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE impact_reports (
      id SERIAL PRIMARY KEY,
      report_title VARCHAR(255) NOT NULL,
      community_name VARCHAR(255),
      report_date DATE,
      households_served INTEGER,
      energy_saved_kwh DECIMAL(12,2),
      cost_savings DECIMAL(12,2),
      carbon_reduction_tons DECIMAL(10,2),
      jobs_created INTEGER,
      satisfaction_score DECIMAL(3,1),
      status VARCHAR(50) DEFAULT 'published',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE energy_savings (
      id SERIAL PRIMARY KEY,
      building_name VARCHAR(255) NOT NULL,
      period VARCHAR(50),
      baseline_kwh DECIMAL(12,2),
      actual_kwh DECIMAL(12,2),
      saved_kwh DECIMAL(12,2),
      savings_pct DECIMAL(5,2),
      cost_saved DECIMAL(10,2),
      method VARCHAR(100),
      verified BOOLEAN DEFAULT false,
      status VARCHAR(50) DEFAULT 'recorded',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE alerts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      alert_type VARCHAR(100),
      severity VARCHAR(50),
      source VARCHAR(255),
      description TEXT,
      region VARCHAR(255),
      acknowledged BOOLEAN DEFAULT false,
      resolved_at TIMESTAMP,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE compliance_reports (
      id SERIAL PRIMARY KEY,
      report_name VARCHAR(255) NOT NULL,
      regulation VARCHAR(255),
      jurisdiction VARCHAR(255),
      due_date DATE,
      submitted_date DATE,
      compliance_score DECIMAL(5,2),
      findings TEXT,
      corrective_actions TEXT,
      auditor VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE partners (
      id SERIAL PRIMARY KEY,
      partner_name VARCHAR(255) NOT NULL,
      partner_type VARCHAR(100),
      contact_person VARCHAR(255),
      contact_email VARCHAR(255),
      phone VARCHAR(50),
      region VARCHAR(255),
      services_offered TEXT,
      buildings_managed INTEGER,
      partnership_since DATE,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('✅ Tables created');

  // Seed users
  const passwordHash = await bcrypt.hash('admin123', 10);
  await pool.query(`
    INSERT INTO users (name, email, password_hash, role) VALUES
    ('Admin User', 'admin@energygrid.com', '${passwordHash}', 'admin'),
    ('Sarah Chen', 'sarah@energygrid.com', '${passwordHash}', 'analyst'),
    ('Marcus Johnson', 'marcus@energygrid.com', '${passwordHash}', 'manager')
  `);
  console.log('✅ Users seeded');

  // Seed buildings (15 items)
  await pool.query(`
    INSERT INTO buildings (name, address, building_type, total_capacity_kw, utilized_capacity_kw, floors, square_footage, year_built, owner, contact_email, status) VALUES
    ('Meridian Tower', '100 Financial District, San Francisco, CA', 'Office', 2500.00, 1800.00, 45, 450000, 2015, 'Meridian Properties LLC', 'ops@meridian.com', 'active'),
    ('Pacific Commerce Center', '250 Market St, San Francisco, CA', 'Mixed Use', 3200.00, 2100.00, 38, 520000, 2010, 'Pacific Realty Group', 'mgmt@pacificrealty.com', 'active'),
    ('Harbor Point Mall', '500 Embarcadero, San Francisco, CA', 'Retail', 1800.00, 950.00, 4, 280000, 2005, 'Harbor Retail Inc', 'facilities@harborpoint.com', 'active'),
    ('TechHub Campus', '1200 Innovation Way, San Jose, CA', 'Technology', 4500.00, 3200.00, 12, 680000, 2018, 'TechHub Ventures', 'energy@techhub.com', 'active'),
    ('Central Medical Plaza', '800 Health Ave, Oakland, CA', 'Healthcare', 3800.00, 3400.00, 15, 390000, 2012, 'Bay Area Health Systems', 'facilities@centralmed.com', 'active'),
    ('Sunset Industrial Park', '1500 Industrial Blvd, Richmond, CA', 'Industrial', 5200.00, 2800.00, 3, 750000, 1998, 'Sunset Holdings', 'ops@sunsetindustrial.com', 'active'),
    ('Bayside Hotel & Conference', '300 Waterfront Dr, San Francisco, CA', 'Hospitality', 2200.00, 1600.00, 28, 340000, 2008, 'Bayside Hospitality Group', 'eng@baysidehotel.com', 'active'),
    ('University Research Center', '900 Academic Dr, Berkeley, CA', 'Education', 2800.00, 1900.00, 8, 420000, 2016, 'UC Berkeley Foundation', 'facilities@ucresearch.edu', 'active'),
    ('Metro Transit Hub', '50 Transit Plaza, San Francisco, CA', 'Transportation', 1500.00, 1100.00, 5, 180000, 2020, 'SF Metro Authority', 'energy@sfmetro.gov', 'active'),
    ('Greenfield Data Center', '2000 Server Rd, Santa Clara, CA', 'Data Center', 8500.00, 6200.00, 2, 120000, 2019, 'CloudFirst Inc', 'ops@cloudfirst.com', 'active'),
    ('Heritage Office Park', '400 Oak Lane, Palo Alto, CA', 'Office', 1200.00, 650.00, 6, 180000, 1995, 'Heritage Properties', 'mgmt@heritagepark.com', 'active'),
    ('Valley Logistics Center', '3500 Distribution Way, Fremont, CA', 'Warehouse', 3000.00, 1200.00, 2, 500000, 2002, 'Valley Logistics Corp', 'ops@valleylogistics.com', 'active'),
    ('Civic Center Complex', '1 City Hall Plaza, San Jose, CA', 'Government', 2000.00, 1500.00, 10, 300000, 2000, 'City of San Jose', 'facilities@sanjose.gov', 'active'),
    ('Oceanview Apartments', '750 Coast Hwy, Pacifica, CA', 'Residential', 800.00, 450.00, 12, 200000, 2014, 'Oceanview Living LLC', 'mgmt@oceanview.com', 'active'),
    ('Innovation Square', '600 Startup Blvd, San Francisco, CA', 'Co-working', 1600.00, 900.00, 8, 250000, 2021, 'WeWork Alternatives Inc', 'ops@innovationsq.com', 'active'),
    ('Riverside Manufacturing', '4200 River Rd, Sacramento, CA', 'Manufacturing', 6000.00, 3500.00, 4, 850000, 1990, 'Riverside Industries', 'plant@riverside.com', 'active')
  `);
  console.log('✅ Buildings seeded');

  // Seed energy audits (15 items)
  await pool.query(`
    INSERT INTO energy_audits (building_name, auditor, audit_date, energy_rating, total_consumption_kwh, waste_percentage, recommendations, status) VALUES
    ('Meridian Tower', 'GreenAudit Corp', '2024-01-15', 'B+', 4500000, 12.5, 'Upgrade HVAC controls, install LED lighting on floors 20-45', 'completed'),
    ('Pacific Commerce Center', 'EcoCheck Services', '2024-02-20', 'B', 6200000, 18.3, 'Replace aging chillers, implement smart building controls', 'completed'),
    ('Harbor Point Mall', 'GreenAudit Corp', '2024-03-10', 'C+', 3800000, 28.7, 'Retrofit lighting, upgrade refrigeration systems, add solar panels', 'completed'),
    ('TechHub Campus', 'SustainAudit LLC', '2024-01-25', 'A-', 8900000, 8.2, 'Optimize server cooling, implement AI-driven HVAC', 'completed'),
    ('Central Medical Plaza', 'HealthFacility Auditors', '2024-04-05', 'B-', 7200000, 15.6, 'Upgrade medical equipment power management, improve insulation', 'completed'),
    ('Sunset Industrial Park', 'IndustrialEnergy Co', '2024-02-28', 'C', 9500000, 35.2, 'Replace motors with VFDs, fix compressed air leaks, add insulation', 'in_progress'),
    ('Bayside Hotel & Conference', 'EcoCheck Services', '2024-05-12', 'B', 4100000, 19.8, 'Smart room controls, heat recovery from laundry, pool covers', 'completed'),
    ('University Research Center', 'SustainAudit LLC', '2024-03-18', 'A', 5600000, 6.5, 'Lab equipment scheduling, fume hood optimization', 'completed'),
    ('Metro Transit Hub', 'GreenAudit Corp', '2024-06-01', 'B+', 2800000, 11.3, 'Regenerative braking energy capture, platform lighting optimization', 'pending'),
    ('Greenfield Data Center', 'DataCenterAudit Specialists', '2024-04-22', 'A-', 15000000, 9.1, 'Hot/cold aisle containment, free cooling expansion', 'completed'),
    ('Heritage Office Park', 'EcoCheck Services', '2024-05-30', 'D+', 2400000, 42.1, 'Full HVAC replacement, window upgrades, roof insulation', 'in_progress'),
    ('Valley Logistics Center', 'IndustrialEnergy Co', '2024-06-15', 'C-', 4200000, 38.5, 'Dock door seals, warehouse lighting, forklift charging optimization', 'pending'),
    ('Civic Center Complex', 'GreenAudit Corp', '2024-07-01', 'B-', 3600000, 16.8, 'BMS upgrade, solar installation, EV charging infrastructure', 'pending'),
    ('Oceanview Apartments', 'ResidentialEnergy Pros', '2024-07-15', 'B', 1500000, 14.2, 'Common area LED upgrade, smart thermostats, EV ready parking', 'completed'),
    ('Innovation Square', 'SustainAudit LLC', '2024-08-01', 'A-', 2900000, 7.8, 'Fine-tune existing smart systems, add occupancy sensors', 'completed')
  `);
  console.log('✅ Energy audits seeded');

  // Seed capacity detections (15 items)
  await pool.query(`
    INSERT INTO capacity_detections (building_name, location, capacity_type, total_capacity_kw, used_capacity_kw, available_capacity_kw, detection_method, confidence_score, status) VALUES
    ('Meridian Tower', 'San Francisco Financial District', 'HVAC Overcapacity', 2500, 1800, 700, 'Smart Meter Analysis', 94.5, 'verified'),
    ('Harbor Point Mall', 'San Francisco Embarcadero', 'Lighting Surplus', 1800, 950, 850, 'IoT Sensor Network', 91.2, 'verified'),
    ('Sunset Industrial Park', 'Richmond Industrial Zone', 'Motor Load Gap', 5200, 2800, 2400, 'Power Quality Monitor', 88.7, 'verified'),
    ('Valley Logistics Center', 'Fremont Distribution', 'Warehouse Idle Capacity', 3000, 1200, 1800, 'Load Profile Analysis', 92.3, 'verified'),
    ('Heritage Office Park', 'Palo Alto Business District', 'HVAC Off-Peak Surplus', 1200, 650, 550, 'BMS Data Mining', 87.6, 'detected'),
    ('Bayside Hotel & Conference', 'SF Waterfront', 'Conference Room Idle', 2200, 1600, 600, 'Occupancy Tracking', 85.4, 'detected'),
    ('Pacific Commerce Center', 'SF Market Street', 'Tenant Vacancy Gap', 3200, 2100, 1100, 'Utility Bill Analysis', 96.1, 'verified'),
    ('Innovation Square', 'SF SoMa District', 'Co-working Off-Hours', 1600, 900, 700, 'Smart Plug Monitoring', 89.8, 'verified'),
    ('TechHub Campus', 'San Jose Innovation', 'Server Decommission Gap', 4500, 3200, 1300, 'DCIM Platform', 93.4, 'detected'),
    ('Oceanview Apartments', 'Pacifica Coastal', 'Common Area Surplus', 800, 450, 350, 'Sub-metering', 90.1, 'verified'),
    ('Civic Center Complex', 'San Jose Downtown', 'Weekend Idle Capacity', 2000, 1500, 500, 'Schedule Analysis', 95.0, 'verified'),
    ('University Research Center', 'Berkeley Campus', 'Lab Off-Season Gap', 2800, 1900, 900, 'Research Calendar Correlation', 86.3, 'detected'),
    ('Greenfield Data Center', 'Santa Clara Tech Park', 'Cooling Overcapacity', 8500, 6200, 2300, 'Thermal Imaging + AI', 97.2, 'verified'),
    ('Metro Transit Hub', 'SF Transit Plaza', 'Off-Peak Transit Gap', 1500, 1100, 400, 'Ridership Data Correlation', 88.9, 'detected'),
    ('Riverside Manufacturing', 'Sacramento River District', 'Shift Gap Capacity', 6000, 3500, 2500, 'Production Schedule Analysis', 91.7, 'verified'),
    ('Meridian Tower', 'San Francisco Financial District', 'Weekend Demand Drop', 2500, 400, 2100, 'Weekend Load Profiling', 98.1, 'verified')
  `);
  console.log('✅ Capacity detections seeded');

  // Seed community needs (15 items)
  await pool.query(`
    INSERT INTO community_needs (community_name, location, population, median_income, energy_burden_pct, current_provider, needs_description, priority, status) VALUES
    ('Bayview-Hunters Point', 'SE San Francisco, CA', 38000, 42000, 12.8, 'PG&E', 'Historic environmental justice community with aging infrastructure and high energy costs', 5, 'critical'),
    ('East Oakland', 'Oakland, CA', 65000, 35000, 15.2, 'PG&E', 'Low-income area with frequent power outages and limited access to clean energy programs', 5, 'critical'),
    ('Richmond Iron Triangle', 'Richmond, CA', 28000, 38000, 11.5, 'PG&E', 'Industrial proximity concerns, need for cleaner energy alternatives and job training', 4, 'assessed'),
    ('Tenderloin District', 'San Francisco, CA', 35000, 28000, 18.3, 'PG&E', 'Dense urban area with SROs and affordable housing needing energy efficiency upgrades', 5, 'in_progress'),
    ('East Palo Alto', 'East Palo Alto, CA', 30000, 55000, 9.8, 'PG&E', 'Community surrounded by wealth but lacking equitable energy infrastructure', 4, 'assessed'),
    ('Alviso Community', 'San Jose, CA', 12000, 45000, 10.2, 'PG&E', 'Flood-prone area needing resilient energy infrastructure and backup power', 3, 'assessed'),
    ('West Contra Costa', 'Contra Costa County, CA', 45000, 48000, 8.9, 'PG&E', 'Refinery-adjacent community seeking clean energy transition and health protection', 4, 'in_progress'),
    ('South Sacramento', 'Sacramento, CA', 82000, 32000, 16.5, 'SMUD', 'Large underserved area with extreme heat events requiring cooling solutions', 5, 'critical'),
    ('Salinas East Side', 'Salinas, CA', 55000, 38000, 13.1, 'PG&E', 'Agricultural worker community with substandard housing and high energy costs', 4, 'assessed'),
    ('Stockton South', 'Stockton, CA', 48000, 34000, 14.7, 'PG&E', 'Post-bankruptcy recovery area needing affordable energy and economic development', 5, 'in_progress'),
    ('Vallejo Mare Island', 'Vallejo, CA', 22000, 52000, 8.5, 'PG&E', 'Former military base area transitioning to sustainable community energy', 3, 'assessed'),
    ('Fresno Southwest', 'Fresno, CA', 72000, 29000, 19.2, 'PG&E', 'Extreme heat exposure with limited AC access, highest energy burden in region', 5, 'critical'),
    ('San Pablo', 'San Pablo, CA', 32000, 41000, 10.8, 'PG&E', 'Small city with aging grid infrastructure and need for distributed energy resources', 3, 'assessed'),
    ('Chinatown SF', 'San Francisco, CA', 28000, 32000, 11.9, 'PG&E', 'Dense historic neighborhood with older buildings needing energy modernization', 4, 'in_progress'),
    ('Pittsburg/Antioch', 'Eastern Contra Costa, CA', 85000, 56000, 7.8, 'PG&E', 'Growing community with increasing energy needs and transmission constraints', 3, 'assessed')
  `);
  console.log('✅ Community needs seeded');

  // Seed aggregation plans (15 items)
  await pool.query(`
    INSERT INTO aggregation_plans (plan_name, region, buildings_count, total_aggregated_kw, target_community, estimated_savings, start_date, end_date, status) VALUES
    ('SF Financial District Aggregation', 'San Francisco', 12, 4500, 'Bayview-Hunters Point', 850000, '2024-07-01', '2025-06-30', 'active'),
    ('East Bay Industrial Pool', 'East Bay', 8, 6200, 'East Oakland', 1200000, '2024-08-01', '2025-07-31', 'active'),
    ('South Bay Tech Surplus', 'South Bay', 15, 8900, 'East Palo Alto', 1650000, '2024-09-01', '2025-08-31', 'approved'),
    ('Peninsula Office Network', 'Peninsula', 20, 3800, 'Tenderloin District', 720000, '2024-10-01', '2025-09-30', 'draft'),
    ('Sacramento Valley Plan', 'Sacramento', 10, 5500, 'South Sacramento', 980000, '2024-06-01', '2025-05-31', 'active'),
    ('Richmond Industrial Redirect', 'North Bay', 6, 3200, 'Richmond Iron Triangle', 580000, '2024-11-01', '2025-10-31', 'approved'),
    ('Data Center Excess Program', 'Santa Clara', 4, 7800, 'Alviso Community', 1450000, '2024-07-15', '2025-07-14', 'active'),
    ('Retail After-Hours Pool', 'San Francisco', 18, 2900, 'Chinatown SF', 520000, '2024-12-01', '2025-11-30', 'draft'),
    ('Central Valley Capacity Share', 'Central Valley', 14, 4100, 'Fresno Southwest', 760000, '2025-01-01', '2025-12-31', 'proposed'),
    ('East Bay Residential Micro-Grid', 'East Bay', 25, 1800, 'San Pablo', 340000, '2025-02-01', '2026-01-31', 'proposed'),
    ('SF Waterfront Aggregation', 'San Francisco', 9, 3500, 'Tenderloin District', 640000, '2024-08-15', '2025-08-14', 'active'),
    ('Fremont Warehouse Network', 'South Bay', 7, 5100, 'East Palo Alto', 930000, '2024-09-15', '2025-09-14', 'approved'),
    ('Government Building Pool', 'Bay Area Wide', 22, 6800, 'Multiple Communities', 1280000, '2025-01-15', '2026-01-14', 'draft'),
    ('Hotel Weekend Surplus', 'San Francisco', 11, 2400, 'Bayview-Hunters Point', 430000, '2024-10-15', '2025-10-14', 'active'),
    ('Campus Research Off-Season', 'East Bay', 5, 3100, 'West Contra Costa', 570000, '2024-06-15', '2025-06-14', 'active')
  `);
  console.log('✅ Aggregation plans seeded');

  // Seed grid stability (15 items)
  await pool.query(`
    INSERT INTO grid_stability (region, frequency_hz, voltage_kv, load_mw, generation_mw, renewable_pct, stability_index, risk_level, status) VALUES
    ('SF North Grid', 60.002, 230.5, 1450, 1520, 35.2, 92.5, 'low', 'normal'),
    ('SF South Grid', 59.998, 229.8, 1680, 1700, 28.7, 88.3, 'low', 'normal'),
    ('East Bay Grid', 60.001, 231.2, 2200, 2150, 42.1, 78.6, 'medium', 'caution'),
    ('South Bay Grid', 59.999, 230.0, 3100, 3250, 48.5, 94.1, 'low', 'normal'),
    ('Peninsula Grid', 60.003, 230.8, 1200, 1280, 31.4, 91.2, 'low', 'normal'),
    ('North Bay Grid', 59.997, 228.5, 890, 920, 55.3, 85.7, 'low', 'normal'),
    ('Sacramento Grid', 60.000, 231.0, 2800, 2650, 22.8, 72.4, 'medium', 'caution'),
    ('Central Valley Grid', 59.996, 227.2, 3500, 3200, 18.5, 65.8, 'high', 'warning'),
    ('Stockton Grid', 60.004, 229.5, 1100, 1050, 15.2, 68.3, 'medium', 'caution'),
    ('Fresno Grid', 59.995, 226.8, 2400, 2200, 25.6, 62.1, 'high', 'warning'),
    ('SF Downtown Grid', 60.001, 230.2, 1850, 1900, 20.3, 90.8, 'low', 'normal'),
    ('Oakland Central Grid', 59.999, 229.6, 1650, 1580, 33.9, 82.5, 'low', 'normal'),
    ('San Jose Grid', 60.002, 230.4, 2950, 3100, 45.7, 93.2, 'low', 'normal'),
    ('Contra Costa Grid', 59.998, 228.9, 1350, 1300, 38.4, 80.1, 'medium', 'caution'),
    ('Marin Grid', 60.001, 231.5, 620, 680, 62.8, 96.4, 'low', 'normal')
  `);
  console.log('✅ Grid stability seeded');

  // Seed equity scores (15 items)
  await pool.query(`
    INSERT INTO equity_scores (community_name, region, score, energy_access_score, affordability_score, reliability_score, environmental_score, health_impact_score, assessment_date, status) VALUES
    ('Bayview-Hunters Point', 'San Francisco', 32.4, 35, 25, 40, 28, 34, '2024-06-01', 'active'),
    ('East Oakland', 'East Bay', 28.6, 30, 22, 35, 25, 31, '2024-06-15', 'active'),
    ('Tenderloin District', 'San Francisco', 35.2, 38, 28, 42, 32, 36, '2024-07-01', 'active'),
    ('Richmond Iron Triangle', 'North Bay', 38.8, 42, 35, 38, 30, 49, '2024-07-15', 'active'),
    ('East Palo Alto', 'Peninsula', 45.3, 48, 40, 50, 42, 46, '2024-06-20', 'active'),
    ('South Sacramento', 'Sacramento', 30.1, 32, 24, 36, 28, 31, '2024-08-01', 'active'),
    ('Fresno Southwest', 'Central Valley', 24.5, 22, 18, 30, 20, 33, '2024-08-15', 'active'),
    ('Stockton South', 'Central Valley', 33.7, 36, 28, 38, 32, 34, '2024-07-20', 'active'),
    ('Chinatown SF', 'San Francisco', 41.2, 45, 35, 48, 38, 40, '2024-09-01', 'active'),
    ('San Pablo', 'East Bay', 48.9, 52, 45, 50, 44, 54, '2024-09-15', 'active'),
    ('West Contra Costa', 'East Bay', 42.6, 44, 38, 46, 36, 49, '2024-08-20', 'active'),
    ('Alviso Community', 'South Bay', 50.3, 55, 48, 52, 45, 52, '2024-10-01', 'active'),
    ('Salinas East Side', 'Central Coast', 36.4, 38, 30, 40, 34, 40, '2024-10-15', 'active'),
    ('Pittsburg/Antioch', 'East Bay', 52.8, 58, 50, 55, 48, 53, '2024-11-01', 'active'),
    ('Vallejo Mare Island', 'North Bay', 55.1, 60, 52, 58, 50, 56, '2024-11-15', 'active')
  `);
  console.log('✅ Equity scores seeded');

  // Seed redistribution plans (15 items)
  await pool.query(`
    INSERT INTO redistribution_plans (plan_name, source_buildings, target_community, capacity_kw, estimated_beneficiaries, cost_estimate, timeline_months, priority, status) VALUES
    ('Bayview Solar Bridge', 'Meridian Tower, Pacific Commerce', 'Bayview-Hunters Point', 1200, 3500, 2800000, 18, 5, 'approved'),
    ('Oakland Energy Lifeline', 'Sunset Industrial, Valley Logistics', 'East Oakland', 2800, 8200, 5200000, 24, 5, 'in_progress'),
    ('Tenderloin Efficiency Plus', 'Innovation Square, Heritage Park', 'Tenderloin District', 800, 4100, 1500000, 12, 4, 'proposed'),
    ('Richmond Clean Power', 'Sunset Industrial Park', 'Richmond Iron Triangle', 1500, 2800, 3100000, 18, 4, 'approved'),
    ('EPA Energy Equity', 'TechHub Campus, Greenfield DC', 'East Palo Alto', 2200, 5500, 4200000, 24, 4, 'proposed'),
    ('Sacramento Cool Homes', 'Riverside Manufacturing', 'South Sacramento', 1800, 9500, 3800000, 20, 5, 'in_progress'),
    ('Fresno Heat Relief', 'Central Valley facilities', 'Fresno Southwest', 2500, 12000, 4800000, 24, 5, 'proposed'),
    ('Chinatown Green Grid', 'Bayside Hotel, Pacific Commerce', 'Chinatown SF', 600, 2200, 1200000, 10, 3, 'approved'),
    ('Stockton Recovery Power', 'Valley Logistics Center', 'Stockton South', 1400, 5800, 2600000, 16, 4, 'proposed'),
    ('San Pablo Microgrid', 'Heritage Office Park', 'San Pablo', 550, 1800, 980000, 8, 3, 'in_progress'),
    ('Alviso Resilience Project', 'TechHub Campus', 'Alviso Community', 900, 1500, 1800000, 14, 3, 'approved'),
    ('Salinas Farmworker Energy', 'Multiple commercial', 'Salinas East Side', 1100, 4200, 2100000, 18, 4, 'proposed'),
    ('Contra Costa Transition', 'Multiple industrial', 'West Contra Costa', 1600, 3800, 3200000, 20, 4, 'approved'),
    ('Vallejo Naval Renewal', 'Multiple office', 'Vallejo Mare Island', 700, 2000, 1400000, 12, 3, 'proposed'),
    ('Pittsburg Growth Grid', 'Multiple sources', 'Pittsburg/Antioch', 1300, 6500, 2400000, 16, 3, 'proposed')
  `);
  console.log('✅ Redistribution plans seeded');

  // Seed demand response (15 items)
  await pool.query(`
    INSERT INTO demand_response (program_name, program_type, region, enrolled_buildings, capacity_committed_kw, incentive_rate, season, peak_hours, status) VALUES
    ('SF Peak Shaver', 'Curtailment', 'San Francisco', 45, 8500, 0.35, 'Summer', '2PM-6PM', 'active'),
    ('Bay Area Load Shift', 'Load Shifting', 'Bay Area', 120, 22000, 0.28, 'Year-round', '1PM-7PM', 'active'),
    ('East Bay Emergency DR', 'Emergency', 'East Bay', 35, 6800, 0.55, 'Summer', '12PM-8PM', 'active'),
    ('South Bay Smart Response', 'Automated', 'South Bay', 68, 15200, 0.32, 'Summer', '3PM-7PM', 'active'),
    ('Peninsula Flex Load', 'Flexible', 'Peninsula', 28, 4500, 0.25, 'Year-round', '2PM-6PM', 'active'),
    ('Sacramento Heat Response', 'Emergency', 'Sacramento', 55, 12000, 0.48, 'Summer', '11AM-7PM', 'active'),
    ('Central Valley Agricultural DR', 'Curtailment', 'Central Valley', 40, 18000, 0.30, 'Summer', '1PM-5PM', 'active'),
    ('SF Commercial Thermostat', 'Automated', 'San Francisco', 85, 5200, 0.22, 'Summer', '2PM-6PM', 'enrolling'),
    ('EV Charging Management', 'Load Shifting', 'Bay Area', 150, 9800, 0.18, 'Year-round', '10AM-4PM', 'active'),
    ('Industrial Night Shift', 'Load Shifting', 'East Bay', 15, 25000, 0.15, 'Year-round', '6PM-6AM', 'active'),
    ('Hospital Backup Generation', 'Emergency', 'Bay Area', 22, 8800, 0.60, 'Year-round', 'On-demand', 'standby'),
    ('Retail Lighting Dim', 'Curtailment', 'San Francisco', 60, 3200, 0.20, 'Summer', '3PM-6PM', 'enrolling'),
    ('Campus Summer Reduction', 'Curtailment', 'East Bay', 8, 4500, 0.35, 'Summer', '12PM-6PM', 'active'),
    ('Data Center UPS Bridge', 'Emergency', 'South Bay', 6, 15000, 0.70, 'Year-round', 'On-demand', 'standby'),
    ('Community Battery Program', 'Storage', 'Bay Area', 200, 6000, 0.40, 'Year-round', '4PM-9PM', 'pilot')
  `);
  console.log('✅ Demand response seeded');

  // Seed capacity forecasts (15 items)
  await pool.query(`
    INSERT INTO capacity_forecasts (region, forecast_date, predicted_demand_mw, predicted_supply_mw, predicted_surplus_mw, confidence_pct, weather_factor, season, model_version, status) VALUES
    ('San Francisco', '2024-12-01', 3200, 3450, 250, 89.5, 'Mild - Marine Layer', 'Winter', 'v3.2.1', 'validated'),
    ('East Bay', '2024-12-01', 4100, 4050, -50, 85.2, 'Cool - Rainy', 'Winter', 'v3.2.1', 'validated'),
    ('South Bay', '2024-12-01', 5800, 6200, 400, 91.3, 'Mild - Clear', 'Winter', 'v3.2.1', 'validated'),
    ('Sacramento', '2024-12-01', 3500, 3200, -300, 82.7, 'Fog - Cold Nights', 'Winter', 'v3.2.1', 'validated'),
    ('Central Valley', '2024-12-01', 4200, 3800, -400, 78.4, 'Cold - Tule Fog', 'Winter', 'v3.2.1', 'warning'),
    ('San Francisco', '2025-06-01', 3800, 3600, -200, 87.1, 'Warm - Heat Event', 'Summer', 'v3.2.1', 'pending'),
    ('East Bay', '2025-06-01', 5200, 4800, -400, 83.5, 'Hot - Diablo Winds', 'Summer', 'v3.2.1', 'warning'),
    ('South Bay', '2025-06-01', 7200, 7500, 300, 90.8, 'Warm - Clear', 'Summer', 'v3.2.1', 'pending'),
    ('Sacramento', '2025-06-01', 5500, 4800, -700, 79.2, 'Extreme Heat', 'Summer', 'v3.2.1', 'critical'),
    ('Central Valley', '2025-06-01', 6800, 5900, -900, 75.6, 'Extreme Heat', 'Summer', 'v3.2.1', 'critical'),
    ('Peninsula', '2025-03-01', 2100, 2300, 200, 92.4, 'Mild - Spring', 'Spring', 'v3.2.1', 'validated'),
    ('North Bay', '2025-03-01', 1500, 1650, 150, 93.1, 'Mild - Breezy', 'Spring', 'v3.2.1', 'validated'),
    ('San Francisco', '2025-09-01', 3500, 3400, -100, 86.8, 'Warm - Indian Summer', 'Fall', 'v3.2.1', 'pending'),
    ('Bay Area Wide', '2025-06-15', 18000, 17200, -800, 81.3, 'Regional Heat Wave', 'Summer', 'v3.2.1', 'warning'),
    ('Bay Area Wide', '2026-01-01', 15500, 16800, 1300, 88.9, 'Normal Winter', 'Winter', 'v3.3.0', 'pending')
  `);
  console.log('✅ Capacity forecasts seeded');

  // Seed impact reports (15 items)
  await pool.query(`
    INSERT INTO impact_reports (report_title, community_name, report_date, households_served, energy_saved_kwh, cost_savings, carbon_reduction_tons, jobs_created, satisfaction_score, status) VALUES
    ('Q3 2024 Bayview Impact', 'Bayview-Hunters Point', '2024-10-01', 1200, 850000, 127500, 425, 15, 8.2, 'published'),
    ('East Oakland Energy Access', 'East Oakland', '2024-10-15', 2800, 1950000, 292500, 975, 28, 7.8, 'published'),
    ('Tenderloin Efficiency Results', 'Tenderloin District', '2024-11-01', 1500, 620000, 93000, 310, 8, 8.5, 'published'),
    ('Richmond Clean Transition Q3', 'Richmond Iron Triangle', '2024-09-30', 980, 720000, 108000, 360, 12, 7.9, 'published'),
    ('EPA Solar Equity Report', 'East Palo Alto', '2024-11-15', 1800, 1200000, 180000, 600, 22, 8.8, 'published'),
    ('Sacramento Cooling Impact', 'South Sacramento', '2024-09-15', 3500, 2800000, 420000, 1400, 35, 9.1, 'published'),
    ('Fresno Heat Relief Annual', 'Fresno Southwest', '2024-12-01', 4200, 3500000, 525000, 1750, 42, 8.7, 'draft'),
    ('Chinatown Green Grid Q4', 'Chinatown SF', '2024-12-15', 800, 380000, 57000, 190, 6, 8.3, 'draft'),
    ('San Pablo Microgrid Pilot', 'San Pablo', '2024-11-30', 650, 290000, 43500, 145, 5, 7.6, 'published'),
    ('Stockton Recovery Update', 'Stockton South', '2024-10-30', 2100, 1450000, 217500, 725, 18, 7.4, 'published'),
    ('Alviso Resilience Report', 'Alviso Community', '2024-12-01', 520, 240000, 36000, 120, 4, 8.0, 'draft'),
    ('Salinas Worker Energy Access', 'Salinas East Side', '2024-11-15', 1600, 880000, 132000, 440, 14, 7.7, 'published'),
    ('Contra Costa Annual Report', 'West Contra Costa', '2024-12-31', 1350, 980000, 147000, 490, 16, 8.1, 'draft'),
    ('Vallejo Pilot Results', 'Vallejo Mare Island', '2024-12-15', 700, 350000, 52500, 175, 7, 7.5, 'published'),
    ('Bay Area Annual Summary', 'Multiple Communities', '2024-12-31', 22000, 14500000, 2175000, 7250, 232, 8.2, 'draft')
  `);
  console.log('✅ Impact reports seeded');

  // Seed energy savings (15 items)
  await pool.query(`
    INSERT INTO energy_savings (building_name, period, baseline_kwh, actual_kwh, saved_kwh, savings_pct, cost_saved, method, verified, status) VALUES
    ('Meridian Tower', 'Q3 2024', 1125000, 945000, 180000, 16.0, 27000, 'HVAC Optimization', true, 'verified'),
    ('Pacific Commerce Center', 'Q3 2024', 1550000, 1271000, 279000, 18.0, 41850, 'Smart Controls', true, 'verified'),
    ('Harbor Point Mall', 'Q3 2024', 950000, 712500, 237500, 25.0, 35625, 'LED Retrofit', true, 'verified'),
    ('TechHub Campus', 'Q3 2024', 2225000, 2047000, 178000, 8.0, 26700, 'Server Consolidation', true, 'verified'),
    ('Central Medical Plaza', 'Q3 2024', 1800000, 1620000, 180000, 10.0, 27000, 'Equipment Scheduling', false, 'recorded'),
    ('Sunset Industrial Park', 'Q3 2024', 2375000, 1662500, 712500, 30.0, 106875, 'VFD Installation', true, 'verified'),
    ('Bayside Hotel', 'Q3 2024', 1025000, 861000, 164000, 16.0, 24600, 'Heat Recovery', true, 'verified'),
    ('University Research Center', 'Q3 2024', 1400000, 1316000, 84000, 6.0, 12600, 'Lab Scheduling', false, 'recorded'),
    ('Metro Transit Hub', 'Q3 2024', 700000, 623000, 77000, 11.0, 11550, 'Regen Braking', false, 'pending'),
    ('Greenfield Data Center', 'Q3 2024', 3750000, 3412500, 337500, 9.0, 50625, 'Free Cooling', true, 'verified'),
    ('Heritage Office Park', 'Q3 2024', 600000, 378000, 222000, 37.0, 33300, 'Full Retrofit', true, 'verified'),
    ('Valley Logistics Center', 'Q3 2024', 1050000, 682500, 367500, 35.0, 55125, 'Warehouse Optimization', true, 'verified'),
    ('Civic Center Complex', 'Q3 2024', 900000, 774000, 126000, 14.0, 18900, 'BMS Upgrade', false, 'recorded'),
    ('Oceanview Apartments', 'Q3 2024', 375000, 330000, 45000, 12.0, 6750, 'Smart Thermostats', true, 'verified'),
    ('Innovation Square', 'Q3 2024', 725000, 667000, 58000, 8.0, 8700, 'Occupancy Sensors', true, 'verified')
  `);
  console.log('✅ Energy savings seeded');

  // Seed alerts (15 items)
  await pool.query(`
    INSERT INTO alerts (title, alert_type, severity, source, description, region, acknowledged, status) VALUES
    ('High Load Warning - East Bay', 'Grid Overload', 'high', 'Grid Monitor', 'East Bay grid approaching 95% capacity during afternoon peak', 'East Bay', true, 'active'),
    ('Frequency Deviation - Central Valley', 'Frequency', 'critical', 'SCADA System', 'Grid frequency dropped below 59.95 Hz, emergency protocols engaged', 'Central Valley', true, 'active'),
    ('Voltage Sag - Fresno Grid', 'Voltage', 'high', 'Power Quality Monitor', 'Sustained voltage sag of 3.5% detected on Fresno distribution network', 'Central Valley', false, 'active'),
    ('Renewable Curtailment - South Bay', 'Curtailment', 'medium', 'Solar Monitor', 'Solar generation exceeding demand, 15MW being curtailed', 'South Bay', true, 'resolved'),
    ('Building Offline - Heritage Park', 'Equipment', 'low', 'BMS Alert', 'Heritage Office Park main transformer offline for maintenance', 'Peninsula', true, 'resolved'),
    ('Demand Spike - Sacramento', 'Demand', 'critical', 'Load Forecaster', 'Extreme heat event causing unprecedented demand spike, rolling alerts issued', 'Sacramento', true, 'active'),
    ('Capacity Detection Anomaly', 'Data Quality', 'medium', 'AI Detection Engine', 'Unusual capacity readings from Sunset Industrial Park sensors', 'East Bay', false, 'active'),
    ('Community Outage - East Oakland', 'Outage', 'critical', 'Distribution SCADA', 'Power outage affecting 2,400 homes in underserved East Oakland area', 'East Bay', true, 'active'),
    ('Smart Meter Communication Loss', 'Communication', 'medium', 'AMI System', 'Lost communication with 340 smart meters in SF South Grid', 'San Francisco', true, 'resolved'),
    ('Battery Storage Low - Bayview', 'Storage', 'high', 'Battery BMS', 'Community battery at Bayview-HP below 15% SOC during peak', 'San Francisco', false, 'active'),
    ('Transformer Overheating', 'Equipment', 'high', 'Thermal Monitor', 'Distribution transformer T-4521 exceeding temperature threshold', 'East Bay', true, 'active'),
    ('DR Event Triggered', 'Demand Response', 'medium', 'DR Platform', 'Emergency demand response event triggered for SF region', 'San Francisco', true, 'resolved'),
    ('Cyber Security Alert', 'Security', 'critical', 'SIEM System', 'Unusual access pattern detected on grid control network', 'Bay Area', true, 'resolved'),
    ('Weather Alert - Heat Wave', 'Weather', 'high', 'NWS Integration', 'Excessive heat warning for Central Valley, grid stress expected', 'Central Valley', true, 'active'),
    ('Compliance Deadline Approaching', 'Compliance', 'medium', 'Regulatory Calendar', 'CPUC equity reporting deadline in 7 days', 'Bay Area', false, 'active')
  `);
  console.log('✅ Alerts seeded');

  // Seed compliance reports (15 items)
  await pool.query(`
    INSERT INTO compliance_reports (report_name, regulation, jurisdiction, due_date, submitted_date, compliance_score, findings, corrective_actions, auditor, status) VALUES
    ('CPUC Equity Compliance Q4', 'CPUC D.18-06-027', 'California', '2024-12-31', '2024-12-15', 88.5, 'Minor gaps in low-income program outreach documentation', 'Enhance outreach tracking system, add bilingual documentation', 'CPUC Staff', 'submitted'),
    ('NERC CIP-013 Supply Chain', 'NERC CIP-013-2', 'Federal', '2025-01-15', NULL, 92.0, 'Pending review of vendor risk assessments', 'Update vendor screening procedures', 'ReliabilityFirst', 'pending'),
    ('EPA Clean Air Compliance', 'Clean Air Act Section 111', 'Federal', '2025-02-28', NULL, 85.3, 'Emissions reporting for backup generators needs update', 'Install continuous emissions monitors on 3 backup generators', 'EPA Region 9', 'in_progress'),
    ('CARB Cap-and-Trade Report', 'AB 32 / SB 32', 'California', '2024-11-30', '2024-11-25', 96.2, 'All emissions allowances properly reported', 'None required', 'CARB Auditor', 'approved'),
    ('SB 100 Clean Energy Progress', 'SB 100', 'California', '2025-03-31', NULL, 78.5, 'Renewable portfolio at 52%, target is 60% by 2030', 'Accelerate PPA negotiations for 200MW solar', 'CEC Staff', 'in_progress'),
    ('DOE Grid Security Report', 'DOE Order 417.1B', 'Federal', '2025-01-31', NULL, 90.1, 'Physical security assessments current, cyber assessment pending', 'Complete NIST CSF assessment for all control centers', 'DOE Inspector', 'pending'),
    ('CPUC Safety Culture Assessment', 'CPUC GO 167', 'California', '2024-10-31', '2024-10-28', 91.8, 'Strong safety culture, minor training gap for contractors', 'Implement contractor safety training program', 'Safety Division', 'approved'),
    ('Environmental Justice Report', 'SB 1000', 'California', '2025-04-30', NULL, 82.0, 'Community engagement in 3 of 5 EJ communities meets standards', 'Expand engagement in Fresno SW and Stockton South', 'CEC EJ Office', 'in_progress'),
    ('Interconnection Standards', 'FERC Order 2222', 'Federal', '2025-02-15', NULL, 75.8, 'DER aggregation protocols need updating for new FERC rules', 'Redesign aggregation participation model', 'FERC Staff', 'pending'),
    ('Wildfire Mitigation Plan', 'SB 901 / AB 1054', 'California', '2024-09-30', '2024-09-28', 94.5, 'All PSPS protocols updated, vegetation management on schedule', 'Expand weather station network by 12 units', 'CPUC WSD', 'approved'),
    ('Customer Data Privacy', 'CPUC D.14-05-016', 'California', '2025-03-15', NULL, 87.3, 'Data sharing agreements need updating for new AI analytics', 'Update privacy impact assessments for AI tools', 'CPUC Privacy', 'in_progress'),
    ('Demand Response Verification', 'CPUC D.16-09-056', 'California', '2024-12-15', '2024-12-10', 93.7, 'DR measurement and verification protocols validated', 'Minor calibration needed for 5 measurement points', 'CPUC Energy', 'submitted'),
    ('Low-Income Program Audit', 'CPUC CARE/FERA', 'California', '2025-05-31', NULL, 80.2, 'Enrollment rates below target in 4 communities', 'Partner with CBOs for door-to-door enrollment drives', 'CPUC Social', 'pending'),
    ('Grid Reliability Standards', 'NERC TPL-001-5.1', 'Federal', '2025-06-30', NULL, 88.9, 'Planning studies current, thermal limits need reassessment', 'Conduct updated thermal analysis for 5 key corridors', 'WECC', 'pending'),
    ('Renewable Integration Study', 'CPUC RA Program', 'California', '2025-01-31', NULL, 84.6, 'Resource adequacy showing shortfall in August peak', 'Procure additional 150MW of capacity for summer peak', 'CPUC RA Team', 'in_progress')
  `);
  console.log('✅ Compliance reports seeded');

  // Seed partners (15 items)
  await pool.query(`
    INSERT INTO partners (partner_name, partner_type, contact_person, contact_email, phone, region, services_offered, buildings_managed, partnership_since, status) VALUES
    ('GreenTech Solutions', 'Technology', 'Jennifer Wu', 'jwu@greentech.com', '415-555-0101', 'Bay Area', 'IoT sensors, smart building controls, energy analytics', 45, '2020-03-15', 'active'),
    ('Pacific Energy Auditors', 'Consulting', 'Robert Martinez', 'rmartinez@pacificaudit.com', '510-555-0202', 'Bay Area', 'Energy audits, ASHRAE assessments, retro-commissioning', 0, '2019-06-01', 'active'),
    ('Community Power Coalition', 'Non-Profit', 'Aisha Jackson', 'ajackson@communitypower.org', '415-555-0303', 'San Francisco', 'Community engagement, energy education, equity advocacy', 0, '2021-01-10', 'active'),
    ('SolarMax Installations', 'Contractor', 'David Chen', 'dchen@solarmax.com', '408-555-0404', 'South Bay', 'Solar installation, battery storage, EV charging', 28, '2020-09-20', 'active'),
    ('GridSafe Analytics', 'Technology', 'Maria Gonzalez', 'mgonzalez@gridsafe.com', '650-555-0505', 'Peninsula', 'Grid monitoring, predictive analytics, cyber security', 0, '2022-02-14', 'active'),
    ('Bay Area Weatherization', 'Contractor', 'James Thompson', 'jthompson@bayweather.com', '510-555-0606', 'East Bay', 'Insulation, window upgrades, air sealing, HVAC', 65, '2018-11-05', 'active'),
    ('CleanEnergy Finance Corp', 'Financial', 'Sarah Kim', 'skim@cleanfinance.com', '415-555-0707', 'Bay Area', 'Green bonds, PACE financing, energy project loans', 0, '2021-07-22', 'active'),
    ('EV Fleet Solutions', 'Technology', 'Tom Anderson', 'tanderson@evfleet.com', '408-555-0808', 'South Bay', 'EV fleet management, charging infrastructure, V2G', 12, '2023-01-15', 'active'),
    ('Urban Microgrids Inc', 'Technology', 'Lisa Park', 'lpark@urbanmicro.com', '415-555-0909', 'San Francisco', 'Microgrid design, battery storage, islanding systems', 8, '2022-06-30', 'active'),
    ('Valley Agricultural Energy', 'Utility', 'Carlos Reyes', 'creyes@valleyag.com', '559-555-1010', 'Central Valley', 'Agricultural energy programs, irrigation efficiency', 120, '2019-04-18', 'active'),
    ('SmartMeter Technologies', 'Technology', 'Kevin O''Brien', 'kobrien@smartmeter.com', '650-555-1111', 'Bay Area', 'AMI deployment, data analytics, meter maintenance', 0, '2020-08-12', 'active'),
    ('Equity Energy Alliance', 'Non-Profit', 'Diana Flores', 'dflores@equityenergy.org', '510-555-1212', 'East Bay', 'Environmental justice, community solar, workforce development', 0, '2021-11-08', 'active'),
    ('Pacific Gas Engineering', 'Engineering', 'Michael Chang', 'mchang@pacificeng.com', '925-555-1313', 'East Bay', 'Grid engineering, substation design, power systems', 0, '2018-05-20', 'active'),
    ('BuildingIQ Systems', 'Technology', 'Rachel Green', 'rgreen@buildingiq.com', '408-555-1414', 'South Bay', 'AI building optimization, predictive maintenance, BMS', 35, '2022-09-01', 'active'),
    ('Sacramento Energy Coop', 'Cooperative', 'Anthony Davis', 'adavis@sacenergy.coop', '916-555-1515', 'Sacramento', 'Community choice aggregation, local generation, member services', 0, '2023-03-10', 'active')
  `);
  console.log('✅ Partners seeded');

  console.log('\n🎉 Database seeding complete! All 15 tables seeded with 15+ items each.');
  await pool.end();
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
