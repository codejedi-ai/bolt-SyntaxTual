export type Agent = {
  id: string
  user_id: string
  name: string
  description: string
  code: string
  yaml_config: string | null
  config_version: string
  agent_type: string
  model_provider: string
  model_name: string
  status: 'draft' | 'active' | 'deployed' | 'failed'
  deployment_url: string | null
  created_at: string
  updated_at: string
}

export type AgentTemplate = {
  id: string
  name: string
  description: string
  agent_type: string
  yaml_template: string
  is_public: boolean
  created_by: string | null
  created_at: string
}

export type ApiToken = {
  id: string
  user_id: string
  provider: string
  token_name: string
  encrypted_token: string
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

export type AgentDeployment = {
  id: string
  agent_id: string
  user_id: string
  deployment_status: 'pending' | 'deploying' | 'success' | 'failed'
  deployment_url: string | null
  error_message: string | null
  logs: string | null
  created_at: string
  completed_at: string | null
}

export type AgentExecution = {
  id: string
  agent_id: string
  user_id: string
  input: any
  output: any | null
  status: 'success' | 'error' | 'timeout'
  duration_ms: number | null
  error_message: string | null
  created_at: string
}
