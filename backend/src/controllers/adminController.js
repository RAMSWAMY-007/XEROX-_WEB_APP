const prisma = require('../config/db');

exports.getQueue = async (req, res) => {
  try {
    const queue = await prisma.order.findMany({
      where: {
        status: {
          in: ['pending', 'printing']
        }
      },
      include: {
        student: {
          select: { roll_number: true, name: true }
        }
      },
      orderBy: { created_at: 'asc' }
    });
    res.json(queue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching queue' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    // Basic filtering can be added via query params
    const { status } = req.query;
    
    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        student: {
          select: { roll_number: true, name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'printing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status }
    });

    // Emit socket event to student
    const io = req.app.get('io');
    if (io) {
      io.to(`student-${order.student_id}`).emit('order-updated', order);
      // Also broadcast queue update to admins
      io.to('admins').emit('queue-updated', order);
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating order' });
  }
};

exports.batchPrintOrders = async (req, res) => {
  try {
    const { orderIds } = req.body; // Array of IDs

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'No order IDs provided' });
    }

    await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
        status: 'pending'
      },
      data: { status: 'printing' }
    });

    // Fetch updated to emit
    const updatedOrders = await prisma.order.findMany({
      where: { id: { in: orderIds } }
    });

    const io = req.app.get('io');
    if (io) {
      updatedOrders.forEach(order => {
        io.to(`student-${order.student_id}`).emit('order-updated', order);
      });
      io.to('admins').emit('queue-batch-updated'); // General refresh event
    }

    res.json({ message: 'Orders batched for printing successfully', count: updatedOrders.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error batching orders' });
  }
};
