-- Existing categories were created before the human-readable master code.
-- Assign a deterministic code per company while preserving every existing relation.
WITH ranked_categories AS (
  SELECT
    category.id,
    category."companyId",
    ROW_NUMBER() OVER (PARTITION BY category."companyId" ORDER BY category."createdAt", category.id)
      + COALESCE((
        SELECT MAX(CAST(NULLIF(regexp_replace(existing.code, '\\D', '', 'g'), '') AS INTEGER))
        FROM "ProductCategory" existing
        WHERE existing."companyId" = category."companyId" AND existing.code IS NOT NULL
      ), 0) AS sequence
  FROM "ProductCategory" category
  WHERE category.code IS NULL
)
UPDATE "ProductCategory" category
SET code = 'CAT' || LPAD(ranked_categories.sequence::TEXT, 3, '0')
FROM ranked_categories
WHERE category.id = ranked_categories.id;
