-- Ex-Venture Team Tracker: Initial Schema
-- Creates hierarchical data model: Company → Projects → Sub-units → Tasks
-- Enables Row-Level Security (RLS) on all tables for team-based access control
-- Indexes all foreign key columns for RLS performance (critical per 01-RESEARCH.md)

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- COMPANIES TABLE (Top level)
-- =============================================================================
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS immediately (no data should exist without policies)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- TEAM MEMBERS TABLE
-- Links users (auth.users) to companies with roles
-- =============================================================================
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Index on company_id is CRITICAL for RLS performance (see 01-RESEARCH.md Pitfall 3)
-- Without this index, RLS policies will do sequential scans (94-99% slower)
CREATE INDEX idx_team_members_company_id ON team_members(company_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- =============================================================================
-- PROJECTS TABLE (Second level)
-- =============================================================================
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code_name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Index on company_id enables fast RLS policy lookups
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);

-- =============================================================================
-- SUB-UNITS TABLE (Third level)
-- =============================================================================
CREATE TABLE sub_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sub_units ENABLE ROW LEVEL SECURITY;

-- CASCADE delete ensures data consistency but means deleting a project removes all child records
CREATE INDEX idx_sub_units_project_id ON sub_units(project_id);

-- =============================================================================
-- TASK STATUS ENUM
-- Restricts task status to four allowed values
-- =============================================================================
CREATE TYPE task_status AS ENUM ('backlog', 'in_progress', 'blocked', 'done');

-- =============================================================================
-- TASKS TABLE (Fourth level - leaf nodes)
-- =============================================================================
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_unit_id UUID NOT NULL REFERENCES sub_units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
  due_date DATE,
  status task_status NOT NULL DEFAULT 'backlog',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Indexes on all FK columns and status for filtering
CREATE INDEX idx_tasks_sub_unit_id ON tasks(sub_unit_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);

-- =============================================================================
-- ROW-LEVEL SECURITY POLICIES
-- Enforce team-based access control at the database level
-- All policies use (SELECT auth.uid()) wrapper for performance (query caching)
-- =============================================================================

-- COMPANIES POLICIES
-- Users can view their own company
CREATE POLICY "Users can view their company"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- TEAM MEMBERS POLICIES
-- Users can view team members in their company
CREATE POLICY "Users can view team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Users can insert team members into their company
CREATE POLICY "Users can add team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- PROJECTS POLICIES
-- Users can view projects in their company
CREATE POLICY "Users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Users can create projects in their company
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Users can update projects in their company
CREATE POLICY "Users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM team_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Users can delete projects they created
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- SUB-UNITS POLICIES
-- Users can view sub-units for projects in their company
CREATE POLICY "Users can view sub_units"
  ON sub_units FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN team_members tm ON p.company_id = tm.company_id
      WHERE tm.user_id = (SELECT auth.uid())
    )
  );

-- Users can create sub-units under projects in their company
CREATE POLICY "Users can create sub_units"
  ON sub_units FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN team_members tm ON p.company_id = tm.company_id
      WHERE tm.user_id = (SELECT auth.uid())
    )
  );

-- Users can update sub-units in their company's projects
CREATE POLICY "Users can update sub_units"
  ON sub_units FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN team_members tm ON p.company_id = tm.company_id
      WHERE tm.user_id = (SELECT auth.uid())
    )
  );

-- Users can delete sub-units in their company's projects
CREATE POLICY "Users can delete sub_units"
  ON sub_units FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN team_members tm ON p.company_id = tm.company_id
      WHERE tm.user_id = (SELECT auth.uid())
    )
  );

-- TASKS POLICIES
-- Users can view tasks in their company
-- Multi-level JOIN: tasks -> sub_units -> projects -> company -> team_members
CREATE POLICY "Users can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    sub_unit_id IN (
      SELECT su.id FROM sub_units su
      INNER JOIN projects p ON su.project_id = p.id
      INNER JOIN team_members tm ON p.company_id = tm.company_id
      WHERE tm.user_id = (SELECT auth.uid())
    )
  );

-- Users can create tasks under sub-units in their company
CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    sub_unit_id IN (
      SELECT su.id FROM sub_units su
      INNER JOIN projects p ON su.project_id = p.id
      INNER JOIN team_members tm ON p.company_id = tm.company_id
      WHERE tm.user_id = (SELECT auth.uid())
    )
  );

-- Users can update tasks they created OR are assigned to
CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid()) OR
    assigned_to IN (
      SELECT id FROM team_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- Users can delete tasks they created
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (created_by = (SELECT auth.uid()));
