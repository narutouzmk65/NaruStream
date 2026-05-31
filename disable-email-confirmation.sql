-- Disable email confirmation in Supabase
-- Run this in your Supabase SQL Editor

UPDATE auth.config 
SET value = 'false' 
WHERE key = 'enable_signup_email_confirm';

-- Also disable email links
UPDATE auth.config 
SET value = 'false' 
WHERE key = 'enable_email_signup';
