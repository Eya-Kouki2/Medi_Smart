const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const {
    getDiseaseClasses,
    createDiseaseClass,
    updateDiseaseClass,
    deleteDiseaseClass,
} = require('../controllers/diseaseClassController');

const router = express.Router();

router.get('/', verifyToken, requireRole('admin', 'nurses'), getDiseaseClasses);
router.post('/', verifyToken, requireRole('admin'), createDiseaseClass);
router.put('/:id', verifyToken, requireRole('admin'), updateDiseaseClass);
router.delete('/:id', verifyToken, requireRole('admin'), deleteDiseaseClass);

module.exports = router;
