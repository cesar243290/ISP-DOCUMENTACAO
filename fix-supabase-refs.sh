#!/bin/bash

cd /tmp/cc-agent/63791696/project/src

# List of files to update
FILES=(
  "pages/admin/Audit.tsx"
  "pages/admin/Users.tsx"
  "pages/IPAM.tsx"
  "pages/VLANs.tsx"
  "pages/Circuits.tsx"
  "pages/Runbooks.tsx"
  "pages/Dashboard.tsx"
  "pages/Services.tsx"
  "pages/Checklists.tsx"
  "pages/Equipments.tsx"
  "pages/Interfaces.tsx"
  "pages/Monitoring.tsx"
  "components/NotificationBell.tsx"
  "components/EquipmentCredentials.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Remove supabase import
    sed -i "/import.*{ supabase }.*from.*supabase/d" "$file"

    # Remove canManage import
    sed -i "/import.*canManage.*from.*auth/d" "$file"

    # Remove logAudit import
    sed -i "/import.*logAudit.*from.*audit/d" "$file"

    # Remove verifyPassword import
    sed -i "/import.*verifyPassword.*from.*auth/d" "$file"

    # Add api import if not present (check first to avoid duplicates)
    if ! grep -q "import.*{ api }.*from.*api" "$file"; then
      # Insert after the first import statement
      sed -i "1a import { api } from '../lib/api';" "$file"
    fi

    # Replace supabase calls with api calls
    # Note: These are basic replacements - complex queries may need manual fixes
    sed -i "s/supabase\.from('\([^']*\)')\.select('\*')\.order('\([^']*\)')/api.get('\/\1')/g" "$file"
    sed -i "s/supabase\.from('\([^']*\)')\.select('\*')/api.get('\/\1')/g" "$file"
    sed -i "s/await supabase\.from('\([^']*\)')\.delete()\.eq('id', \([^)]*\))/await api.delete(`\/\1\/\${\ 2}`)/g" "$file"

    # Replace canManage with inline check
    sed -i "s/canManage(user\?\.role)/user?.role === 'admin'/g" "$file"

    # Remove logAudit calls (keep the await and try-catch structure)
    sed -i "/await logAudit({/,/});/d" "$file"

    echo "  ✓ Done"
  else
    echo "  ✗ File not found: $file"
  fi
done

echo ""
echo "All files processed!"
