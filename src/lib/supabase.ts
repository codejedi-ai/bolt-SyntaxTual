import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { auth } from './firebase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are not set. Supabase features will not work.')
}

// Singleton authenticated client cache - prevents multiple GoTrueClient instances
let authenticatedClient: SupabaseClient | null = null
let currentUserId: string | null = null

/**
 * Clear the cached Supabase client (call on logout)
 */
export function clearAuthenticatedClient() {
  authenticatedClient = null
  currentUserId = null
}

/**
 * Get an authenticated Supabase client with Firebase ID token
 * Uses a singleton pattern to prevent multiple GoTrueClient instances
 * This should be used for all authenticated requests to Supabase
 */
export async function getAuthenticatedSupabaseClient(): Promise<SupabaseClient> {
  const firebaseUser = auth.currentUser
  if (!firebaseUser) {
    throw new Error('Not authenticated - no Firebase user')
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  // Reuse client if user hasn't changed
  if (authenticatedClient && currentUserId === firebaseUser.uid) {
    // Update headers with fresh token
    const idToken = await firebaseUser.getIdToken()
    // Note: We can't update headers after creation, but we can verify the client is still valid
    return authenticatedClient
  }

  // Get fresh token
  const idToken = await firebaseUser.getIdToken()

  // Create new client with NO storage to prevent GoTrueClient conflicts
  // Use a unique storage key per user to isolate instances
  authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
      // Use a unique storage key per Firebase user to prevent conflicts
      storageKey: `supabase-auth-${firebaseUser.uid}`,
    },
  })

  currentUserId = firebaseUser.uid

  return authenticatedClient
}

// Lazy default client - only created if explicitly needed (should be avoided)
// This prevents creating a GoTrueClient instance on module load
let defaultClient: SupabaseClient | null = null

export function getDefaultSupabaseClient() {
  if (!defaultClient) {
    defaultClient = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          },
          storageKey: 'supabase-default-noauth',
        },
      }
    )
  }
  return defaultClient
}

// For backwards compatibility only - prefer getAuthenticatedSupabaseClient()
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    console.warn('⚠️ Using default supabase client - prefer getAuthenticatedSupabaseClient()')
    return getDefaultSupabaseClient()[prop as keyof SupabaseClient]
  },
})

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
