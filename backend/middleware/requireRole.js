const requireRole = (...roles) => (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied',
        });
    }
    next();
};

module.exports = requireRole;
