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
    "managerCode" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "managerPhone" TEXT NOT NULL DEFAULT '',
    "referredBy" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Restaurant" ("color", "cuisine", "icon", "id", "managerCode", "name", "points", "tier") SELECT "color", "cuisine", "icon", "id", "managerCode", "name", "points", "tier" FROM "Restaurant";
DROP TABLE "Restaurant";
ALTER TABLE "new_Restaurant" RENAME TO "Restaurant";
CREATE TABLE "new_Store" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "tier" TEXT NOT NULL DEFAULT 'Bronze',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "managerPhone" TEXT NOT NULL DEFAULT '',
    "referredBy" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Store" ("color", "icon", "id", "name", "points", "tier") SELECT "color", "icon", "id", "name", "points", "tier" FROM "Store";
DROP TABLE "Store";
ALTER TABLE "new_Store" RENAME TO "Store";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
