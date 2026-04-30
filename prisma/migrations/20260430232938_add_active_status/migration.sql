-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Restaurant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "cuisine" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "tier" TEXT NOT NULL DEFAULT 'Bronze',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "managerCode" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "managerPhone" TEXT NOT NULL DEFAULT '',
    "referredBy" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Restaurant" ("address", "color", "cuisine", "email", "icon", "id", "managerCode", "managerPhone", "name", "points", "referredBy", "tier") SELECT "address", "color", "cuisine", "email", "icon", "id", "managerCode", "managerPhone", "name", "points", "referredBy", "tier" FROM "Restaurant";
DROP TABLE "Restaurant";
ALTER TABLE "new_Restaurant" RENAME TO "Restaurant";
CREATE TABLE "new_Store" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "tier" TEXT NOT NULL DEFAULT 'Bronze',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "managerPhone" TEXT NOT NULL DEFAULT '',
    "referredBy" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Store" ("address", "color", "email", "icon", "id", "managerPhone", "name", "points", "referredBy", "tier") SELECT "address", "color", "email", "icon", "id", "managerPhone", "name", "points", "referredBy", "tier" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
