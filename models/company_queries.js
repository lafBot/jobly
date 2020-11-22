// Company related queries

const db = require('../db');
const ExpressError = require('../helpers/ExpressError');
const sqlForPartialUpdate = require('../helpers/partialUpdate')

class Company {
    static async getAll(params) {
        let whereExpressions = [];
        let queryValues = [];

        if (+params.min_employees >= +params.max_employees) {
            throw new ExpressError(`Invalid min/max employee parameter request`, 400);
        }

        if (params.search) {
            queryValues.push(`%${params.search}%`);
            whereExpressions.push(`name ILIKE $${queryValues.length}`);
        }

        if (params.min_employees) {
            queryValues.push(+params.min_employees);
            whereExpressions.push(`num_employees >= $${queryValues.length}`);
        }

        if (params.max_employees) {
            queryValues.push(+params.max_employees);
            whereExpressions.push(`num_employees <= $${queryValues.length}`);
        }

        let query = `SELECT handle, name FROM companies`
        if (whereExpressions.length > 0) {
            query += " WHERE ";
            query += whereExpressions.join(" AND ");
        }

        const resp = await db.query(query, queryValues);
        if (resp.rows.length == 0) {
            return "There are no companies within these parameters, try expanding your search criteria"
        }
        return resp.rows;
    };

    static async createCompany(handle, name, num_employees, description, logo_url) {
        const checkDuplicate = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`,
        [handle])
        if (checkDuplicate.rows[0]) {
            throw new ExpressError(`
            Error: The company handle '${handle}' is already being used`, 400);
        }

        const resp = await db.query(`
        INSERT INTO companies
        (handle, name, num_employees, description, logo_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING handle, name, num_employees, description, logo_url`,
        [handle, name, num_employees, description, logo_url]);

        return resp.rows[0];
    };

    static async getCompany(handle) {
        const comp = await db.query(`
        SELECT handle, name, num_employees, description, logo_url
        FROM companies
        WHERE handle=$1`,
        [handle]);

        if (!comp.rows[0]) {
            throw new ExpressError(`Invalid company handle`, 404);
        }

        const jobs = await db.query(`
        SELECT id, title, salary, equity
        FROM jobs
        WHERE company_handle=$1`,
        [handle]);

        let company = comp.rows[0];
        company.jobs = jobs.rows;
        return { company };
    };

    static async editCompany(handle, data) {
        const checkValid = await db.query(`
        SELECT * FROM companies WHERE handle=$1`, [handle]);

        if (!checkValid.rows[0]) {
            throw new ExpressError(`Invalid company handle ${handle}`, 404);
        }

        let { query, values } = sqlForPartialUpdate(
            "companies",
            data,
            "handle",
            handle
        )

        const resp = await db.query(query, values);
        return resp.rows[0];
    }

    static async deleteCompany(handle) {
        const resp = await db.query(`
        DELETE from companies
        WHERE handle=$1
        RETURNING handle`,
        [handle]);

        if (resp.rows.length === 0) {
            throw new ExpressError(`The company handle '${handle}' does not exist`, 404);
          }
        }
}

module.exports = Company;