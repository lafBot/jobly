const express = require('express');
const Job = require('../models/job_queries')
const ExpressError = require('../helpers/ExpressError');
const router = express.Router();
const checkAuth = require('../middleware/auth');
const { validate } = require('jsonschema');
const newJobSchema = require('../schemas/newJobSchema');
const updateJobSchema = require('../schemas/updateJobSchema')


router.post('/', async (req, res, next) => {
    try {
        const validation = validate(req.body, newJobSchema);
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }

        const job = await Job.createJob(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

router.get('/', checkAuth, async (req, res, next) => {
    try {
        const jobs = await Job.getJobs(req.query);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
})

router.get('/:id', checkAuth, async (req, res, next) => {
    try {
        const job = await Job.findJob(+req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
})

router.patch('/:id', async (req, res, next) => {
    try {
        const job = await Job.editJob(+req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
})

router.delete('/:id', async (req, res, next) => {
    try {
        const response = await Job.deleteJob(+req.params.id);
        return res.json({ "message": "Job deleted" });
    } catch (err) {
        return next(err);
    }
})

module.exports = router;