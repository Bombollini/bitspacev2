
-- Seed Data for User ea9f85b5-0c38-4c80-80bf-9db67b4ed46b
-- Insert 5 Projects
INSERT INTO projects (id, name, description, owner_id, status, created_at, updated_at) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bitspace Mobile App', 'Developing the cross-platform mobile application using React Native.', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'ACTIVE', NOW() - INTERVAL '30 days', NOW()),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Marketing Website Redesign', 'Overhaul of the main corporate website to improve conversion rates.', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'ACTIVE', NOW() - INTERVAL '25 days', NOW()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Q4 Financial Reports', 'Consolidating financial data and preparing reports for Q4 board meeting.', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'ACTIVE', NOW() - INTERVAL '15 days', NOW()),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Cloud Migration Initiative', 'Migrating legacy on-premise servers to AWS infrastructure.', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'ACTIVE', NOW() - INTERVAL '10 days', NOW()),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Internal HR Portal', 'Building a new portal for employee onboarding and leave management.', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'ACTIVE', NOW() - INTERVAL '5 days', NOW());

-- Insert Members (Self as owner)
INSERT INTO project_members (project_id, user_id, role, joined_at) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'OWNER', NOW() - INTERVAL '30 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'OWNER', NOW() - INTERVAL '25 days'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'OWNER', NOW() - INTERVAL '15 days'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'OWNER', NOW() - INTERVAL '10 days'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'OWNER', NOW() - INTERVAL '5 days');

-- Insert Tasks for Project 1 (Bitspace Mobile App)
INSERT INTO tasks (id, project_id, title, description, status, priority, due_date, assignee_id, created_at, updated_at) VALUES
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Setup React Native CLI', 'Initialize the project repo and setup environment.', 'DONE', 'HIGH', NOW() - INTERVAL '28 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '30 days', NOW() - INTERVAL '28 days'),
('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Design Login Screen', 'Create UI mockups for login and signup.', 'DONE', 'MEDIUM', NOW() - INTERVAL '25 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '29 days', NOW() - INTERVAL '25 days'),
('30eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Implement Auth Flow', 'Connect to backend API for authentication.', 'IN_PROGRESS', 'HIGH', NOW() + INTERVAL '2 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '20 days', NOW()),
('40eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Setup Push Notifications', 'Integrate Firebase Cloud Messaging.', 'TODO', 'LOW', NOW() + INTERVAL '10 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '5 days', NOW()),
('50eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fix Navigation Bug', 'Tab bar crash on Android.', 'BACKLOG', 'HIGH', NULL, NULL, NOW() - INTERVAL '2 days', NOW()),
('60eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Release Beta v0.1', 'Prepare build for TestFlight.', 'TODO', 'HIGH', NOW() - INTERVAL '2 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '15 days', NOW()); -- OVERDUE

-- Insert Tasks for Project 2 (Marketing Website Redesign)
INSERT INTO tasks (id, project_id, title, description, status, priority, due_date, assignee_id, created_at, updated_at) VALUES
('70eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'SEO Audit', 'Analyze current site performance.', 'DONE', 'MEDIUM', NOW() - INTERVAL '20 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days'),
('80eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Copywriting for Home Page', 'Draft new hero section text.', 'REVIEW', 'HIGH', NOW() + INTERVAL '1 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '10 days', NOW()),
('90eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Optimize Images', 'Compress all assets for faster load.', 'TODO', 'LOW', NOW() + INTERVAL '5 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '5 days', NOW()),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Purchase Stock Photos', 'Buy license for header image.', 'TODO', 'MEDIUM', NOW() - INTERVAL '5 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '10 days', NOW()); -- OVERDUE

-- Insert Tasks for Project 3 (Q4 Financial Reports)
INSERT INTO tasks (id, project_id, title, description, status, priority, due_date, assignee_id, created_at, updated_at) VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Gather Expense Reports', 'Collect receipts from all departments.', 'IN_PROGRESS', 'HIGH', NOW() + INTERVAL '3 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '15 days', NOW()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Reconcile Bank Statements', 'Match transactions with ledger.', 'TODO', 'HIGH', NOW() + INTERVAL '7 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '15 days', NOW());

-- Insert Tasks for Project 4 (Cloud Migration)
INSERT INTO tasks (id, project_id, title, description, status, priority, due_date, assignee_id, created_at, updated_at) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Set up VPC', 'Configure network security groups.', 'DONE', 'HIGH', NOW() - INTERVAL '8 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Migrate DB to RDS', 'Dump and restore Postgres database.', 'IN_PROGRESS', 'HIGH', NOW() + INTERVAL '2 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '5 days', NOW()),
('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Configure Auto-Scaling', 'Set up EC2 launch templates.', 'BACKLOG', 'MEDIUM', NULL, NULL, NOW() - INTERVAL '5 days', NOW());

-- Insert Tasks for Project 5 (Internal HR Portal)
INSERT INTO tasks (id, project_id, title, description, status, priority, due_date, assignee_id, created_at, updated_at) VALUES
('11eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Requirement Gathering', 'Meeting with HR head.', 'DONE', 'MEDIUM', NOW() - INTERVAL '4 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
('12eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Database Schema Design', 'Draft ERD diagram.', 'TODO', 'HIGH', NOW() + INTERVAL '5 days', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', NOW() - INTERVAL '2 days', NOW());

-- Generate Activities (Additional, Aligned with Tasks)

INSERT INTO activities (project_id, user_id, action_type, entity_type, entity_id, metadata, created_at) VALUES
-- Project 1: Bitspace Mobile App
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'TASK_CREATED', 'TASK', '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', '{"title":"Design Login Screen"}', NOW() - INTERVAL '29 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'TASK_UPDATED', 'TASK', '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', '{"title":"Design Login Screen","changes":"status"}', NOW() - INTERVAL '25 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'TASK_CREATED', 'TASK', '40eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', '{"title":"Setup Push Notifications"}', NOW() - INTERVAL '5 days'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'TASK_CREATED', 'TASK', '50eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', '{"title":"Fix Navigation Bug"}', NOW() - INTERVAL '2 days'),

-- Project 2: Marketing Website Redesign
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'TASK_CREATED', 'TASK', '70eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', '{"title":"SEO Audit"}', NOW() - INTERVAL '25 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'TASK_UPDATED', 'TASK', '70eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', '{"title":"SEO Audit","changes":"status"}', NOW() - INTERVAL '20 days'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'TASK_CREATED', 'TASK', '80eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', '{"title":"Copywriting for Home Page"}', NOW() - INTERVAL '10 days'),

-- Project 3: Q4 Financial Reports
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'TASK_CREATED', 'TASK', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '{"title":"Gather Expense Reports"}', NOW() - INTERVAL '15 days'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'TASK_CREATED', 'TASK', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '{"title":"Reconcile Bank Statements"}', NOW() - INTERVAL '15 days'),

-- Project 4: Cloud Migration
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'TASK_UPDATED', 'TASK', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '{"title":"Set up VPC","changes":"status"}', NOW() - INTERVAL '8 days'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'TASK_CREATED', 'TASK', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', '{"title":"Configure Auto-Scaling"}', NOW() - INTERVAL '5 days'),

-- Project 5: Internal HR Portal
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'TASK_CREATED', 'TASK', '11eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '{"title":"Requirement Gathering"}', NOW() - INTERVAL '5 days'),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'ea9f85b5-0c38-4c80-80bf-9db67b4ed46b', 'TASK_UPDATED', 'TASK', '11eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '{"title":"Requirement Gathering","changes":"status"}', NOW() - INTERVAL '4 days');
