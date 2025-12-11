-- 1. Truncate all tables to remove old company data
TRUNCATE TABLE "attendance" CASCADE;
TRUNCATE TABLE "employee_locations_location" CASCADE;
TRUNCATE TABLE "employee" CASCADE;
TRUNCATE TABLE "user" CASCADE;
TRUNCATE TABLE "location" CASCADE;
TRUNCATE TABLE "department" CASCADE;
TRUNCATE TABLE "admin" CASCADE;
-- Add any other tables if necessary

-- 2. Insert the first Super Admin for Ozone
-- NOTE: Replace '$2b$10$YourHashedPasswordHere' with your actual bcrypt hashed password
-- You can generate one using an online bcrypt generator or a script.
INSERT INTO "user" (username, password, type, status, "isActiveDirectory")
VALUES ('super_admin', '$2b$10$q9GaaKg19k3f6BpML.3i2u729JN5NT1aglwcdX8OXii4njR8FOun2', 'admin', 'ACTIVE', false);
-- super_admin => IT@admin123

-- 3. Link the user to the admin table
-- We assume the ID of the inserted user is 1 since we just truncated the table.
-- If the ID sequence didn't reset, you might need to check the ID first.
INSERT INTO "admin" ("authUserId")
SELECT id FROM "user" WHERE username = 'admin';
