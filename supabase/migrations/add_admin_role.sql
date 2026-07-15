-- Migration to add ADMIN to user_role enum
-- First we need to drop the existing type, but to do that safely, we need to:
-- 1. Drop all policies on profiles table
-- 2. Drop default from role column
-- 3. Rename the existing type
-- 4. Create new type with ADMIN
-- 5. Alter tables to use new type
-- 6. Re-add default
-- 7. Drop old type
-- 8. Re-add all policies on profiles table
-- 9. Update the handle_new_user and is_admin_or_owner functions

-- Step 1: Drop all policies on profiles table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update attributes" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update attributes on table profiles" ON public.profiles;

-- Step 2: Drop default from role column
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- Step 3: Rename existing type
ALTER TYPE user_role RENAME TO user_role_old;

-- Step 4: Create new type with ADMIN
CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- Step 5: Alter profiles table to use new type
ALTER TABLE profiles 
  ALTER COLUMN role TYPE user_role 
  USING role::text::user_role;

-- Step 6: Re-add default
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'MEMBER'::user_role;

-- Step 7: Drop old type
DROP TYPE user_role_old;

-- Step 8: Re-add all policies on profiles table
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR select USING ( true );

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR update USING ( auth.uid() = id );

-- Step 9: Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  input_role text;
  assigned_role public.user_role;
BEGIN
  input_role := upper(trim(new.raw_user_meta_data->>'role'));
  
  IF input_role = 'OWNER' THEN
    assigned_role := 'OWNER'::public.user_role;
  ELSIF input_role = 'ADMIN' THEN
    assigned_role := 'ADMIN'::public.user_role;
  ELSE
    assigned_role := 'MEMBER'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
      new.id, 
      new.email, 
      coalesce(new.raw_user_meta_data->>'full_name', new.email),
      assigned_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Update is_admin_or_owner function
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (role = 'OWNER' OR role = 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
