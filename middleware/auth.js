// jwt authentication middleware

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const ExpressError = require("../helpers/expressError");


function checkAuth(req, res, next) {

    try {
        const userToken = req.body._token || req.query._token;
        let token = jwt.verify(userToken, SECRET_KEY);
        res.locals.username = token.username;

        return next();

    } catch (err) {
        return next(new ExpressError("Authentication required", 401));
    }
}

function checkAdmin(req, res, next) {
    try {
        const token = req.body._token;

        let varification = jwt.verify(token, SECRET_KEY);
        res.locals.username = varification.username;

        if (varification.is_admin) {
            return next();
        }
        
        throw new ExpressError('Admin level access required', 401);

    } catch(err) {
        return next(err);
    }
}

function checkCorrectUser(req, res, next) {
    try {
        const token = req.body._token;

        let varification = jwt.verify(token, SECRET_KEY);
        res.locals.username = varification.username;

        if (req.params.username === varification.username) {
            return next();
        }
        throw new Error();
    } catch (err) {
        return next(new ExpressError("You may only make changes to your own user profile", 401));
    }
}

module.exports = {
    checkAuth,
    checkAdmin,
    checkCorrectUser
}