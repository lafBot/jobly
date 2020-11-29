process.env.NODE_ENV = "TEST";
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { BCRYPT_WORK_FACTOR } = require('../../config');


let user1;

beforeEach(async () => {
    const password = await bcrypt.hash('Password1', BCRYPT_WORK_FACTOR);

    let user = await db.query(`
    INSERT INTO users
    (username, password, first_name, last_name, email, photo_url, is_admin)
    VALUES
    ('testUser', $1, 'Bob', 'Ross', 'BobRossArt@gmail.com', 'bob_art_url.com', True)
    RETURNING
    username, password, first_name, last_name, email, photo_url, is_admin
    `, [password]);

    const login = await request(app)
        .post('/login')
        .send({
            username: "testUser",
            password: "Password1"
        });
    
    user1 = user.rows[0];

    user1.userToken = login.body.token;
    user1.currentUsername = jwt.decode(user1.userToken).username;
});

describe('GET /users', () => {
    test('Get all users', async () => {
        let resp = await request(app).get('/users');

        expect(resp.statusCode).toBe(200);
        expect(resp.body.users.length).toBe(1);
        expect(resp.body.users[0]).toHaveProperty("username");
    });

    test('Get specific user by username', async () => {
        let resp = await request(app).get('/users/testUser');

        expect(resp.statusCode).toBe(200);
        expect(resp.body.user.username).toBe("testUser");
        expect(resp.body.user).toHaveProperty("first_name");
    });

    test('Invalid username retrieval attempt', async () => {
        let resp = await request(app).get('/users/invalid');

        expect(resp.statusCode).toBe(404);
    });

});

describe('PATCH /users', () => {
    test('Allows for edit to user info', async () => {
        const resp = await request(app).patch(`/users/${user1.currentUsername}`).send({
            "username": "BobbyRoss",
            "first_name": "Bobby",
            "_token": `${user1.userToken}`
        });
        expect(resp.statusCode).toBe(200);
        expect(resp.body.user.username).toBe("BobbyRoss");
        expect(resp.body.user.first_name).toBe("Bobby");
    });

    test('Throws error for invalid edit to username info', async () => {
        const resp = await request(app).patch(`/users/invalid`).send({
            "username": "BobbyRoss",
            "first_name": "Bobby",
            "_token": `${user1.userToken}`
        });

        expect(resp.statusCode).toBe(401);
    });

    test('Throws error for invalid edit to user info', async () => {
        const resp = await request(app).patch(`/users/${user1.currentUsername}`).send({
            "username": 12345,
            "first_name": "Bobby",
            "_token": `${user1.userToken}`
        });

        expect(resp.statusCode).toBe(400);
    });

    describe('DELETE /user', () => {
        test('Deletes a specified user', async () => {
            const resp = await request(app).delete(`/users/${user1.currentUsername}`).send({ _token: `${user1.userToken}` });
    
            expect(resp.statusCode).toBe(200);
            expect(resp.body.message).toBe("User deleted");
        });
    
        test('Returns error for invalid user DELETE request', async () => {
            const resp = await request(app).delete(`/users/invalid`);
    
            expect(resp.statusCode).toBe(401);
        });
    });
});

afterEach(async () => {
    await db.query('DELETE FROM users')
});

afterAll(async () => {
    await db.end();
});