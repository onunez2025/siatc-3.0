const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Mapped to /api/dashboard
router.get('/', dashboardController.getDashboard);
router.get('/stats', dashboardController.getStats);

module.exports = router;
