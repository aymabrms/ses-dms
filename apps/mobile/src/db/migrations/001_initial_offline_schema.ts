export const migration001InitialOfflineSchema = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_projects (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS local_survey_areas (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  code TEXT,
  name TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS local_questionnaire_versions (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  module_type TEXT NOT NULL,
  version_code TEXT NOT NULL,
  title TEXT NOT NULL,
  effective_from TEXT,
  effective_to TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS local_lookup_sets (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS local_lookup_values (
  id TEXT PRIMARY KEY,
  lookup_set_id TEXT NOT NULL,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS local_persons (
  id TEXT PRIMARY KEY,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  maiden_name TEXT,
  birth_date TEXT,
  gender_raw TEXT,
  primary_contact_number TEXT,
  primary_email TEXT,
  local_sync_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_interviews (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  survey_area_id TEXT NOT NULL,
  enumerator_user_id TEXT,
  respondent_person_id TEXT,
  survey_date TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  server_workflow_status TEXT,
  local_sync_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  server_updated_at TEXT,
  last_synced_at TEXT
);

CREATE TABLE IF NOT EXISTS local_households (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  survey_area_id TEXT NOT NULL,
  local_sync_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_household_memberships (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  relationship_to_head_raw TEXT,
  relationship_lookup_value_id TEXT,
  member_order INTEGER,
  local_sync_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_businesses (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  survey_area_id TEXT NOT NULL,
  name TEXT,
  nature_of_business_raw TEXT,
  ownership_type_raw TEXT,
  started_at TEXT,
  local_sync_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_business_employees (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  employment_status_raw TEXT,
  work_assignment_raw TEXT,
  local_sync_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_land_parcels (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  survey_area_id TEXT NOT NULL,
  area_value REAL,
  area_unit TEXT,
  land_use_raw TEXT,
  ownership_type_raw TEXT,
  local_sync_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_structures (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  survey_area_id TEXT NOT NULL,
  land_parcel_id TEXT,
  structure_use_raw TEXT,
  structure_type_raw TEXT,
  structure_condition_raw TEXT,
  local_sync_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_interview_modules (
  id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL,
  questionnaire_version_id TEXT NOT NULL,
  module_type TEXT NOT NULL,
  household_id TEXT,
  business_id TEXT,
  land_parcel_id TEXT,
  structure_id TEXT,
  server_revision INTEGER NOT NULL DEFAULT 0,
  local_sync_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_repeat_instances (
  id TEXT PRIMARY KEY,
  interview_module_id TEXT NOT NULL,
  group_code TEXT NOT NULL,
  parent_repeat_instance_id TEXT,
  sequence_number INTEGER,
  linked_person_id TEXT,
  linked_household_membership_id TEXT,
  linked_business_employee_id TEXT,
  linked_structure_id TEXT,
  local_sync_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_questionnaire_responses (
  id TEXT PRIMARY KEY,
  interview_module_id TEXT NOT NULL,
  question_code TEXT NOT NULL,
  repeat_instance_id TEXT,
  response_state TEXT NOT NULL,
  value_text TEXT,
  value_number REAL,
  value_boolean INTEGER,
  value_date TEXT,
  value_json TEXT,
  raw_value TEXT,
  captured_at TEXT,
  local_sync_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS local_questionnaire_responses_root_key
ON local_questionnaire_responses(interview_module_id, question_code)
WHERE repeat_instance_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS local_questionnaire_responses_repeat_key
ON local_questionnaire_responses(interview_module_id, question_code, repeat_instance_id)
WHERE repeat_instance_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS local_validation_issues (
  id TEXT PRIMARY KEY,
  interview_id TEXT,
  interview_module_id TEXT,
  questionnaire_response_id TEXT,
  severity TEXT NOT NULL,
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  interview_id TEXT,
  module_id TEXT,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS sync_outbox_pending_module_key
ON sync_outbox(module_id, operation)
WHERE status = 'PENDING' AND operation = 'SYNC_MODULE';
`;
