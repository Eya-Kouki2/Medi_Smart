const Area = require('../models/areaModel');
const User = require('../models/userModel');
const generateAreaCode = require('../utils/generateAreaCode');

const formatUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    areaId: user.areaId,
    isVerified: user.isVerified,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
});

const createArea = async (req, res) => {
    const { name, address } = req.body;

    try {
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Area name is required',
            });
        }

        const existingArea = await Area.findOne({ adminId: req.userID });
        if (existingArea) {
            return res.status(400).json({
                success: false,
                message: 'You already manage an area',
            });
        }

        let code;
        let isUnique = false;
        while (!isUnique) {
            code = generateAreaCode();
            const existing = await Area.findOne({ code });
            if (!existing) isUnique = true;
        }

        const area = await Area.create({
            name,
            address,
            code,
            adminId: req.userID,
        });

        await User.findByIdAndUpdate(req.userID, { areaId: area._id });

        res.status(201).json({
            success: true,
            message: 'Area created successfully',
            area,
        });
    } catch (error) {
        console.error('Error in createArea', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getMyArea = async (req, res) => {
    try {
        const user = await User.findById(req.userID);
        if (!user?.areaId) {
            return res.status(404).json({
                success: false,
                message: 'No area linked to this account',
            });
        }

        const area = await Area.findById(user.areaId);
        if (!area) {
            return res.status(404).json({
                success: false,
                message: 'Area not found',
            });
        }

        res.status(200).json({ success: true, area });
    } catch (error) {
        console.error('Error in getMyArea', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getAreaStaff = async (req, res) => {
    try {
        const user = await User.findById(req.userID);
        if (!user?.areaId) {
            return res.status(404).json({
                success: false,
                message: 'No area linked to this account',
            });
        }

        const staff = await User.find({
            areaId: user.areaId,
            role: { $in: ['nurses', 'triage', 'pharmacy'] },
        })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            staff: staff.map(formatUser),
        });
    } catch (error) {
        console.error('Error in getAreaStaff', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createArea,
    getMyArea,
    getAreaStaff,
};
