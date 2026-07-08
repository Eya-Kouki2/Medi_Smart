const mongoose = require('mongoose');
const { mongoConnectionMessage } = require('../utils/mongoError');

const mongooseOptions = {
    serverSelectionTimeoutMS: 30000,  // wait up to 30s to find a server
    socketTimeoutMS: 120000,          // close sockets after 2 min of inactivity
    heartbeatFrequencyMS: 10000,      // ping Atlas every 10s to keep the connection alive
    connectTimeoutMS: 30000,          // time to establish the initial connection
    maxPoolSize: 10,                  // keep up to 10 connections in the pool
    minPoolSize: 2,                   // keep at least 2 warm connections open
    autoSelectFamily: false,
};

const syncDiseaseClassIndexes = async () => {
    const DiseaseClass = require('../models/diseaseClassModel');
    const collection = DiseaseClass.collection;

    try {
        await collection.dropIndex('areaId_1_code_1');
        console.log('Dropped obsolete index: areaId_1_code_1');
    } catch (error) {
        if (error.code !== 27 && !/index not found/i.test(error.message)) {
            console.log('Could not drop areaId_1_code_1:', error.message);
        }
    }

    try {
        await collection.dropIndex('areaId_1_placeCode_1');
        console.log('Dropped index: areaId_1_placeCode_1 (recreating with partial filter)');
    } catch (error) {
        if (error.code !== 27 && !/index not found/i.test(error.message)) {
            console.log('Could not drop areaId_1_placeCode_1:', error.message);
        }
    }

    await collection.updateMany(
        { placeCode: { $exists: false } },
        { $set: { isActive: false }, $unset: { code: 1 } }
    );

    await collection.updateMany({}, { $unset: { code: 1 } });

    await DiseaseClass.syncIndexes();
    console.log('Disease class indexes synced');
};

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
        console.log(`Mongodb connected: ${conn.connection.host}`);

        // Handle connection drops (e.g. Atlas idle timeout / ECONNRESET)
        mongoose.connection.on('disconnected', () => {
            console.warn('[MongoDB] Disconnected — Mongoose will auto-reconnect...');
        });
        mongoose.connection.on('reconnected', () => {
            console.log('[MongoDB] Reconnected successfully.');
        });
        mongoose.connection.on('error', (err) => {
            console.error('[MongoDB] Connection error:', err.message);
        });

        try {
            await syncDiseaseClassIndexes();
        } catch (error) {
            console.log('Disease class index sync warning:', error.message);
        }
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        console.error(mongoConnectionMessage);
        console.error('Also verify MONGO_URI username/password (encode @ as %40 in passwords).');
        process.exit(1);
    }
};

module.exports = connectDB;
