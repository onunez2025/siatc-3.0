const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');

router.get('/clients', masterController.getClients);
router.get('/assets', masterController.getAssets);
router.get('/materials', masterController.getMaterials);
router.get('/services', masterController.getServices);
router.get('/service-types', masterController.getServiceTypes);
router.get('/sync-services-now', masterController.syncServices); // Temporary helper
router.get('/cancellation-reasons', masterController.getCancellationReasons);

module.exports = router;
