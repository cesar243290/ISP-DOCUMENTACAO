# Fixing Remaining Supabase References

## Files that need updating:

1. ./pages/admin/Audit.tsx
2. ./pages/admin/Users.tsx
3. ./pages/IPAM.tsx
4. ./pages/VLANs.tsx
5. ./pages/Circuits.tsx
6. ./pages/Runbooks.tsx
7. ./pages/Dashboard.tsx
8. ./pages/Services.tsx
9. ./pages/Checklists.tsx
10. ./pages/Equipments.tsx
11. ./pages/Interfaces.tsx
12. ./pages/Monitoring.tsx
13. ./components/NotificationBell.tsx
14. ./components/EquipmentCredentials.tsx

## Pattern to follow:

### REMOVE these imports:
```typescript
import { supabase } from '../lib/supabase';
import { canManage } from '../lib/auth';
import { logAudit } from '../lib/audit';
```

### ADD this import:
```typescript
import { api } from '../lib/api';
```

### REPLACE Supabase calls:

**GET:**
```typescript
// OLD:
const { data } = await supabase.from('table').select('*');

// NEW:
const data = await api.get('/table');
```

**POST:**
```typescript
// OLD:
const { data } = await supabase.from('table').insert([formData]).select().single();

// NEW:
const data = await api.post('/table', formData);
```

**PUT:**
```typescript
// OLD:
const { data } = await supabase.from('table').update(formData).eq('id', id).select().single();

// NEW:
const data = await api.put(`/table/${id}`, formData);
```

**DELETE:**
```typescript
// OLD:
await supabase.from('table').delete().eq('id', id);

// NEW:
await api.delete(`/table/${id}`);
```

### REPLACE canManage:
```typescript
// OLD:
canManage(user?.role)

// NEW:
user?.role === 'admin'
```

### REMOVE logAudit calls:
```typescript
// Just remove them - the backend handles audit logging
```

## Available API Endpoints:

- `/pops` - GET, POST, PUT /:id, DELETE /:id
- `/equipment` - GET, POST, PUT /:id, DELETE /:id
- `/vlans` - GET, POST, PUT /:id, DELETE /:id
- `/circuits` - GET, POST, PUT /:id, DELETE /:id
- `/users` - GET, POST, PUT /:id, DELETE /:id
- `/audit` - GET (admin only)
