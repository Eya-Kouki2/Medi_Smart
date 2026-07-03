const mongoose = require('mongoose');
const { mongoConnectionMessage } = require('../utils/mongoError');

const mongooseOptions = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
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
