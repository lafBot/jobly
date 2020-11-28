const User = require("../models/user_queries");
const express = require("express");
const router = express.Router();
const createToken = require("../helpers/createToken.js");

router.post("/login", async (req, res, next) => {
    try {
        const user = await User.checkAuth(req.body);
        const token = createToken(user);
        return res.json({ token });
    } catch (err) {
        return next(err);
    }
})

module.exports = router;