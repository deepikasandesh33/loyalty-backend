-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserRestaurant" (
    "userId" INTEGER NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("userId", "restaurantId"),
    CONSTRAINT "UserRestaurant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserRestaurant_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserRestaurant" ("restaurantId", "userId") SELECT "restaurantId", "userId" FROM "UserRestaurant";
DROP TABLE "UserRestaurant";
ALTER TABLE "new_UserRestaurant" RENAME TO "UserRestaurant";
CREATE TABLE "new_UserStore" (
    "userId" INTEGER NOT NULL,
    "storeId" INTEGER NOT NULL,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("userId", "storeId"),
    CONSTRAINT "UserStore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserStore" ("storeId", "userId") SELECT "storeId", "userId" FROM "UserStore";
DROP TABLE "UserStore";
ALTER TABLE "new_UserStore" RENAME TO "UserStore";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
