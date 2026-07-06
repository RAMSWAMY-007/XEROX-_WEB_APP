const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key_12345';

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '1d' });
};

// For testing purposes - allowing student registration
exports.registerStudent = async (req, res) => {
  try {
    const { roll_number, name, phone_number, password } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { roll_number }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this roll number already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        roll_number,
        name,
        phone_number,
        password_hash,
        role: 'student'
      }
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        roll_number: user.roll_number,
        name: user.name,
        phone_number: user.phone_number,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.loginStudent = async (req, res) => {
  try {
    const { roll_number, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { roll_number }
    });

    if (!user || user.role !== 'student') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        roll_number: user.roll_number,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { roll_number, password } = req.body; // Using roll_number as username/email for admin simplicity for now, or we can use email if we add it to schema. The schema only has roll_number, name, password.

    const user = await prisma.user.findUnique({
      where: { roll_number }
    });

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        roll_number: user.roll_number,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.seedDatabase = async (req, res) => {
  try {
    const adminPassword = 'password123';
    const studentPassword = 'password123';
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash(adminPassword, salt);
    const studentHash = await bcrypt.hash(studentPassword, salt);

    // Seed Admin
    await prisma.user.upsert({
      where: { roll_number: 'admin' },
      update: { password_hash: adminHash },
      create: { roll_number: 'admin', name: 'Super Admin', password_hash: adminHash, role: 'admin' }
    });

    // Seed Demo Student
    await prisma.user.upsert({
      where: { roll_number: '12345' },
      update: { password_hash: studentHash },
      create: { roll_number: '12345', name: 'Demo Student', password_hash: studentHash, role: 'student' }
    });

    res.json({ message: 'Database seeded successfully on the live server! You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error seeding database', error: error.message });
  }
};
