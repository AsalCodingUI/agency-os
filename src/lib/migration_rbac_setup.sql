-- 1. Truncate Table
TRUNCATE TABLE public.employees CASCADE;

-- 2. Create ENUM Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('STAKEHOLDER', 'EMPLOYEE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_title_enum AS ENUM ('FOUNDER', 'PROJECT_MANAGER', 'UI_UX_DESIGNER', 'FRONTEND_DEV', 'BACKEND_DEV');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Alter Table Structure (Drop old, Add new with Defaults)
ALTER TABLE public.employees 
DROP COLUMN IF EXISTS role,
DROP COLUMN IF EXISTS job_title;

ALTER TABLE public.employees 
ADD COLUMN role user_role DEFAULT 'EMPLOYEE',
ADD COLUMN job_title job_title_enum;

-- 4. Insert Data from auth.users
-- Now 'role' will default to 'EMPLOYEE'
INSERT INTO public.employees (id, email, name, status, hourly_rate, created_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', email) as name,
  'AVAILABLE' as status,
  0 as hourly_rate,
  created_at
FROM auth.users;

-- 5. Update Specific Users
-- Admin & Bagas -> STAKEHOLDER
UPDATE public.employees 
SET role = 'STAKEHOLDER', job_title = 'FOUNDER' 
WHERE email IN ('admin@kretyastudio.com', 'bagasivan@gmail.com');

-- Farah -> PROJECT_MANAGER
UPDATE public.employees 
SET role = 'EMPLOYEE', job_title = 'PROJECT_MANAGER' 
WHERE email = 'farahintanmd@gmail.com';

-- Others -> Designers (Defaulting to UI_UX_DESIGNER for now)
UPDATE public.employees 
SET job_title = 'UI_UX_DESIGNER' 
WHERE job_title IS NULL;


-- 6. Create Tables if not exist

-- leave_requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.employees(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status leave_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);


-- 7. RLS Policies (Zero Trust)

-- Enable RLS on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;

-- Employees Table Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.employees;
CREATE POLICY "Users can read own profile" ON public.employees FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Stakeholders can read all profiles" ON public.employees;
CREATE POLICY "Stakeholders can read all profiles" ON public.employees FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.employees WHERE id = auth.uid() AND role = 'STAKEHOLDER')
);

-- Attendance Sessions Policies
DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance_sessions;
CREATE POLICY "Users can insert own attendance" ON public.attendance_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own attendance" ON public.attendance_sessions;
CREATE POLICY "Users can update own attendance" ON public.attendance_sessions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can select own attendance" ON public.attendance_sessions;
CREATE POLICY "Users can select own attendance" ON public.attendance_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Stakeholders can select all attendance" ON public.attendance_sessions;
CREATE POLICY "Stakeholders can select all attendance" ON public.attendance_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.employees WHERE id = auth.uid() AND role = 'STAKEHOLDER')
);

-- Leave Requests Policies
DROP POLICY IF EXISTS "Users can insert own leave" ON public.leave_requests;
CREATE POLICY "Users can insert own leave" ON public.leave_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can select own leave" ON public.leave_requests;
CREATE POLICY "Users can select own leave" ON public.leave_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Stakeholders can select all leave" ON public.leave_requests;
CREATE POLICY "Stakeholders can select all leave" ON public.leave_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.employees WHERE id = auth.uid() AND role = 'STAKEHOLDER')
);

DROP POLICY IF EXISTS "Stakeholders can update leave status" ON public.leave_requests;
CREATE POLICY "Stakeholders can update leave status" ON public.leave_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.employees WHERE id = auth.uid() AND role = 'STAKEHOLDER')
);

-- Payrolls Policies (Note: Table is 'payrolls')
DROP POLICY IF EXISTS "Users can select own payroll" ON public.payrolls;
CREATE POLICY "Users can select own payroll" ON public.payrolls FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Stakeholders can select all payroll" ON public.payrolls;
CREATE POLICY "Stakeholders can select all payroll" ON public.payrolls FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.employees WHERE id = auth.uid() AND role = 'STAKEHOLDER')
);
