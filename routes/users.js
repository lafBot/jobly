const express = require('express');
const User = require('../models/user_queries')
const ExpressError = require('../helpers/ExpressError');
const router = express.Router();
const { validate } = require('jsonschema');
const newUserSchema = require('../schemas/newUserSchema');
const updateUserSchema = require('../schemas/updateUserSchema');
const { checkCorrectUser } = require('../middleware/auth');
const createToken = require('../helpers/createToken');


router.post('/', async (req, res, next) => {
    try {
        const validation = validate(req.body, newUserSchema);
        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }

        const user = await User.createUser(req.body);
        const token = await createToken(user);
        return res.status(201).json({ token });
    } catch (err) {
        return next(err);
    }
});

router.get('/', async (req, res, next) => {
    try {
        const users = await User.getUsers();
        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});

router.get('/:username', async (req, res, next) => {
    try {
        const user = await User.findUser(req.params.username);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});


router.patch('/:username', checkCorrectUser, async (req, res, next) => {
    try {
        const validation = validate(req.body, updateUserSchema);

        if (!validation.valid) {
            throw new ExpressError(validation.errors.map(e => e.stack), 400);
        }

        const data = req.body;
        const username = req.params.username;
        const user = await User.editUser(username, data);
        return res.json({ user });
    } catch(err) {
        return next(err);
    }
});

router.delete('/:username', checkCorrectUser, async (req, res, next) => {
    try {
        const response = await User.deleteUser(req.params.username);
        return res.json({ "message": "User deleted" });
    } catch (err) {
        return next(err);
    }
})



module.exports = router;