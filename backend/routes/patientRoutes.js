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
    getPatientsWithStats,
} = require('../controllers/patientController');

const router = express.Router();

router.get('/stats', verifyToken, requireRole('admin', 'nurses'), getPatientsWithStats);
router.get('/', verifyToken, requireRole('admin', 'nurses'), getPatients);
router.get('/:id', verifyToken, requireRole('admin', 'nurses'), getPatient);
router.post('/', verifyToken, requireRole('admin', 'nurses'), createPatient);
router.put('/:id', verifyToken, requireRole('admin', 'nurses'), updatePatient);
router.post('/:id/history', verifyToken, requireRole('admin', 'nurses'), addPatientHistory);
router.put('/:id/history/:historyId', verifyToken, requireRole('admin', 'nurses'), updatePatientHistory);
router.delete('/:id', verifyToken, requireRole('admin'), deletePatient);

module.exports = router;

