# Firebase + Supabase Integration

This project uses Firebase for authentication and Supabase for the database.

## How It Works

1. **Firebase Authentication**: Users sign in with Firebase (Google OAuth, Email/Password)
2. **Token Sync**: Firebase ID tokens are automatically passed to Supabase
3. **User Sync**: Firebase users are synced to the `public.users` table in Supabase
4. **RLS Security**: Supabase Row Level Security policies validate Firebase tokens

## Architecture

```
User Login (Firebase)
    ↓
Firebase ID Token Generated
    ↓
Token Passed to Supabase via Authorization Header
    ↓
firebase_uid() Function Extracts User ID from Token
    ↓
RLS Policies Validate Access
    ↓
Data Access Granted/Denied
```

## Using the Authenticated Client

Always use `getAuthenticatedSupabaseClient()` when making authenticated requests:

```typescript
import { getAuthenticatedSupabaseClient } from '@/lib/supabase'

async function createAgent(agentData: any) {
  const supabase = await getAuthenticatedSupabaseClient()

  const { data, error } = await supabase
    .from('agents')
    .insert({
      ...agentData,
      user_id: auth.currentUser?.uid, // Firebase UID
    })
    .select()
    .single()

  return { data, error }
}
```

## Database Schema

### public.users Table
- `id` (text, PK): Firebase UID
- `email` (text): User email
- `display_name` (text): Display name
- `photo_url` (text): Profile photo
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

All other tables reference `public.users` via foreign keys.

## RLS Policies

All tables have restrictive RLS policies that use `firebase_uid()` to validate access:

- Users can only read/write their own data
- Foreign keys ensure data integrity
- Public templates are accessible to all authenticated users

## Environment Variables

Required environment variables:

```
# Firebase
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID

# Supabase
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Automatic User Sync

When a user signs in with Firebase, they are automatically synced to Supabase:

1. `onAuthStateChanged` listener detects login
2. `syncFirebaseUserToSupabase()` creates/updates user record
3. User can now access Supabase with RLS protection

## Security Notes

- Firebase ID tokens are short-lived and automatically refreshed
- Supabase validates each request using the token
- RLS policies ensure users can only access their own data
- No server-side code needed - all validation happens at the database level
