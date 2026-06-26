const express = require('express');
const { 
    signup,
    login, 
    logout, 
    verifyEmail, 
    forgotPassword,
    verifyResetCode,
    resetPassword,
    checkAuth,
    resendVerificationEmail
} = require('../controllers/authController');

const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/check-auth', verifyToken, checkAuth);

router.post('/signup', signup);

router.post('/login', login);

router.post('/logout', logout);

router.post('/verify-email', verifyEmail);

router.post('/resend-verification-email', resendVerificationEmail);

router.post('/forgot-password', forgotPassword);

router.post('/verify-reset-code', verifyResetCode);

router.post('/reset-password', resetPassword);


module.exports = router;