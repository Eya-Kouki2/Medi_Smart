const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB  = require('./config/db');
const router = require('./routes/authRoutes');
const areaRouter = require('./routes/areaRoutes');
const cors = require('cors');

dotenv.config();

const app = express();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
    origin: process.env.NODE_ENV === 'development'
        ? (origin, callback) => {
            if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
                callback(null, true);
            } else {
                callback(null, clientUrl);
            }
        }
        : clientUrl,
    credentials: true,
}));

const port = process.env.PORT || 5000;

app.use(express.json()) // allows us to parse incomming requests : req.body
app.use(cookieParser()); // allows us to parse incoming cookies

app.use('/api/auth', router)
app.use('/api/areas', areaRouter)

app.listen(port, () => {
    connectDB()
    console.log('Server is running on port', port)
});