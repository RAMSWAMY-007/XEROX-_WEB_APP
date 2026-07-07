const { PDFDocument } = require('pdf-lib');
const prisma = require('../config/db');
const { calculatePrice } = require('../services/pricing.service');
const { uploadBufferToCloudinary } = require('../services/cloudinary.service');

exports.createOrder = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { paper_size, color_mode, copies, binding, payment_method, print_sides, paper_type, notes } = req.body;

    // Default values if not provided
    const _paper_size = paper_size || 'A4';
    const _color_mode = color_mode || 'bw';
    const _copies = copies ? parseInt(copies, 10) : 1;
    const _binding = binding === 'true' || binding === true;
    const _payment_method = payment_method || 'offline';
    const _print_sides = print_sides || 'single';
    const _paper_type = paper_type || 'standard';
    const _notes = notes || null;

    // Recruiter-ready feature: Verify page count dynamically server-side from buffer
    const fileBuffer = req.file.buffer;
    
    let page_count = 1; // fallback
    try {
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      page_count = pdfDoc.getPageCount();
    } catch (pdfError) {
      console.error('Error parsing PDF:', pdfError);
      return res.status(400).json({ message: 'Invalid or corrupted PDF file' });
    }

    // Upload to Cloudinary
    let cloudResult;
    try {
      cloudResult = await uploadBufferToCloudinary(fileBuffer, req.file.originalname);
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(500).json({ message: 'Failed to upload file to cloud storage' });
    }

    const amount = calculatePrice({
      pageCount: page_count,
      copies: _copies,
      colorMode: _color_mode,
      paperSize: _paper_size,
      binding: _binding,
      printSides: _print_sides,
      paperType: _paper_type
    });

    const order = await prisma.order.create({
      data: {
        student_id: req.user.id,
        file_url: cloudResult.secure_url,
        file_name: req.file.originalname,
        page_count,
        paper_size: _paper_size,
        color_mode: _color_mode,
        copies: _copies,
        binding: _binding,
        print_sides: _print_sides,
        paper_type: _paper_type,
        notes: _notes,
        payment_method: _payment_method,
        amount
      }
    });

    // Emit event to admins for real-time queue
    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('new-order', order);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating order' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { student_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns order or is admin
    if (order.student_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
