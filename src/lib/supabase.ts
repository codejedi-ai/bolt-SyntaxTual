import { createClient } from '@supabase/supabase-js'
import { auth } from './firebase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are not set. Supabase features will not work.')
}

// Create a single default client for unauthenticated operations
// Note: This should rarely be used - prefer getAuthenticatedSupabaseClient()
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
)

/**
 * Get an authenticated Supabase client with Firebase ID token
 * This should be used for all authenticated requests to Supabase
 * This prevents multiple GoTrueClient instances by reusing configuration
 */
export async function getAuthenticatedSupabaseClient() {
  const firebaseUser = auth.currentUser
  if (!firebaseUser) {
    throw new Error('Not authenticated - no Firebase user')
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  const idToken = await firebaseUser.getIdToken()
  
  // Create client with Firebase token in headers
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

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
