\c jobly

DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS jobs;

CREATE TABLE companies (
    handle TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    num_employees INT,
    description TEXT,
    logo_url TEXT
);

CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    salary FLOAT NOT NULL,
    equity FLOAT NOT NULL CHECK(equity<=1),
    company_handle TEXT NOT NULL REFERENCES companies(handle) ON DELETE CASCADE,
    date_posted TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE TABLE users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    photo_url TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT(false)
);

INSERT INTO companies
VALUES ('SNA', 'Snap-on', 10000, 'Tool manufacturing company', 'http://sna-logo.com');