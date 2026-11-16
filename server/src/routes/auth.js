const router = require('express').Router();
const ctrl = require('../controllers/authController');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');
const ah = require('../utils/asyncHandler');

router.post('/register', v.register, validate, ah(ctrl.register));
router.post('/login', v.login, validate, ah(ctrl.login));
router.post('/logout', ctrl.logout);
router.get('/me', ah(requireAuth), ctrl.me);

module.exports = router;
