const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const {
    createArea,
    getMyArea,
    getAreaStaff,
} = require('../controllers/areaController');

const router = express.Router();

router.post('/create', verifyToken, requireRole('admin'), createArea);
router.get('/my-area', verifyToken, getMyArea);
router.get('/staff', verifyToken, requireRole('admin'), getAreaStaff);

module.exports = router;
