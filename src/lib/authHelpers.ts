import { User as FirebaseUser } from 'firebase/auth'
import { getAuthenticatedSupabaseClient } from './supabase'

export async function syncFirebaseUserToSupabase(user: FirebaseUser) {
  try {
    // Use authenticated Supabase client that passes Firebase token
    const supabase = await getAuthenticatedSupabaseClient()

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.uid,
        email: user.email,
        display_name: user.displayName,
        photo_url: user.photoURL,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    if (error) {
      console.error('Error syncing user to Supabase:', error)
      throw error
    } else {
      console.log('✅ User synced to Supabase successfully')
    }
  } catch (error: any) {
    // Only log if it's not a configuration error
    if (error?.message?.includes('environment variables') || error?.message?.includes('Not authenticated')) {
      console.warn('⚠️ Supabase sync skipped:', error.message)
    } else {
      console.error('Error syncing user to Supabase:', error)
    }
  }
}
