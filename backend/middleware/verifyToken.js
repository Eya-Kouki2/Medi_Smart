const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const verifyToken = async (req, res, next) => {

    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized - no token provided'
        });
    };

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - invalid token'
            });
        };

        const user = await User.findById(decoded.userID).select('role areaId');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - user not found'
            });
        }

        req.userID = decoded.userID;
        req.userRole = user.role;
        req.userAreaId = user.areaId;
        
        next();

    } catch (error) {
        console.log('Error in verifyToken', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = verifyToken;