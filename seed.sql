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

INSERT INTO companies
VALUES ('SNA', 'Snap-on', 10000, 'Tool manufacturing company', 'http://sna-logo.com');