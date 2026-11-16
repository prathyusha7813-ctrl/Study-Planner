const router = require('express').Router();
const ctrl = require('../controllers/subjectController');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');
const ah = require('../utils/asyncHandler');

router.use(ah(requireAuth));
router.get('/', ah(ctrl.list));
router.post('/', v.createSubject, validate, ah(ctrl.create));
router.patch('/:id', v.updateSubject, validate, ah(ctrl.update));
router.delete('/:id', v.idParam, validate, ah(ctrl.remove));

module.exports = router;
