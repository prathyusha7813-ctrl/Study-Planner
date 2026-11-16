const router = require('express').Router();
const ctrl = require('../controllers/taskController');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../middleware/validators');
const ah = require('../utils/asyncHandler');

router.use(ah(requireAuth));
router.get('/', v.listTasks, validate, ah(ctrl.list));
router.post('/', v.createTask, validate, ah(ctrl.create));
router.get('/:id', v.idParam, validate, ah(ctrl.get));
router.patch('/:id', v.updateTask, validate, ah(ctrl.update));
router.delete('/:id', v.idParam, validate, ah(ctrl.remove));

module.exports = router;
