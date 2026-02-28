-- Ex-Venture Team Tracker: Seed Data
-- Creates initial company and team members for local development
-- Based on CONTEXT.md team structure (Science and AI teams)

-- Insert company (single company for MVP)
INSERT INTO companies (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Ex-Venture Engineering')
ON CONFLICT (id) DO NOTHING;

-- Create test user and seed all data in single transaction
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Check if test user exists, if not create one
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@example.com';

  IF test_user_id IS NULL THEN
    -- Create test user for local development
    -- Password: password123
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'test@example.com',
      crypt('password123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO test_user_id;
  END IF;

  -- Insert team members (all linked to test user for MVP)
  INSERT INTO team_members (company_id, name, role, user_id) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Miguel Perez Llabata', 'Lead Engineer', test_user_id),
    ('00000000-0000-0000-0000-000000000001', 'Arvin', 'Scientist', test_user_id),
    ('00000000-0000-0000-0000-000000000001', 'Victoria', 'Scientist', test_user_id),
    ('00000000-0000-0000-0000-000000000001', 'Nida Rifda', 'AI Engineer', test_user_id),
    ('00000000-0000-0000-0000-000000000001', 'Paolo Testa', 'AI Engineer', test_user_id),
    ('00000000-0000-0000-0000-000000000001', 'Harith Kesavan', 'AI Engineer', test_user_id),
    ('00000000-0000-0000-0000-000000000001', 'Shruti Patil', 'AI Engineer', test_user_id),
    ('00000000-0000-0000-0000-000000000001', 'Rithish', 'AI Engineer', test_user_id)
  ON CONFLICT DO NOTHING;

  -- Insert projects matching CONTEXT.md active projects
  INSERT INTO projects (company_id, name, code_name, created_by) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Seraph - Duckweed Growing System', 'SERAPH', test_user_id),
    ('00000000-0000-0000-0000-000000000001', 'X150 - Waste to Energy System', 'X150', test_user_id),
    ('00000000-0000-0000-0000-000000000001', 'IntelliBot / Mission Control', 'INTELLIBOT', test_user_id)
  ON CONFLICT DO NOTHING;

  -- Insert sub-units for Seraph project
  INSERT INTO sub_units (project_id, name, description) VALUES
    ((SELECT id FROM projects WHERE code_name = 'SERAPH' LIMIT 1), 'Simulation', 'Growth simulation modeling'),
    ((SELECT id FROM projects WHERE code_name = 'SERAPH' LIMIT 1), 'Pilot Farm', 'Physical cultivation trials'),
    ((SELECT id FROM projects WHERE code_name = 'SERAPH' LIMIT 1), 'Lit Validation', 'Literature review and validation'),
    ((SELECT id FROM projects WHERE code_name = 'SERAPH' LIMIT 1), 'Presets', 'Standard growth configurations')
  ON CONFLICT DO NOTHING;

  -- Insert sub-units for X150 project
  INSERT INTO sub_units (project_id, name, description) VALUES
    ((SELECT id FROM projects WHERE code_name = 'X150' LIMIT 1), 'CFD', 'Computational fluid dynamics modeling'),
    ((SELECT id FROM projects WHERE code_name = 'X150' LIMIT 1), 'Oil Bath Drier', 'Thermal processing component')
  ON CONFLICT DO NOTHING;

  -- Insert sub-units for IntelliBot project
  INSERT INTO sub_units (project_id, name, description) VALUES
    ((SELECT id FROM projects WHERE code_name = 'INTELLIBOT' LIMIT 1), 'GSD Integration', 'Get Shit Done protocol integration'),
    ((SELECT id FROM projects WHERE code_name = 'INTELLIBOT' LIMIT 1), 'PnP', 'Plug and Play agent system'),
    ((SELECT id FROM projects WHERE code_name = 'INTELLIBOT' LIMIT 1), 'A2A', 'Agent-to-Agent communication'),
    ((SELECT id FROM projects WHERE code_name = 'INTELLIBOT' LIMIT 1), 'Toon', 'AI animation system')
  ON CONFLICT DO NOTHING;

  -- Insert sample tasks
  INSERT INTO tasks (sub_unit_id, title, description, assigned_to, status, created_by, due_date) VALUES
    (
      (SELECT id FROM sub_units WHERE name = 'Simulation' LIMIT 1),
      'Build initial growth model',
      'Create baseline simulation of duckweed growth rates',
      (SELECT id FROM team_members WHERE name = 'Miguel Perez Llabata' LIMIT 1),
      'in_progress',
      test_user_id,
      CURRENT_DATE + INTERVAL '14 days'
    ),
    (
      (SELECT id FROM sub_units WHERE name = 'GSD Integration' LIMIT 1),
      'Implement task routing',
      'Route tasks from Slack to appropriate agents',
      (SELECT id FROM team_members WHERE name = 'Nida Rifda' LIMIT 1),
      'in_progress',
      test_user_id,
      CURRENT_DATE + INTERVAL '7 days'
    ),
    (
      (SELECT id FROM sub_units WHERE name = 'CFD' LIMIT 1),
      'Run thermal analysis',
      'CFD simulation of waste combustion process',
      (SELECT id FROM team_members WHERE name = 'Arvin' LIMIT 1),
      'backlog',
      test_user_id,
      CURRENT_DATE + INTERVAL '21 days'
    )
  ON CONFLICT DO NOTHING;
END $$;
