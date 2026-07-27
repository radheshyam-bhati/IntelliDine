-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "intellidine_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "intellidine_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intellidine_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "restaurantId" UUID,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intellidine_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "intellidine_restaurants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "serviceChargeRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intellidine_restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_menu_categories" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "intellidine_menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_menu_items" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" DECIMAL(65,30) NOT NULL,
    "imageUrl" TEXT,
    "dietaryTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isManualOverride" BOOLEAN NOT NULL DEFAULT false,
    "availabilityWindow" JSONB,

    CONSTRAINT "intellidine_menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_ingredients" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reorderThreshold" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "supplierName" TEXT,

    CONSTRAINT "intellidine_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_menu_item_ingredients" (
    "id" UUID NOT NULL,
    "menuItemId" UUID NOT NULL,
    "ingredientId" UUID NOT NULL,
    "quantityRequired" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "intellidine_menu_item_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_tables" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "status" TEXT NOT NULL DEFAULT 'empty',

    CONSTRAINT "intellidine_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_orders" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "tableId" UUID NOT NULL,
    "customerId" TEXT,
    "createdByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'placed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intellidine_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_order_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "menuItemId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "specialRequest" TEXT,
    "unitPriceAtOrder" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "intellidine_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_bills" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "tableId" UUID NOT NULL,
    "orderIds" UUID[],
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "serviceChargeAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "paymentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intellidine_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_reservations" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "partySize" INTEGER NOT NULL,
    "reservedFor" TIMESTAMP(3) NOT NULL,
    "tableId" UUID,
    "status" TEXT NOT NULL DEFAULT 'confirmed',

    CONSTRAINT "intellidine_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_queue_entries" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "partySize" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'waiting',

    CONSTRAINT "intellidine_queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_inventory_adjustments" (
    "id" UUID NOT NULL,
    "ingredientId" UUID NOT NULL,
    "changeAmount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "orderId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intellidine_inventory_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intellidine_forecasts" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "menuItemId" UUID NOT NULL,
    "forecastDate" DATE NOT NULL,
    "predictedQuantity" DECIMAL(65,30) NOT NULL,
    "basis" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intellidine_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "intellidine_accounts_provider_providerAccountId_key" ON "intellidine_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "intellidine_sessions_sessionToken_key" ON "intellidine_sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "intellidine_users_email_key" ON "intellidine_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "intellidine_verification_tokens_token_key" ON "intellidine_verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "intellidine_verification_tokens_identifier_token_key" ON "intellidine_verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "intellidine_restaurants_slug_key" ON "intellidine_restaurants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "intellidine_menu_item_ingredients_menuItemId_ingredientId_key" ON "intellidine_menu_item_ingredients"("menuItemId", "ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "intellidine_forecasts_restaurantId_menuItemId_forecastDate_key" ON "intellidine_forecasts"("restaurantId", "menuItemId", "forecastDate");

-- AddForeignKey
ALTER TABLE "intellidine_accounts" ADD CONSTRAINT "intellidine_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "intellidine_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_sessions" ADD CONSTRAINT "intellidine_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "intellidine_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_users" ADD CONSTRAINT "intellidine_users_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "intellidine_restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_menu_categories" ADD CONSTRAINT "intellidine_menu_categories_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "intellidine_restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_menu_items" ADD CONSTRAINT "intellidine_menu_items_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "intellidine_restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_menu_items" ADD CONSTRAINT "intellidine_menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "intellidine_menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_ingredients" ADD CONSTRAINT "intellidine_ingredients_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "intellidine_restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_menu_item_ingredients" ADD CONSTRAINT "intellidine_menu_item_ingredients_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "intellidine_menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_menu_item_ingredients" ADD CONSTRAINT "intellidine_menu_item_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "intellidine_ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_tables" ADD CONSTRAINT "intellidine_tables_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "intellidine_restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_orders" ADD CONSTRAINT "intellidine_orders_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "intellidine_restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_orders" ADD CONSTRAINT "intellidine_orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "intellidine_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_orders" ADD CONSTRAINT "intellidine_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "intellidine_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_orders" ADD CONSTRAINT "intellidine_orders_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "intellidine_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_order_items" ADD CONSTRAINT "intellidine_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "intellidine_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_order_items" ADD CONSTRAINT "intellidine_order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "intellidine_menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_bills" ADD CONSTRAINT "intellidine_bills_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "intellidine_restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_bills" ADD CONSTRAINT "intellidine_bills_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "intellidine_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_reservations" ADD CONSTRAINT "intellidine_reservations_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "intellidine_restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_reservations" ADD CONSTRAINT "intellidine_reservations_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "intellidine_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_queue_entries" ADD CONSTRAINT "intellidine_queue_entries_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "intellidine_restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_inventory_adjustments" ADD CONSTRAINT "intellidine_inventory_adjustments_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "intellidine_ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_inventory_adjustments" ADD CONSTRAINT "intellidine_inventory_adjustments_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "intellidine_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_inventory_adjustments" ADD CONSTRAINT "intellidine_inventory_adjustments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "intellidine_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_forecasts" ADD CONSTRAINT "intellidine_forecasts_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "intellidine_restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intellidine_forecasts" ADD CONSTRAINT "intellidine_forecasts_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "intellidine_menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

