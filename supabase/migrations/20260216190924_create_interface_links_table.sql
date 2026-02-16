/*
  # Create Interface Links Table

  1. New Tables
    - `interface_links`
      - `id` (uuid, primary key)
      - `interface_a_id` (uuid, foreign key to interfaces)
      - `interface_b_id` (uuid, foreign key to interfaces)
      - `description` (text, optional description)
      - `vlans` (text array, VLANs passing through the link)
      - `status` (text, link status: ACTIVE, INACTIVE, MAINTENANCE)
      - `bandwidth` (text, optional bandwidth info)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Disable RLS for application-level access control
  
  3. Indexes
    - Add index on interface_a_id for faster lookups
    - Add index on interface_b_id for faster lookups
    - Add unique constraint to prevent duplicate links
*/

CREATE TABLE IF NOT EXISTS interface_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interface_a_id uuid NOT NULL REFERENCES interfaces(id) ON DELETE CASCADE,
  interface_b_id uuid NOT NULL REFERENCES interfaces(id) ON DELETE CASCADE,
  description text,
  vlans text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
  bandwidth text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_interfaces CHECK (interface_a_id != interface_b_id),
  CONSTRAINT unique_link UNIQUE (interface_a_id, interface_b_id)
);

CREATE INDEX IF NOT EXISTS idx_interface_links_interface_a ON interface_links(interface_a_id);
CREATE INDEX IF NOT EXISTS idx_interface_links_interface_b ON interface_links(interface_b_id);

ALTER TABLE interface_links DISABLE ROW LEVEL SECURITY;