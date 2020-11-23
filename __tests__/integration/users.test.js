process.env.NODE_ENV = "TEST";
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");


beforeEach(async () => {
    let resp = await db.query(`
    
    `)



}




afterEach(async () => {
    await db.query('DELETE FROM companies')
    await db.query('DELETE FROM jobs')
})

afterAll(async () => {
    await db.end();
})