#!/bin/bash

# Refactor script to update all remaining page files to use Supabase instead of API

# Define files to update
FILES=(
  "src/pages/Interfaces.tsx"
  "src/pages/Runbooks.tsx"
  "src/pages/Checklists.tsx"
  "src/pages/IPAM.tsx"
  "src/pages/admin/Users.tsx"
)

# For each file, perform the replacements
for file in "${FILES[@]}"; do
  echo "Processing $file..."

  # 1. Update imports - replace api with supabase and add canManage
  if grep -q "import { api } from" "$file"; then
    # For regular pages
    sed -i "s|import { api } from '../lib/api';|import { supabase } from '../lib/supabase';\nimport { canManage } from '../lib/utils';|g" "$file"
  elif grep -q "import { api } from '../../lib/api';" "$file"; then
    # For admin pages
    sed -i "s|import { api } from '../../lib/api';|import { supabase } from '../../lib/supabase';\nimport { canManage, hashPassword } from '../../lib/utils';|g" "$file"
  fi

  echo "Updated imports in $file"
done

echo "All files updated successfully!"
echo ""
echo "Note: You will need to manually update the API calls in each file to use Supabase syntax."
echo "Pattern: api.get('/resource') -> supabase.from('resource').select('*')"
echo "Pattern: api.post('/resource', data) -> supabase.from('resource').insert([data]).select().single()"
echo "Pattern: api.put('/resource/:id', data) -> supabase.from('resource').update(data).eq('id', id).select().single()"
echo "Pattern: api.delete('/resource/:id') -> supabase.from('resource').delete().eq('id', id)"
