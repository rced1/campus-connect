/**
 * Campus Connect API router mounted at /api/cc.
 * // CC: new file
 */

const express = require('express');
const { ccApiLimiter } = require('../../cc/rateLimit');
const config = require('./config');

const router = express.Router();

router.use(ccApiLimiter);

router.get('/config', config);

module.exports = router;
