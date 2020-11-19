// jwt authentication middleware

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const ExpressError = require("../helpers/expressError");

function checkAuth(req, res, next) {
    try {
        let token = jwt.varify(req.body._token, SECRET_KEY);
        res.locals.username = token.username;
        return next();
    } catch (err) {
        return next(new ExpressError("Authentication required", 401));
    }
}

module.exports = checkAuth;