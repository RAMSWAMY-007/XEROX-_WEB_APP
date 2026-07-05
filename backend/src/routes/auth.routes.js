const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Student login/register (we'll implement register for easy testing)
router.post('/student/register', authController.registerStudent);
router.post('/student/login', authController.loginStudent);

// Admin login
router.post('/admin/login', authController.loginAdmin);

// Seed databases from the live server
router.get('/seed', authController.seedDatabase);

module.exports = router;
