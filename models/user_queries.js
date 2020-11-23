const db = require('../db');
const ExpressError = require('../helpers/ExpressError');
const sqlForPartialUpdate = require('../helpers/partialUpdate');
const bcrypt = require("bcrypt");
const BCRYPT_WORK_FACTOR = 10;



class User {
    static async createUser(data) {
        const resp = await db.query(`
        INSERT INTO users
        (username, password, first_name, last_name, email, photo_url, is_admin)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
        username, password, first_name, last_name, email, photo_url, is_admin`,
        [data.username, data.password, data.first_name, data.last_name, data.email, data.photo_url, data.is_admin]);
        return resp.rows[0];
    }

    static async getUsers() {
        const users = await db.query(`
        SELECT username, first_name, last_name, email, photo_url
        FROM users`);
        return users.rows;
    }

    static async editUser(username, data) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
        }

        const checkValid = await db.query(`
        SELECT * FROM users WHERE username=$1`,
        [username]);

        let { query, values } = sqlForPartialUpdate(
            "users",
            data,
            "username",
            username
        )

        const resp = await db.query(query, values);


        if (!resp.rows[0]) {
            throw new ExpressError(`There exists no user '${username}'`, 404);
        }
        const user = resp.rows[0];

        delete user.password;
        delete user.is_admin;

        return resp.rows[0];
    }

    static async deleteUser(username) {
        const resp = await db.query(`
        DELETE from users
        WHERE username=$1
        RETURNING first_name`,
        [username]);

        if (resp.rows.length === 0) {
            throw new ExpressError(`The user with the username of '${username}' does not exist`, 404);
        }
    }
}


module.exports = User