const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');
const ah = require('../utils/asyncHandler');

router.get('/', ah(requireAuth), v.dashboard, validate, ah(ctrl.summary));

module.exports = router;
