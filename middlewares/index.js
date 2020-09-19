const jwt = require('jsonwebtoken');
let salt = 'ZGV2c25lc3QK';

const checkToken = (req, res, next) => {
    const bearerHeader = req.headers.authorization;
    if (typeof bearerHeader === "undefined") {
        return res.json({
            err: "Invalid token."
        });
    }
    else{
        let bearerToken = bearerHeader.split(' ')[1];
        jwt.verify(bearerToken, salt, (err, authData) => {
            if (err) {
                return res.json({
                    err: "Invalid token."
                });
            }
            else
                next();
        });
    }
}

module.exports = {
    checkToken
};