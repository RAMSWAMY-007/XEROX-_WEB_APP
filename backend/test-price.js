const prisma = require('./src/config/db');

async function test() {
  try {
    const orders = await prisma.order.findMany({ take: 1 });
    if (orders.length === 0) return console.log("No orders found");
    const order = orders[0];
    
    console.log("Updating order", order.id);
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { amount: 100 }
    });
    console.log("Success:", updated.amount);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
