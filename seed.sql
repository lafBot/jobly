\c jobly

CREATE TABLE companies (
    handle TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    num_employees INT,
    description TEXT,
    logo_url TEXT
);

