# ISP NOC - Supabase Serverless Refactoring Guide

## Overview

This project is being refactored from a self-hosted Express backend to a 100% serverless architecture using Supabase and Netlify.

## Completed Steps

### 1. Environment Configuration
- ✅ Updated `.env` with Supabase credentials
- ✅ Supabase URL: `https://cvytvjptdbrzazizihnx.supabase.co`
- ✅ Anon Key configured

### 2. Supabase Client Setup
- ✅ Created `src/lib/supabase.ts` with typed client
- ✅ Installed `@supabase/supabase-js`
- ✅ TypeScript types defined for all tables

### 3. Authentication Refactored
- ✅ `src/contexts/AuthContext.tsx` now uses Supabase Auth
- ✅ Replaced JWT/bcrypt with Supabase Auth
- ✅ Session management with `onAuthStateChange`

### 4. Backend Removal
- ✅ Deleted `/server` directory (Express backend)
- ✅ Removed `src/lib/api.ts`

### 5. Database & Security
- ✅ Existing Supabase database with tables
- ✅ RLS policies enabled
- ✅ Role-based access: ADMIN, NOC, VIEWER

### 6. Deployment Configuration
- ✅ Created `netlify.toml` for Netlify deployment

## Remaining Steps

### Update All Page Components

Each page needs to be refactored to use the Supabase client instead of the old API. Here's the pattern:

#### Before (Old API):
```typescript
import { api } from '../lib/api';

const { data } = await api.get('/pops');
await api.post('/pops', popData);
await api.put(`/pops/${id}`, updates);
await api.delete(`/pops/${id}`);
```

#### After (Supabase Client):
```typescript
import { supabase } from '../lib/supabase';

// SELECT
const { data, error } = await supabase
  .from('pops')
  .select('*');

// INSERT
const { data, error } = await supabase
  .from('pops')
  .insert([popData])
  .select()
  .single();

// UPDATE
const { data, error } = await supabase
  .from('pops')
  .update(updates)
  .eq('id', id)
  .select()
  .single();

// DELETE
const { error } = await supabase
  .from('pops')
  .delete()
  .eq('id', id);
```

### Files That Need Updating

1. **src/pages/Dashboard.tsx** - Remove `../lib/api` imports
2. **src/pages/POPs.tsx** - Use Supabase for CRUD operations
3. **src/pages/Equipments.tsx** - Use Supabase for equipment management
4. **src/pages/VLANs.tsx** - Use Supabase for VLAN operations
5. **src/pages/Circuits.tsx** - Use Supabase for circuit operations
6. **src/pages/Services.tsx** - Use Supabase for service management
7. **src/pages/Interfaces.tsx** - Use Supabase for interface management
8. **src/pages/Runbooks.tsx** - Use Supabase for runbook CRUD
9. **src/pages/Checklists.tsx** - Use Supabase for checklist operations
10. **src/pages/Monitoring.tsx** - Use Supabase for monitoring data
11. **src/pages/admin/Users.tsx** - Use Supabase for user management
12. **src/pages/admin/Audit.tsx** - Use Supabase for audit logs
13. **src/components/** - Update any components using old API

### Supabase Query Examples

#### With Joins:
```typescript
const { data } = await supabase
  .from('equipment')
  .select(`
    *,
    pops (
      id,
      name,
      city
    )
  `)
  .eq('status', 'ACTIVE');
```

#### With Filters:
```typescript
const { data } = await supabase
  .from('equipment')
  .select('*')
  .eq('type', 'ROUTER')
  .eq('status', 'ACTIVE')
  .order('hostname', { ascending: true });
```

#### Real-time Subscriptions:
```typescript
const channel = supabase
  .channel('equipment-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'equipment'
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

## Database Schema

### Tables Available:
- **users** - User accounts with roles
- **pops** - Points of Presence
- **equipment** - Network equipment
- **vlans** - Virtual LANs
- **interfaces** - Equipment interfaces
- **circuits** - Network circuits
- **services** - Network services (PPPoE, DNS, etc.)
- **runbooks** - Operational procedures
- **checklists** - Task checklists
- **monitoring_configs** - Monitoring configuration
- **monitoring_status** - Current monitoring status
- **audit_logs** - System audit trail
- **credentials** - Encrypted credentials
- **config_snippets** - Configuration templates

### User Roles & Permissions:
- **ADMIN**: Full access to all resources
- **NOC**: Read/write access to operational data
- **VIEWER**: Read-only access

## Authentication Flow

### Login:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### Get Current User:
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### Get User Profile:
```typescript
const { data } = await supabase
  .from('users')
  .select('id, email, full_name, role')
  .eq('id', user.id)
  .single();
```

### Logout:
```typescript
await supabase.auth.signOut();
```

## Netlify Deployment

### Deploy to Netlify:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### Environment Variables in Netlify:
Set these in Netlify Dashboard → Site Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Testing

### Local Development:
```bash
npm install
npm run dev
```

### Build:
```bash
npm run build
```

### Preview Build:
```bash
npm run preview
```

## Security Notes

1. **RLS Enabled**: All tables have Row Level Security
2. **Anon Key**: Safe to expose (protected by RLS)
3. **No Service Role Key**: Never expose service role key in frontend
4. **HTTPS Only**: Netlify provides automatic HTTPS
5. **Authentication Required**: All API calls require valid session

## Migration Checklist

- [x] Setup Supabase client
- [x] Refactor AuthContext
- [x] Remove Express backend
- [x] Create Netlify config
- [ ] Update all page components
- [ ] Update all API calls to Supabase
- [ ] Test authentication flow
- [ ] Test CRUD operations
- [ ] Test real-time features
- [ ] Deploy to Netlify
- [ ] Configure environment variables
- [ ] Test production build

## Benefits of Serverless Architecture

1. **No Server Management**: Zero server maintenance
2. **Auto-scaling**: Handles traffic spikes automatically
3. **Cost Effective**: Pay only for usage
4. **Global CDN**: Fast worldwide performance
5. **Built-in Auth**: Supabase handles authentication
6. **Real-time**: WebSocket support out of the box
7. **Security**: RLS at database level
8. **Backups**: Automatic database backups

## Support

- Supabase Docs: https://supabase.com/docs
- Netlify Docs: https://docs.netlify.com
- Project Repository: [Your repo URL]

---

**Status**: Partial - Authentication refactored, frontend pages need updating
**Architecture**: 100% Serverless (Netlify + Supabase)
**Database**: PostgreSQL (Supabase)
**Authentication**: Supabase Auth
