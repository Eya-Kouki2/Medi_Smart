const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const router = express.Router();

router.post('/predict', (req, res) => {
    const { features } = req.body;
    
    if (!features || !Array.isArray(features)) {
        return res.status(400).json({ error: 'Features array is required' });
    }

    const featuresString = features.join(',');
    const scriptPath = path.join(__dirname, '..', 'ml', 'predict.py');

    // Make sure we use the python command that has joblib/scikit-learn installed
    const pythonProcess = spawn('python', [scriptPath, featuresString]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Python script exited with code ${code}. Error: ${errorString}`);
            return res.status(500).json({ error: 'Prediction failed' });
        }
        
        try {
            const result = JSON.parse(dataString);
            if (result.error) {
                return res.status(500).json({ error: result.error });
            }
            res.json(result);
        } catch (e) {
            console.error('Failed to parse python output:', dataString);
            res.status(500).json({ error: 'Invalid output from prediction model' });
        }
    });
});

module.exports = router;
