const db = require("../config/db.config");

async function createSale(saleData) {
  const { items, paymentMethod, customerName, customerContact, subtotal, vat, total } = saleData;

  if (!items || items.length === 0) {
    throw new Error("At least one item is required for a sale");
  }

  try {
    // Insert into sales table
    const saleResult = await db.query(
      `INSERT INTO sales (customer_name, customer_contact, payment_method, subtotal, vat, total, sale_date) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [customerName || null, customerContact || null, paymentMethod, subtotal, vat, total]
    );

    // ✅ since db.query returns only rows, we get insertId from saleResult.insertId
    const saleId = saleResult.insertId;

    // Insert sale items & update stock
    for (const item of items) {
      const { productId, quantity, unitPrice, vatRate } = item;

      // Save sale item
      await db.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, vat_rate) 
         VALUES (?, ?, ?, ?, ?)`,
        [saleId, productId, quantity, unitPrice, vatRate]
      );

      // Update stock in items table
      await db.query(
        `UPDATE items SET current_stock = current_stock - ? WHERE id = ?`,
        [quantity, productId]
      );
    }

    // Fetch full sale
    const sale = await db.query("SELECT * FROM sales WHERE id = ?", [saleId]);
    const saleItems = await db.query("SELECT * FROM sale_items WHERE sale_id = ?", [saleId]);

    return {
      ...sale[0],
      items: saleItems,
    };
  } catch (error) {
    console.error("❌ Error creating sale:", error.message);
    throw error;
  }
}
// Function to fetch sales receipts
async function getSalesReceipts() {

    try {
        const receipts = await db.query(`
            SELECT 
            s.id AS sale_id,
            s.customer_name,
            s.customer_contact,
            s.payment_method,
            s.subtotal,
            s.vat,
            s.total,
            s.sale_date,
            si.id AS sale_item_id,
            si.product_id,
            i.name AS product_name,
            si.quantity,
            si.unit_price,
            si.vat_rate
            FROM sales s
            JOIN sale_items si ON s.id = si.sale_id
            JOIN items i ON si.product_id = i.id
            ORDER BY s.sale_date DESC, s.id, si.id
        `);
    
        // Group items by sale
        const groupedReceipts = receipts.reduce((acc, curr) => {
            let sale = acc.find(s => s.sale_id === curr.sale_id);
            if (!sale) {
            sale = {
                sale_id: curr.sale_id,
                customer_name: curr.customer_name,
                customer_contact: curr.customer_contact,
                payment_method: curr.payment_method,
                subtotal: curr.subtotal,
                vat: curr.vat,
                total: curr.total,
                sale_date: curr.sale_date,
                items: []
            };
            acc.push(sale);
            }
            sale.items.push({
            sale_item_id: curr.sale_item_id,
            product_id: curr.product_id,
            product_name: curr.product_name,
            quantity: curr.quantity,
            unit_price: curr.unit_price,
            vat_rate: curr.vat_rate
            });
            return acc;
        }, []);
    
        return groupedReceipts;
        } catch (error) {
        console.error("❌ Error fetching sales receipts:", error.message);
        throw error;
        }
    }

module.exports = { createSale, getSalesReceipts };
