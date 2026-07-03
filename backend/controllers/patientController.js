const Patient = require('../models/patientModel');
const { isMongoConnectionError, mongoConnectionMessage } = require('../utils/mongoError');

const formatPatientList = (patient) => ({
    _id: patient._id,
    cin: patient.cin,
    name: patient.name,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    phone: patient.phone,
    bloodType: patient.bloodType,
    address: patient.address,
    createdAt: patient.createdAt,
    lastVisit: patient.history?.length
        ? patient.history[patient.history.length - 1].date
        : patient.createdAt,
    historyCount: patient.history?.length || 0,
});

const getPatients = async (req, res) => {
    try {
        if (!req.userAreaId) {
            return res.status(400).json({
                success: false,
                message: 'No area linked to this account',
            });
        }

        const patients = await Patient.find({
            areaId: req.userAreaId,
            isActive: true,
        }).sort({ name: 1 });

        res.status(200).json({
            success: true,
            patients: patients.map(formatPatientList),
        });
    } catch (error) {
        console.error('Error in getPatients', error);
        if (isMongoConnectionError(error)) {
            return res.status(503).json({ success: false, message: mongoConnectionMessage });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPatient = async (req, res) => {
    try {
        const patient = await Patient.findOne({
            _id: req.params.id,
            areaId: req.userAreaId,
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        res.status(200).json({ success: true, patient });
    } catch (error) {
        console.error('Error in getPatient', error);
        if (isMongoConnectionError(error)) {
            return res.status(503).json({ success: false, message: mongoConnectionMessage });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const buildTriageFromBody = (triage) => {
    if (!triage || typeof triage !== 'object') return undefined;
    return {
        vitals: {
            temperature: triage.vitals?.temperature?.trim() || '',
            pulse: triage.vitals?.pulse?.trim() || '',
            bloodPressure: triage.vitals?.bloodPressure?.trim() || '',
            weight: triage.vitals?.weight?.trim() || '',
            height: triage.vitals?.height?.trim() || '',
        },
        symptoms: Array.isArray(triage.symptoms) ? triage.symptoms : [],
        duration: triage.duration?.trim() || '',
        additionalNotes: triage.additionalNotes?.trim() || '',
        predictions: Array.isArray(triage.predictions)
            ? triage.predictions.map((p) => ({
                maladie: p.maladie || '',
                label: p.label || '',
                confidence: p.confidence ?? 0,
            }))
            : [],
        priority: triage.priority?.trim() || '',
        suggestedClass: triage.suggestedClass
            ? {
                name: triage.suggestedClass.name?.trim() || '',
                placeCode: triage.suggestedClass.placeCode,
            }
            : undefined,
    };
};

const createPatient = async (req, res) => {
    const { cin, name, dateOfBirth, gender, phone, bloodType, address, initialNote } = req.body;

    try {
        if (!req.userAreaId) {
            return res.status(400).json({
                success: false,
                message: 'Complete clinic setup before adding patients',
            });
        }

        if (!cin?.trim() || !name?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'CIN and name are required',
            });
        }

        const normalizedCin = cin.trim().toUpperCase();
        const existing = await Patient.findOne({
            areaId: req.userAreaId,
            cin: normalizedCin,
            isActive: true,
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'A patient with this CIN already exists',
            });
        }

        const history = [];
        if (initialNote?.trim()) {
            history.push({
                type: 'note',
                title: 'Initial registration',
                notes: initialNote.trim(),
                createdBy: req.userID,
            });
        }

        const patient = await Patient.create({
            cin: normalizedCin,
            name: name.trim(),
            dateOfBirth: dateOfBirth || undefined,
            gender: gender || undefined,
            phone: phone?.trim() || '',
            bloodType: bloodType?.trim() || '',
            address: address?.trim() || '',
            areaId: req.userAreaId,
            createdBy: req.userID,
            history,
        });

        res.status(201).json({
            success: true,
            message: 'Patient added',
            patient,
        });
    } catch (error) {
        console.error('Error in createPatient', error);
        if (isMongoConnectionError(error)) {
            return res.status(503).json({ success: false, message: mongoConnectionMessage });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A patient with this CIN already exists',
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const addPatientHistory = async (req, res) => {
    const { type, title, notes, date, triage } = req.body;

    try {
        const patient = await Patient.findOne({
            _id: req.params.id,
            areaId: req.userAreaId,
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        if (!title?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'History title is required',
            });
        }

        const entry = {
            type: type || 'visit',
            title: title.trim(),
            notes: notes?.trim() || '',
            date: date ? new Date(date) : new Date(),
            createdBy: req.userID,
        };

        if (triage && typeof triage === 'object') {
            entry.triage = buildTriageFromBody(triage);
        }

        patient.history.push(entry);

        await patient.save();

        res.status(201).json({
            success: true,
            message: 'History entry added',
            patient,
        });
    } catch (error) {
        console.error('Error in addPatientHistory', error);
        if (isMongoConnectionError(error)) {
            return res.status(503).json({ success: false, message: mongoConnectionMessage });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const updatePatient = async (req, res) => {
    const { cin, name, dateOfBirth, gender, phone, bloodType, address } = req.body;

    try {
        const patient = await Patient.findOne({
            _id: req.params.id,
            areaId: req.userAreaId,
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        if (!cin?.trim() || !name?.trim()) {
            return res.status(400).json({ success: false, message: 'CIN and name are required' });
        }

        const normalizedCin = cin.trim().toUpperCase();
        if (normalizedCin !== patient.cin) {
            const existing = await Patient.findOne({
                areaId: req.userAreaId,
                cin: normalizedCin,
                isActive: true,
                _id: { $ne: patient._id },
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'A patient with this CIN already exists',
                });
            }
            patient.cin = normalizedCin;
        }

        patient.name = name.trim();
        patient.dateOfBirth = dateOfBirth || undefined;
        patient.gender = gender || undefined;
        patient.phone = phone?.trim() || '';
        patient.bloodType = bloodType?.trim() || '';
        patient.address = address?.trim() || '';

        await patient.save();

        res.status(200).json({ success: true, message: 'Patient updated', patient });
    } catch (error) {
        console.error('Error in updatePatient', error);
        if (isMongoConnectionError(error)) {
            return res.status(503).json({ success: false, message: mongoConnectionMessage });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A patient with this CIN already exists',
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const updatePatientHistory = async (req, res) => {
    const { type, title, notes, date, triage } = req.body;

    try {
        const patient = await Patient.findOne({
            _id: req.params.id,
            areaId: req.userAreaId,
            isActive: true,
        });

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        const entry = patient.history.id(req.params.historyId);
        if (!entry) {
            return res.status(404).json({ success: false, message: 'History entry not found' });
        }

        if (!title?.trim()) {
            return res.status(400).json({ success: false, message: 'History title is required' });
        }

        entry.type = type || entry.type;
        entry.title = title.trim();
        entry.notes = notes?.trim() || '';
        if (date) entry.date = new Date(date);

        if (triage && typeof triage === 'object') {
            const built = buildTriageFromBody(triage);
            const existingTriage = entry.triage?.toObject?.() || entry.triage || {};
            entry.triage = {
                ...existingTriage,
                ...built,
                predictions: built.predictions?.length
                    ? built.predictions
                    : (existingTriage.predictions || []),
            };
        }

        await patient.save();

        res.status(200).json({ success: true, message: 'History entry updated', patient });
    } catch (error) {
        console.error('Error in updatePatientHistory', error);
        if (isMongoConnectionError(error)) {
            return res.status(503).json({ success: false, message: mongoConnectionMessage });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findOneAndUpdate(
            { _id: req.params.id, areaId: req.userAreaId, isActive: true },
            { isActive: false },
            { new: true }
        );

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        res.status(200).json({ success: true, message: 'Patient removed' });
    } catch (error) {
        console.error('Error in deletePatient', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/* Returns patients with full history for reporting / statistics */
const getPatientsWithStats = async (req, res) => {
    try {
        if (!req.userAreaId) {
            return res.status(400).json({ success: false, message: 'No area linked to this account' });
        }

        const patients = await Patient.find({
            areaId: req.userAreaId,
            isActive: true,
        }).sort({ name: 1 });

        res.status(200).json({ success: true, patients });
    } catch (error) {
        console.error('Error in getPatientsWithStats', error);
        if (isMongoConnectionError(error)) {
            return res.status(503).json({ success: false, message: mongoConnectionMessage });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    addPatientHistory,
    updatePatientHistory,
    deletePatient,
    getPatientsWithStats,
};

