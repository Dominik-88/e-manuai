
# Fix: RLS policy breaking service record deletion and quick confirm

## Root Cause

The `servisni_zaznamy` table has a SELECT RLS policy with `USING (is_deleted = false)`. When a soft-delete UPDATE sets `is_deleted = true`, PostgreSQL evaluates the new row against SELECT policies and rejects it because `is_deleted = true` no longer satisfies the SELECT condition. This is why both single/bulk deletion and the quick confirm restart (which also creates new records) can fail.

## Fix

### 1. Database Migration -- Fix RLS on servisni_zaznamy

Drop and recreate the SELECT policy to allow all authenticated users to view all records (the app already filters `is_deleted = false` in every query):

```sql
DROP POLICY "Authenticated users can view servisni_zaznamy" ON servisni_zaznamy;
CREATE POLICY "Authenticated users can view servisni_zaznamy"
  ON servisni_zaznamy FOR SELECT TO authenticated
  USING (true);
```

This is safe because:
- Every query in the codebase already uses `.eq('is_deleted', false)`
- Admins may need to see deleted records for auditing
- It eliminates the conflict between SELECT and UPDATE policies

### 2. No code changes needed

The deletion logic (soft-delete via UPDATE) and quick confirm (INSERT) code is already correct -- the `user_id` is set properly and audit logging is fire-and-forget. The only issue was the RLS policy.

## Files to change
- Database migration only (1 SQL statement)
