@echo off
cls
echo ========================================
echo   Fixing Migration Issue
echo ========================================
echo.
echo Your schema has been updated!
echo Now running the migration...
echo.
pause

cd backend

echo Step 1: Generating Prisma Client...
call npx prisma generate

echo.
echo Step 2: Running Migration (this will work now!)...
call npx prisma migrate dev --name init

echo.
echo Step 3: Seeding Database...
call node prisma/seed.js

echo.
echo ========================================
echo   Migration Complete!
echo ========================================
echo.
echo Next: Test your backend
echo Run: npm start
echo.
pause
