-- Preserve the product cost at the time a sale is registered for reliable profitability reports.
ALTER TABLE "SaleItem" ADD COLUMN "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Establish a useful baseline for historical sales. New sales store the exact
-- product cost in effect when they are created.
UPDATE "SaleItem" AS sale_item
SET "unitCost" = COALESCE(product."purchasePrice", 0)
FROM "Product" AS product
WHERE product.id = sale_item."productId";
