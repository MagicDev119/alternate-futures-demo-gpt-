const router = require("express").Router()
const visualizationController = require('../controllers/visualizationController')
const { verifyAuthenticateToken } = require('../utils/jwt.utils')

router.get('/', verifyAuthenticateToken, visualizationController.index)
router.get('/:id', verifyAuthenticateToken, visualizationController.show)
router.post('/', verifyAuthenticateToken, visualizationController.store)
router.put('/:id', verifyAuthenticateToken, visualizationController.update)
router.delete('/:id', verifyAuthenticateToken, visualizationController.destroy)

module.exports = router