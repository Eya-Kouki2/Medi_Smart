const DiseaseClass = require('../models/diseaseClassModel');
const { MALADIE_VALUES } = require('../constants/maladies');
const { isMongoConnectionError, mongoConnectionMessage } = require('../utils/mongoError');

const MIN_PLACE_CODE = 1;
const MAX_PLACE_CODE = 200;

const parsePlaceCode = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const num = parseInt(String(value).trim(), 10);
    if (Number.isNaN(num) || num < MIN_PLACE_CODE || num > MAX_PLACE_CODE) return null;
    return num;
};

const getUsedPlaceCodes = async (areaId, excludeId = null) => {
    const query = { areaId, isActive: true };
    if (excludeId) query._id = { $ne: excludeId };

    const records = await DiseaseClass.find(query).select('placeCode');
    return new Set(records.map((record) => Number(record.placeCode)));
};

const generatePlaceCode = async (areaId) => {
    const used = await getUsedPlaceCodes(areaId);
    const available = [];

    for (let i = MIN_PLACE_CODE; i <= MAX_PLACE_CODE; i += 1) {
        if (!used.has(i)) available.push(i);
    }

    if (available.length === 0) {
        throw new Error('No place codes available between 1 and 200');
    }

    return available[Math.floor(Math.random() * available.length)];
};

const resolvePlaceCode = async (areaId, requestedCode, excludeId = null) => {
    const parsed = parsePlaceCode(requestedCode);

    if (parsed !== null) {
        const used = await getUsedPlaceCodes(areaId, excludeId);
        if (used.has(parsed)) {
            throw new Error(`Place code ${parsed} is already in use`);
        }
        return parsed;
    }

    return generatePlaceCode(areaId);
};

const getDiseaseClasses = async (req, res) => {
    try {
        if (!req.userAreaId) {
            return res.status(400).json({
                success: false,
                message: 'No area linked to this account',
            });
        }

        const diseaseClasses = await DiseaseClass.find({
            areaId: req.userAreaId,
            isActive: true,
        }).sort({ placeCode: 1 });

        res.status(200).json({
            success: true,
            diseaseClasses,
        });
    } catch (error) {
        console.error('Error in getDiseaseClasses', error);
        if (isMongoConnectionError(error)) {
            return res.status(503).json({ success: false, message: mongoConnectionMessage });
        }
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const createDiseaseClass = async (req, res) => {
    const { placeCode, description, severity, maladie, maxPatients } = req.body;

    try {
        if (!req.userAreaId) {
            return res.status(400).json({
                success: false,
                message: 'Complete clinic setup before adding disease classes',
            });
        }


        if (!maladie || !MALADIE_VALUES.includes(maladie)) {
            return res.status(400).json({
                success: false,
                message: 'Please choose a valid maladie',
            });
        }

        if (placeCode !== undefined && placeCode !== null && placeCode !== '' && parsePlaceCode(placeCode) === null) {
            return res.status(400).json({
                success: false,
                message: 'Place code must be a number between 1 and 200',
            });
        }

        const resolvedPlaceCode = await resolvePlaceCode(req.userAreaId, placeCode);

        const existingCount = await DiseaseClass.countDocuments({
            areaId: req.userAreaId,
            maladie,
            isActive: true,
        });
        const classNumber = existingCount + 1;

        const diseaseClass = await DiseaseClass.create({
            classNumber,
            placeCode: resolvedPlaceCode,
            description: description?.trim() || '',
            severity: severity || 'moderate',
            maladie,
            maxPatients: maxPatients ? Number(maxPatients) : 1,
            areaId: req.userAreaId,
            createdBy: req.userID,
        });

        res.status(201).json({
            success: true,
            message: 'Disease class created',
            diseaseClass,
        });
    } catch (error) {
        console.error('Error in createDiseaseClass', error);
        if (isMongoConnectionError(error)) {
            return res.status(503).json({ success: false, message: mongoConnectionMessage });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'This place code is already in use',
            });
        }
        res.status(error.message.includes('already in use') || error.message.includes('No place codes') ? 400 : 500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateDiseaseClass = async (req, res) => {
    const { id } = req.params;
    const { placeCode, description, severity, maladie, maxPatients } = req.body;

    try {
        const diseaseClass = await DiseaseClass.findOne({
            _id: id,
            areaId: req.userAreaId,
            isActive: true,
        });

        if (!diseaseClass) {
            return res.status(404).json({
                success: false,
                message: 'Disease class not found',
            });
        }


        if (description !== undefined) diseaseClass.description = description.trim();
        if (severity) diseaseClass.severity = severity;
        if (maladie) {
            if (!MALADIE_VALUES.includes(maladie)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please choose a valid maladie',
                });
            }
            diseaseClass.maladie = maladie;
        }
        if (maxPatients !== undefined) diseaseClass.maxPatients = Number(maxPatients);

        if (placeCode !== undefined && placeCode !== null && placeCode !== '') {
            if (parsePlaceCode(placeCode) === null) {
                return res.status(400).json({
                    success: false,
                    message: 'Place code must be a number between 1 and 200',
                });
            }
            diseaseClass.placeCode = await resolvePlaceCode(req.userAreaId, placeCode, diseaseClass._id);
        }

        await diseaseClass.save();

        res.status(200).json({
            success: true,
            message: 'Disease class updated',
            diseaseClass,
        });
    } catch (error) {
        console.error('Error in updateDiseaseClass', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'This place code is already in use',
            });
        }
        res.status(error.message.includes('already in use') ? 400 : 500).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteDiseaseClass = async (req, res) => {
    const { id } = req.params;

    try {
        const diseaseClass = await DiseaseClass.findOneAndUpdate(
            { _id: id, areaId: req.userAreaId, isActive: true },
            { isActive: false },
            { new: true }
        );

        if (!diseaseClass) {
            return res.status(404).json({
                success: false,
                message: 'Disease class not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Disease class deleted',
        });
    } catch (error) {
        console.error('Error in deleteDiseaseClass', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const incrementPatients = async (req, res) => {
    try {
        const diseaseClass = await DiseaseClass.findById(req.params.id);
        if (!diseaseClass) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        if (diseaseClass.currentPatients >= diseaseClass.maxPatients) {
            return res.status(400).json({
                success: false,
                message: 'Room is at maximum capacity',
            });
        }
        diseaseClass.currentPatients += 1;
        await diseaseClass.save();
        res.status(200).json({ success: true, diseaseClass });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const decrementPatients = async (req, res) => {
    try {
        const diseaseClass = await DiseaseClass.findByIdAndUpdate(
            req.params.id,
            { $inc: { currentPatients: -1 } },
            { new: true }
        );
        // Prevent negative patients
        if (diseaseClass.currentPatients < 0) {
            diseaseClass.currentPatients = 0;
            await diseaseClass.save();
        }
        res.status(200).json({ success: true, diseaseClass });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const resetQueue = async (req, res) => {
    try {
        const diseaseClass = await DiseaseClass.findByIdAndUpdate(
            req.params.id,
            { currentPatients: 0 },
            { new: true }
        );
        res.status(200).json({ success: true, diseaseClass });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDiseaseClasses,
    createDiseaseClass,
    updateDiseaseClass,
    deleteDiseaseClass,
    incrementPatients,
    decrementPatients,
    resetQueue,
};
