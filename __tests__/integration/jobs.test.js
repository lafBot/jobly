process.env.NODE_ENV = "TEST";
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");

let company1;
let job1;
let job2;

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
    INSERT INTO jobs
    (title, salary, equity, company_handle)
    VALUES
    ('Salesman', 100000, 0.10, 'SNA')
    RETURNING
    id, title, salary, equity, company_handle, date_posted`);
    job1 = resp2.rows[0];

    let resp3 = await db.query(`
    INSERT INTO jobs
    (title, salary, equity, company_handle)
    VALUES
    ('Sales Assistant', 50000, 0.02, 'SNA')
    RETURNING
    id, title, salary, equity, company_handle, date_posted`);
    job2 = resp3.rows[0];
})

describe('GET /jobs', () => {
    test('Get all jobs', async () => {
        const resp = await request(app).get(`/jobs`)

        expect(resp.statusCode).toBe(200);
        expect(resp.body.jobs[0]).toHaveProperty("title");
        expect(resp.body.jobs[0].date_posted).not.toBe(null);
        expect(resp.body.jobs.length).toBe(2);
    });

    test('Get jobs with minimum salary of 90K', async () => {
        const resp = await request(app).get(`/jobs?min_salary=90000`)

        expect(resp.statusCode).toBe(200);
        expect(resp.body.jobs[0]).toHaveProperty("title");
        expect(resp.body.jobs[0].salary).toBe(job1.salary);
    });

    test('Get jobs with minimum equity position of 0.05', async () => {
        const resp = await request(app).get(`/jobs?min_equity=0.03`)

        expect(resp.statusCode).toBe(200);
        expect(resp.body.jobs[0]).toHaveProperty("title");
        expect(resp.body.jobs[0].equity).toBe(job1.equity);
    });

    test('Get jobs with title "Salesman"', async () => {
        const resp = await request(app).get(`/jobs?search=Salesman`)

        expect(resp.statusCode).toBe(200);
        expect(resp.body.jobs.length).toBe(1);
        expect(resp.body.jobs[0].salary).toBe(job1.salary);
    });

});

describe('GET /jobs/:id', () => {
    test('Get specific job posting by id', async () => {
        const resp = await request(app).get(`/jobs/${job1.id}`)

        expect(resp.statusCode).toBe(200);
        expect(resp.body.job).toHaveProperty("title");
        expect(resp.body.job).toHaveProperty("salary");
        expect(resp.body.date_posted).not.toBe(null);
    });
});

describe('POST /jobs', () => {
    test('Create job for company listing', async () => {
        const resp = await request(app)
            .post(`/jobs`)
            .send({
                "title": "Sales Assistant",
                "salary": 40000.01,
                "equity": 0.02,
                "company_handle": company1.handle
        });

        expect(resp.statusCode).toBe(201);
        expect(resp.body.job.title).toBe("Sales Assistant");
        expect(resp.body.job.salary).toBe(40000.01);
        expect(resp.body.job.equity).toBe(0.02);
        expect(resp.body.job.company_handle).toBe(company1.handle);
        expect(resp.body.job.date_posted).not.toBe(null);
    });
});

describe('PATCH /jobs', () => {
    test('Allows for edit to job info', async () => {
        const resp = await request(app).patch(`/jobs/${job1.id}`).send({
            "title": "Sales Manager",
            "salary": 200000
        });
        expect(resp.statusCode).toBe(200);
        expect(resp.body.job.title).toBe("Sales Manager");
        expect(resp.body.job.salary).toBe(200000);
    });

    test('Throws error for invalid edit to company info', async () => {
        const resp = await request(app).patch(`/companies/${job1.id}`).send({
            "title": 9000,
            "salary": "Invalid"
        });

        expect(resp.statusCode).toBe(400);
    });
});

describe('DELETE /job', () => {
    test('Deletes a specified job', async () => {
        const resp = await request(app).delete(`/jobs/${job1.id}`);

        expect(resp.statusCode).toBe(200);
        expect(resp.body.message).toBe("Job deleted");
    });

    test('Returns error for invalid job DELETE request', async () => {
        const resp = await request(app).delete(`/jobs/1`);

        expect(resp.statusCode).toBe(404);
    });
});

afterEach(async () => {
    await db.query('DELETE FROM companies')
    await db.query('DELETE FROM jobs')
})

afterAll(async () => {
    await db.end();
})