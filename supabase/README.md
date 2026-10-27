# Supabase Database Migration & Security Guide — Hostel Management System

This directory contains the hardened PostgreSQL database migration schema, security verification test scripts, and architectural design for your College Hostel Management System.

---

## 📁 Files in this directory

1. [001_initial_schema.sql](file:///Users/vinaykorde/Desktop/DTIL/supabase/migrations/001_initial_schema.sql): The complete, hardened PostgreSQL schema with all 11 tables, constraints, indexes, triggers, search_path security, and Row Level Security (RLS) policies.
2. [verification_queries.sql](file:///Users/vinaykorde/Desktop/DTIL/supabase/verification_queries.sql): Comprehensive SQL test queries you can run in the Supabase SQL Editor to verify tables, RLS enforcement, role escalation guards, and workflow triggers.

---

## 🔒 Security Hardening Summary (Fixes for Issues 1 – 8)

| Issue # | Vulnerability Fixed | How It Was Hardened |
| :--- | :--- | :--- |
| **1. Profile Privacy** | Full profiles (including phone, address, emergency contact, pending fees, and face photos) were exposed to any user querying `roommate_status = 'Looking'`. | Removed `roommate_status = 'Looking'` from the `profiles` SELECT policy. Profiles are strictly private (`id = auth.uid() OR is_staff()`). Roommate discovery is isolated to an authorized RPC function (`get_compatible_roommates()`) and security view (`available_roommates`) that **only returns students in the same hostel** and **exposes only non-sensitive compatibility preferences** (sleep, study, cleanliness, food, light). |
| **2. Profile Updates** | Students could alter their own role, student ID, hostel/room assignment, account status, attendance rate, fees, or reference face photo path. | Created `enforce_profile_update_security()` trigger. Blocks students from modifying institutional, financial, or biometric fields. Only personal (`phone`, `address`, `emergency_contact`) and roommate preference fields are editable. Wardens cannot alter roles or modify other staff profiles. |
| **3. Attendance Integrity** | Students had direct `INSERT` permissions on `attendance_records` and `presence_records`, allowing arbitrary attendance forgery. | **Removed direct student INSERT permissions on both tables.** Official attendance can only be recorded via the server-side verification engine (`service_role`) or authorized staff override. Added database Haversine geofence calculation. |
| **4. Leave & Visitors** | Students could insert pre-approved leave requests (`status = 'Approved'`) or checked-in visitors, and staff could approve their own requests. | Added `enforce_leave_request_security()` and `enforce_visitor_security()` triggers. Student inserts are forced to `'Pending'` (leave) and `'Expected'` (visitors). Students can only cancel their own pending items. Reviewer fields are stamped automatically and staff cannot self-approve. |
| **5. Database Functions** | `SECURITY DEFINER` functions lacked `SET search_path`, exposing them to schema hijacking, and had unconstrained execution privileges. | All `SECURITY DEFINER` functions now explicitly enforce `SET search_path = public, pg_temp;`. Function execution privileges are revoked from `PUBLIC` and granted strictly by role. Role queries run without recursive RLS. |
| **6. Role Assignment** | Risk of self-promotion during registration or unauthorized promotion. | `handle_new_user()` trigger strictly hardcodes `role = 'student'` on public signup, ignoring client metadata. Created `admin_set_user_role()` function allowing only authenticated administrators to promote accounts, with last-admin lockout prevention. |
| **7. Hostel Settings** | Geofence coordinates and thresholds must not be altered or replaced with unconfirmed locations. | Existing hostel coordinates (`18.5204000`, `73.8567000`, radius `100m`, max accuracy `50m`) are preserved as defaults. No unconfirmed hostel rows are inserted. |
| **8. Migration Safety** | Migration was not safe to run more than once (duplicate policy and trigger errors). | Added `IF NOT EXISTS` for all 11 tables and indexes, `DROP POLICY IF EXISTS` for all 23 policies, and `DROP TRIGGER IF EXISTS` for all triggers. Completely idempotent and non-destructive. |

---

## 🚀 Step-by-Step: How to Run the Migration in Supabase

> **NOTE:** Do not run these steps until you are ready to deploy to your Supabase project.

### Step 1: Open Supabase SQL Editor
1. Log in to [Supabase](https://supabase.com/dashboard).
2. Click on your project (`twijezwruonhqqpxbhiz`).
3. In the left sidebar, click **SQL Editor** (`>_`).

### Step 2: Paste and Run the Migration
1. Click **New Query** (`+`).
2. Copy the full content of [001_initial_schema.sql](file:///Users/vinaykorde/Desktop/DTIL/supabase/migrations/001_initial_schema.sql).
3. Paste into the editor and click **Run**.
4. You will see: `Success. No rows returned`.

### Step 3: Run the Verification Test Suite
1. Open another query tab.
2. Copy the queries from [verification_queries.sql](file:///Users/vinaykorde/Desktop/DTIL/supabase/verification_queries.sql).
3. Run the checks to verify that:
   - All 11 tables have `rowsecurity = true`.
   - All policies are active.
   - All `SECURITY DEFINER` functions have `search_path=public, pg_temp`.

---

## 🛡️ Secure Attendance Verification: Server-Side Architecture & Setup Steps

### Why Frontend Verification Alone is Insecure
In a client-only architecture, an attacker can open browser developer tools or send raw HTTP requests to Supabase with fabricated data (e.g. `{ verified: true, latitude: 18.5204 }`). Because the client cannot be trusted:
1. The student client **never** inserts directly into `attendance_records`.
2. Attendance is recorded **only** after an independent server runtime verifies:
   - Live selfie biometric match against the private reference face photo stored in Supabase Storage.
   - Device GPS against the hostel geofence using the Haversine formula.
   - Duplicate submission check for the day.

### Architecture Flow

```
[Student Device]
       │
       │ 1. POST /functions/v1/verify-attendance
       │    Body: { liveImage, latitude, longitude, accuracy }
       │    Header: Authorization: Bearer <Student_JWT>
       ▼
[Supabase Edge Function (Deno Runtime)]
       │
       │ 2. Authenticate student via supabase.auth.getUser()
       │ 3. Fetch reference face from Private Storage ('faces/' bucket)
       │ 4. Run biometric neural model server-side (compare descriptors)
       │ 5. Retrieve hostel coordinates from public.hostels
       │ 6. Calculate Haversine distance independently
       │ 7. Check if accuracy <= max_accuracy AND distance <= radius
       │
       │ 8. Call record_system_verified_attendance(...) using SERVICE_ROLE
       ▼
[PostgreSQL Database (Supabase)]
       │
       ├── Both Pass:  Insert 'Present' into attendance_records
       │               Insert 'PRESENT' into presence_records audit log
       │
       └── Either Fail: Insert 'REJECTED' into presence_records with reason
                       attendance_records remains unchanged
```

### Next Setup Step: Provisioning the Edge Function

When you are ready to connect live attendance verification to your backend:

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```
2. **Link your Supabase project**:
   ```bash
   supabase link --project-ref twijezwruonhqqpxbhiz
   ```
3. **Deploy Edge Functions**:
   ```bash
   # Attendance biometric verification
   supabase functions deploy verify-attendance

   # Administrative student user creation
   supabase functions deploy create-student-accounts
   ```
4. **Set Environment Secrets**:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### 3. Student Account Creation Engine

Admin accounts can provision multiple student login accounts simultaneously:
1. **Interactive Table / Batch Entry Modal**: Accessible from the Admin Student Directory (`/admin/students`).
2. **Server-Side Security**:
   - In local development, handled by the Vite Node.js middleware (`/api/admin/create-students`).
   - In production, handled by the Supabase Edge Function (`create-student-accounts`).
   - Generates Supabase Auth users with `email_confirm: true` so students can log in immediately.
   - Automatically synchronizes records in `public.profiles` (`profiles.id = auth.users.id`).
   - Enforces unique email and student ID constraints, preventing duplicate account creation.
