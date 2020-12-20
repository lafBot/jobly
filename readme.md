# Jobly

Jobly is a job searching and reservation platform

## Installation

Use the npm package manager to initialize and install Jobly requirements.

```bash
npm init -y
npm install
```

You also must create a database name ***jobly*** and seed the database while in the directory containing your seed file for the application to work.

```bash
createdb jobly
psql < seed.sql
```

## Testing
I recommend running consecutively:
```bash
jest --runInBand
```