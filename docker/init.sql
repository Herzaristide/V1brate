-- Initialize V1brate Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a default schema comment
COMMENT ON SCHEMA public IS 'V1brate application schema';

-- You can add any additional initialization SQL here
