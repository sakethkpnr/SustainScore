CREATE DATABASE IF NOT EXISTS sustainscore_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sustainscore_db;

-- Application tables are created by SQLAlchemy when the FastAPI backend starts.
-- This script creates the database and selects it for the application.
