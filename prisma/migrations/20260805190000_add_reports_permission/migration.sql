UPDATE "User"
SET "permissions" = array_append("permissions", 'REPORTS_VIEW')
WHERE "role" IN ('ADMIN', 'MANAGER', 'ACCOUNTANT')
  AND NOT ('REPORTS_VIEW' = ANY("permissions"));
