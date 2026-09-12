-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authUserId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "githubHandle" TEXT,
    "erp" TEXT,
    "batch" TEXT,
    "bio" TEXT,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "embedding" TEXT,
    "verifiedSkills" TEXT NOT NULL DEFAULT '[]',
    "repoStack" TEXT,
    "repoComplexity" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Profile" ("authUserId", "batch", "bio", "createdAt", "email", "embedding", "erp", "fullName", "githubHandle", "id", "passwordHash", "role", "skills", "updatedAt") SELECT "authUserId", "batch", "bio", "createdAt", "email", "embedding", "erp", "fullName", "githubHandle", "id", "passwordHash", "role", "skills", "updatedAt" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_authUserId_key" ON "Profile"("authUserId");
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
