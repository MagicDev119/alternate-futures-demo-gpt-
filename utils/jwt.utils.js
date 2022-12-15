const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

class JWTUtils {

    async verifyAuthenticateToken(request, response, next) {
        try {
            /**To get the token of request header  */
            let token = request.headers['authorization']
            /**To check a reuest have a tokenOrNot */
            if (token == null || token == "undefined") {
                return response.status(401).send({
                    auth: false,
                    message: "Please provide token"
                })
            } else {

                /**to decode a token and find out the id  */
                let decodedToken = jwt.decode(token)

                let id = decodedToken.id

                /**To find the id in database   */
                let validUser = await require('../models/userModel').findOne({ _id: id })
                /**to check id is validOrNot */
                if (validUser === null) return response.status(401).send({
                    code: 401,
                    auth: false,
                    message: 'Invalid user'
                })
                /**To verify a jwt token   */
                jwt.verify(token, process.env.JWT_SECRET, function (error) {
                    /** To check the token is not expired  */
                    if (error && error.name === 'TokenExpiredError') {
                        return response.status(401).send({
                            code: 'TokenExpired',
                            message: 'Token Expired'
                        })
                    }
                    /** To check the token is not equal to expired  token  */
                    if (error && error.name !== 'TokenExpiredError') {
                        return response.status(401).send({
                            message: 'Authentication Failed'
                        })
                    }
                    /**If all coditions are false then to set the user in request   */
                    request['user'] = validUser
                    next();
                })
            }
        } catch (error) {
            next(error);
        }
    }

    async generateJwtToken(userInfo, validity) {
        let token = jwt.sign({
            name: userInfo.name,
            email: userInfo.email,
            id: userInfo._id,
            birthday: userInfo.birthday,
            gender: userInfo.gender,
            race: userInfo.race
        }, process.env.JWT_SECRET, { expiresIn: validity })
        return token
    }
    async comparePassword(savedPassword, requestPassword) {
        return bcrypt.compare(requestPassword, savedPassword)
    }
    async convertPasswordInBcrypt(password) {
        return await bcrypt.hash(password, await bcrypt.genSalt(10));
    }
}

module.exports = new JWTUtils()