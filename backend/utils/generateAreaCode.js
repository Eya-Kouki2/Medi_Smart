const crypto = require('crypto');

const generateAreaCode = () => {
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `MSH-${suffix}`;
};

module.exports = generateAreaCode;
