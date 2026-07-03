const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const {
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    addPatientHistory,
    updatePatientHistory,
    deletePatient,
} = require('../controllers/patientController');

const router = express.Router();

router.get('/', verifyToken, requireRole('admin'), getPatients);
router.get('/:id', verifyToken, requireRole('admin'), getPatient);
router.post('/', verifyToken, requireRole('admin'), createPatient);
router.put('/:id', verifyToken, requireRole('admin'), updatePatient);
router.post('/:id/history', verifyToken, requireRole('admin'), addPatientHistory);
router.put('/:id/history/:historyId', verifyToken, requireRole('admin'), updatePatientHistory);
router.delete('/:id', verifyToken, requireRole('admin'), deletePatient);

module.exports = router;
