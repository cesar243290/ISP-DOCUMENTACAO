#!/bin/bash

# Script to remove Supabase imports and replace with API client

cd /tmp/cc-agent/63791696/project/src

# Find all files with supabase imports and remove them
find . -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  if grep -q "from.*supabase" "$file" 2>/dev/null; then
    echo "Updating $file"
    # Remove supabase import
    sed -i "/import.*supabase.*from/d" "$file"
    # Remove auth helper imports
    sed -i "/import.*canManage.*from.*auth/d" "$file"
    # Remove audit imports
    sed -i "/import.*logAudit.*from.*audit/d" "$file"
    # Add api import if supabase was used
    if ! grep -q "import.*api.*from.*api" "$file"; then
      sed -i "1i import { api } from '../lib/api';" "$file"
    fi
  fi
done

echo "Import updates complete"
