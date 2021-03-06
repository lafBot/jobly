process.env.NODE_ENV = "TEST";
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { BCRYPT_WORK_FACTOR } = require('../../config');

let company1;
let company2;
let user1;

beforeEach(async () => {
    let resp = await db.query(`
    INSERT INTO companies
    (handle, name, num_employees, description, logo_url)
    VALUES
    ('SNA',
    'Snap-on',
    2000,
    'Tool manufacture and distributor',
    'https://SNA_logo.jpg')
    RETURNING
    handle, name, num_employees, description, logo_url`);
    company1 = resp.rows[0];

    let resp2 = await db.query(`
    INSERT INTO companies
    (handle, name, num_employees, description, logo_url)
    VALUES
    ('PFE',
    'Pfizer Inc',
    10000,
    'Pharmaceutical company',
    'https://PFE_logo.jpg')
    RETURNING
    handle, name, num_employees, description, logo_url`);
    company2 = resp2.rows[0];

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
})

describe('GET /companies', () => {
    test('Returns the handle and name for all companies', async () => {
        const resp = await request(app).get('/companies');

        expect(resp.statusCode).toBe(200);
        expect(resp.body.companies.length).toBe(2);
        expect(resp.body.companies[0]).toHaveProperty("handle");
        expect(resp.body.companies[0]).toHaveProperty("name");
    });

    test('should return a filtered list of handles and names', async () => {
        const resp = await request(app).get('/companies?search=Snap-on');

        expect(resp.statusCode).toBe(200);
        expect(resp.body.companies[0]).toEqual(
            { "handle": company1.handle,
                "name": company1.name })
    });

    test('should return the test company with less than the maximum specified employees', async () => {
        const resp = await request(app).get('/companies?max_employees=5000');

        expect(resp.statusCode).toBe(200);
        expect(resp.body.companies[0]).toEqual(
            { "handle": company1.handle,
                "name": company1.name }
        )
    });

    test('should return the test company with more than the minimum specified employees', async () => {
        const resp = await request(app).get('/companies?min_employees=5000');

        expect(resp.statusCode).toBe(200);
        expect(resp.body.companies[0]).toEqual(
            { "handle": company2.handle,
                "name": company2.name }
        )
    });

    test('GET specific company', async () => {
        const resp = await request(app).get(`/companies/${company1.handle}`).send({ _token: `${user1.userToken}` });

        expect(resp.statusCode).toBe(200);
        expect(resp.body.company).toHaveProperty("handle");
        expect(resp.body.company).toHaveProperty("name");
        expect(resp.body.company).toHaveProperty("description");
        expect(resp.body.company).toHaveProperty("logo_url");
        expect(resp.body.company).toHaveProperty("num_employees");
        expect(resp.body.company).toHaveProperty("jobs");
    });

});


describe('POST /companies', () => {
    test('Creates new company with valid req body', async () => {
        const resp = await request(app).post('/companies').send({
            "handle": "Merpy",
            "name": "Derpy",
            "num_employees": 999,
            "description": "A derpyy developer",
            "logo_url": "https://derpy-logo.jpg",
            _token: `${user1.userToken}`
        });

        expect(resp.statusCode).toBe(200);
        expect(resp.body.company).toHaveProperty('handle');
    });

    test('Invalid attempt to create company', async () => {
        const resp = await request(app).post('/companies').send({
            "num_employees": "Merpy",
            _token: `${user1.userToken}`
        });

        expect(resp.statusCode).toBe(400);
    });

});

describe('PATCH /companies', () => {
    test('Allows for edit to company info', async () => {
        const resp = await request(app).patch(`/companies/SNA`).send({
            "handle": "SNA",
            "name": "patched",
            "num_employees": 999,
            "description": "A tool manufacturing and sales company",
            "logo_url": "https://snap-on-logo.jpg",
            _token: `${user1.userToken}`
        });

        expect(resp.statusCode).toBe(200);
        expect(resp.body.company.name).toBe("patched");
        expect(resp.body.company.handle).not.toBe(null);
    });

    test('Throws error for invalid edit to company info', async () => {
        const resp = await request(app).patch(`/companies/SNA`).send({
            "handle": "SNA",
            "name": 999,
            "num_employees": "thow me an error",
            "description": "A tool manufacturing and sales company",
            "logo_url": "https://snap-on-logo.jpg",
            _token: `${user1.userToken}`
        });

        expect(resp.statusCode).toBe(400);
    });
});

describe('DELETE /companies', () => {
    test('Deletes a specified company', async () => {
        const resp = await request(app).delete(`/companies/${company1.handle}`).send({ _token: `${user1.userToken}` });

        expect(resp.statusCode).toBe(200);
    });

    test('Returns error for invalid company DELETE request', async () => {
        const resp = await request(app).delete(`/companies/invalid`).send({ _token: `${user1.userToken}` });

        expect(resp.statusCode).toBe(404);
    });
});

afterEach(async () => {
    await db.query('DELETE FROM companies')
    await db.query('DELETE FROM users')
})

afterAll(async () => {
    await db.end();
})