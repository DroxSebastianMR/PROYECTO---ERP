CREATE TYPE "NotificationType" AS ENUM ('INVENTORY', 'SALE', 'PURCHASE', 'SYSTEM');

CREATE TABLE "Notification" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "actionUrl" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
