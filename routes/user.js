const router = require("express").Router()
const userController = require('../controllers/userController')
const { verifyAuthenticateToken } = require('../utils/jwt.utils');

router.post('/', userController.store)
router.post('/login', userController.login)
// router.post('/loginWithGoogle', userController.loginWithGoogle)
router.get('/user_list_by_admin', userController.getUserList)
router.get('/', verifyAuthenticateToken, userController.getUser)
router.put('/', verifyAuthenticateToken, userController.update)
router.get('/logout', verifyAuthenticateToken, userController.logout)
router.get('/resetVisionData', verifyAuthenticateToken, userController.resetVisionData)

module.exports = router