process.env.NODE_ENV = "TEST";
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");

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

    // let resp2 = await db.query(`
    // INSERT INTO companies
    // (handle, name, num_employees, description, logo_url)
    // VALUES
    // ('PFE',
    // 'Pfizer Inc',
    // 10000,
    // 'Pharmaceutical company',
    // 'https://PFE_logo.jpg')
    // RETURNING
    // handle, name, num_employees, description, logo_url`);
    // company2 = resp2.rows[0];
})

describe('POST /jobs', () => {
    test('Create job for company listing', async () => {
        const resp = await request(app).post(`/jobs`).send({
            "title": "Full-Stack Developer",
            "salary": 90000.01,
            "equity": 0.02,
            "company_handle": company1.handle
        });

        expect(resp.statusCode).toBe(201);
        expect(resp.body.title).toBe("Full-Stack Developer");
        expect(resp.body.salary).toBe(90000.01);
        expect(resp.body.equity).toBe(0.02);
        expect(resp.body.company_handle).toBe("SNA");
        expect(resp.body.date_posted).not.toBe(null);
    });
});

afterEach(async () => {
    await db.query('DELETE FROM companies')
    await db.query('DELETE FROM jobs')
})

afterAll(async () => {
    await db.end();
})