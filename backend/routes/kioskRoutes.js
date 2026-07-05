const express = require('express');
const router = express.Router();

// Store connected SSE clients
let clients = [];

// 1. SSE Stream Endpoint for React Frontend
router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial connection success message
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

    // Add this client to our list
    clients.push(res);

    // Remove client when they disconnect
    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
});

// 2. POST Endpoint for Python triage_kiosk.py (final result)
router.post('/', (req, res) => {
    const payload = req.body;
    
    // Broadcast the result to all connected frontend clients
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify({ type: 'KIOSK_RESULT', payload })}\n\n`);
    });

    res.status(200).json({ success: true, message: 'Result broadcasted successfully' });
});

// 3. POST /progress — receives live question/answer updates from triage_kiosk.py
router.post('/progress', (req, res) => {
    const payload = req.body; // { questionIndex, symptom, answer, questionLabel }

    // Broadcast live progress to all connected clients
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify({ type: 'KIOSK_PROGRESS', payload })}\n\n`);
    });

    res.status(200).json({ success: true });
});

module.exports = router;
