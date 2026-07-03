const isMongoConnectionError = (error) => {
    if (!error) return false;

    return (
        error.name === 'MongoServerSelectionError' ||
        error.name === 'MongoNetworkError' ||
        error.name === 'MongooseServerSelectionError' ||
        error.code === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR' ||
        /whitelist|ECONNREFUSED|ENOTFOUND|SSL routines/i.test(error.message || '')
    );
};

const mongoConnectionMessage =
    'Database connection failed. In MongoDB Atlas, open Network Access and allow your current IP (or 0.0.0.0/0 for development).';

module.exports = {
    isMongoConnectionError,
    mongoConnectionMessage,
};
