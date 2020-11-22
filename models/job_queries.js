const db = require('../db');
const ExpressError = require('../helpers/ExpressError');
const partialUpdate = require('../helpers/partialUpdate');


class Job {
    static async createJob(data) {
        const resp = await db.query(`
        INSERT INTO jobs
        (title, salary, equity, company_handle)
        VALUES
        ($1, $2, $3, $4)
        RETURNING
        id, title, salary, equity, company_handle, date_posted`,
        [data.title, data.salary, data.equity, data.company_handle]);
        return resp.rows[0];
    }

    static async getJobs(params) {
        let whereExpressions = [];
        let queryValues = [];

        if (params.search) {
            queryValues.push(`%${params.search}%`);
            whereExpressions.push(`title ILIKE $${queryValues.length}`);
        }

        if (params.min_salary) {
            queryValues.push(+params.min_salary);
            whereExpressions.push(`salary >= $${queryValues.length}`);
        }

        if (params.min_equity) {
            queryValues.push(+params.min_equity);
            whereExpressions.push(`equity >= $${queryValues.length}`);
        }

        let query = `SELECT title, company_handle, equity, salary FROM jobs`
        if (whereExpressions.length > 0) {
            query += " WHERE ";
            query += whereExpressions.join(" AND ");
        }

        const resp = await db.query(query, queryValues);
        if (resp.rows.length == 0) {
            return "There are no jobs within these parameters, try expanding your search criteria"
        }
        return resp.rows;
    }

    static async findJob(id) {
        const resp = await db.query(
            `SELECT title, salary, equity, company_handle, date_posted, name, num_employees, description
            FROM jobs as j
            JOIN companies AS c
            ON c.handle = j.company_handle
            WHERE j.id=$1`,
            [id]);
        return resp.rows[0];
    }

    static async editJob(id, data) {
        const query = partialUpdate("jobs", data, "id", id);
        const resp = await db.query(query.query, query.values);
        return resp.rows[0];
    }

    static async deleteJob(id) {
        const resp = await db.query(`
        DELETE FROM jobs
        WHERE id=$1
        RETURNING title`, [id]);
        if (resp.rows.length == 0) {
            throw new ExpressError("Job posting does not exist", 404);
        }
    }

}





module.exports = Job