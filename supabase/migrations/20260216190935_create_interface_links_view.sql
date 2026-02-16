/*
  # Create Interface Links View

  1. New Views
    - `interface_links_detailed` - View with complete link information including equipment details
  
  This view makes it easier to query links with all related information in a single query.
*/

CREATE OR REPLACE VIEW interface_links_detailed AS
SELECT 
  il.id,
  il.interface_a_id,
  il.interface_b_id,
  il.description,
  il.vlans,
  il.status,
  il.bandwidth,
  il.created_at,
  il.updated_at,
  ia.name as interface_a_name,
  ia.type as interface_a_type,
  ea.id as equipment_a_id,
  ea.hostname as equipment_a_hostname,
  ea.type as equipment_a_type,
  ib.name as interface_b_name,
  ib.type as interface_b_type,
  eb.id as equipment_b_id,
  eb.hostname as equipment_b_hostname,
  eb.type as equipment_b_type
FROM interface_links il
LEFT JOIN interfaces ia ON il.interface_a_id = ia.id
LEFT JOIN equipment ea ON ia.equipment_id = ea.id
LEFT JOIN interfaces ib ON il.interface_b_id = ib.id
LEFT JOIN equipment eb ON ib.equipment_id = eb.id;