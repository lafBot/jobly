const db = require('../db');
const ExpressError = require('../helpers/ExpressError');
const sqlForPartialUpdate = require('../helpers/partialUpdate');
const bcrypt = require("bcrypt");
const { SECRET_KEY } = require('../config');
const { BCRYPT_WORK_FACTOR } = require('../config');



class User {
    static async checkAuth(data) {

        const resp = await db.query(`
        SELECT username, password, first_name, last_name, email, photo_url, is_admin
        FROM users
        WHERE username = $1`,
        [data.username]);

        const user = resp.rows[0];

        if (user) {
            const validity = await bcrypt.compare(data.password, user.password);
            if (validity) {
                return user;
            }
        } else {
            throw new ExpressError('Invalid username/password combination.', 401);
        }
    }

    static async createUser(data) {
        const availableUsername = await db.query(
            `SELECT username 
              FROM users 
              WHERE username = $1`,
            [data.username]
        );
      
        if (availableUsername.rows[0]) {
            throw new ExpressError(`The username '${data.username} has already been taken.  Please try a new one.`, 400);
        };

        const password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);

        const resp = await db.query(`
        INSERT INTO users
        (username, password, first_name, last_name, email, photo_url, is_admin)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
        username, password, first_name, last_name, email, photo_url, is_admin`,
        [data.username, password, data.first_name, data.last_name, data.email, data.photo_url, data.is_admin]);
        return resp.rows[0];
    }

    static async getUsers() {
        const users = await db.query(`
        SELECT username, first_name, last_name, email, photo_url
        FROM users`);
        return users.rows;
    }


    static async findUser(username) {
        const user = await db.query(`
        SELECT username, first_name, last_name, email, photo_url
        FROM users
        WHERE username=$1`,
        [username]);

        if (user.rows.length == 0) {
            throw new ExpressError("Invalid username.", 404);
        }
        return user.rows[0];
    }

    static async editUser(username, data) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
        }

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