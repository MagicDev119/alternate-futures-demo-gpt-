const router = require("express").Router()
const user = require('./user')
const visualization = require('./visualization')

router.use('/user', user)
router.use('/visualization', visualization)

module.exports = router