-- Indexes used by POS validation, stock dispatches and catalogue reads.
CREATE INDEX "Product_companyId_isActive_idx" ON "Product"("companyId", "isActive");
CREATE INDEX "Warehouse_companyId_isActive_isPrimary_idx" ON "Warehouse"("companyId", "isActive", "isPrimary");
CREATE INDEX "InventoryStock_warehouseId_productId_idx" ON "InventoryStock"("warehouseId", "productId");
CREATE INDEX "Sale_companyId_status_createdAt_idx" ON "Sale"("companyId", "status", "createdAt");
