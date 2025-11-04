import { User as FirebaseUser } from 'firebase/auth'
import { supabase } from './supabase'

export async function syncFirebaseUserToSupabase(user: FirebaseUser) {
  try {
    const idToken = await user.getIdToken()

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
    }
  } catch (error) {
    console.error('Error syncing user:', error)
  }
}
