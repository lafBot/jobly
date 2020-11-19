const { SSL_OP_NETSCAPE_CA_DN_BUG } = require('constants');
const express = require('express');
const ExpressError = require('../helpers/ExpressError');
const router = express.Router();
// const { authRequired, adminRequire } = require('../middleware/auth.js');
const Company = require('../models/company_queries');
const { validate } = require('jsonschema');
const updateCompanySchema = require('../schemas/updateCompanySchema')
const newCompanySchema = require('../schemas/newCompanySchema')

// get all companies with possible parameters
router.get('/', async (req, res, next) => {
    try {
        const companies = await Company.getAll(req.query);
        return res.json({ companies });
    } catch (err) {
        return next(err);
    }
});

// create a new company
router.post('/', async (req, res, next) => {
    try {
        const validation = validate(req.body, newCompanySchema);
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }
        
        const { handle, name, num_employees, description, logo_url } = req.body;
        const company = await Company.createCompany(handle, name, num_employees, description, logo_url);
        return res.json({ company });
    } catch (err) {
        return next(err);
    }
})


// find individual company by handle
router.get('/:handle', async (req, res, next) => {
    try {
        const company = await Company.getCompany(req.params.handle);
        return res.json({ company });
    } catch(err) {
        return next(err);
    }
})

router.patch('/:handle', async (req, res, next) => {
    try {
        const validation = validate(req.body, updateCompanySchema);

        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }

        const data = req.body;
        const handle = req.params.handle;
        const company = await Company.editCompany(handle, data);
        return res.json({ company });
    } catch(err) {
        return next(err);
    }
})

router.delete('/:handle', async (req, res, next) => {
    try {
        const handle = req.params.handle;
        await Company.deleteCompany(handle);
        return res.json({ "message": "Company deleted"});
    } catch (err) {
        return next(err);
    }
})

module.exports = router