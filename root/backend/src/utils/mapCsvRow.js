/**
 * mapCsvRow(row)
 * - Accepts a raw CSV row (object)
 * - Returns a normalized object matching the target schema
 * - Robust case-insensitive header lookup and common header variants handled
 */

function parseNum(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return val;
    const s = String(val).trim();
    if (s === '') return null;
    // Remove currency symbols and commas
    const cleaned = s.replace(/[$₹,]/g, '').replace(/\s+/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
}

function cleanStr(val) {
    if (val === null || val === undefined) return null;
    const s = String(val).trim();
    return s === '' ? null : s;
}

function parseTags(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String).map(s => s.trim()).filter(Boolean);
    return String(val).split(',').map(t => t.trim()).filter(Boolean);
}

function parseDate(val) {
    if (!val) return null;
    const s = String(val).trim();
    if (s === '') return null;

    // ISO first
    // YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = s.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})$/);
    if (isoMatch) {
        const [, y, m, d] = isoMatch;
        return `${y}-${m}-${d}`;
    }

    // DD-MM-YYYY or DD/MM/YYYY
    const dmy = s.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
    if (dmy) {
        const [, dd, mm, yyyy] = dmy;
        return `${yyyy}-${mm}-${dd}`;
    }

    // MM/DD/YYYY (US style)
    const us = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (us) {
        let [, mm, dd, yyyy] = us;
        if (mm.length === 1) mm = '0' + mm;
        if (dd.length === 1) dd = '0' + dd;
        return `${yyyy}-${mm}-${dd}`;
    }

    // Fallback to Date parse (best-effort)
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return null;
}

// Robust, case-insensitive header lookup with common variants
function getValFromRow(row, variants) {
    if (!row || !variants) return null;
    const keys = Object.keys(row);
    const lowerMap = {};
    for (const k of keys) {
        lowerMap[k.trim().toLowerCase()] = row[k];
    }
    for (const v of variants) {
        const key = v.trim().toLowerCase();
        if (key in lowerMap) return lowerMap[key];
    }
    return null;
}

function mapCsvRow(row) {
    if (!row) return null;

    const transactionId = cleanStr(getValFromRow(row, ['Transaction ID', 'transaction id', 'Txn ID', 'TransactionId']));
    const dateRaw = getValFromRow(row, ['Date', 'date', 'Transaction Date', 'Order Date']);
    const customerId = cleanStr(getValFromRow(row, ['Customer ID', 'CustomerId', 'customer id']));
    const customerName = cleanStr(getValFromRow(row, ['Customer Name', 'CustomerName', 'Name', 'Buyer Name']));
    const phone = cleanStr(getValFromRow(row, ['Phone', 'Phone Number', 'PhoneNumber', 'Customer Phone', 'Mobile']));
    const gender = cleanStr(getValFromRow(row, ['Gender', 'gender']));
    const age = parseNum(getValFromRow(row, ['Age', 'age']));
    const region = cleanStr(getValFromRow(row, ['Customer Region', 'Region', 'customer region']));
    const customerType = cleanStr(getValFromRow(row, ['Customer Type', 'Type', 'Customer Category']));

    const productId = cleanStr(getValFromRow(row, ['Product ID', 'ProductId', 'SKU']));
    const productName = cleanStr(getValFromRow(row, ['Product Name', 'product name', 'Item Name']));
    const brand = cleanStr(getValFromRow(row, ['Brand']));
    const category = cleanStr(getValFromRow(row, ['Product Category', 'Category', 'product category']));
    const tagsRaw = getValFromRow(row, ['Tags', 'tags', 'Tag']);

    const quantity = parseNum(getValFromRow(row, ['Quantity', 'quantity', 'Qty']));
    const pricePerUnit = parseNum(getValFromRow(row, ['Price per unit', 'Price per Unit', 'Price', 'Unit Price', 'price']));
    const discountPercentage = parseNum(getValFromRow(row, ['Discount Percentage', 'Discount %', 'Discount', 'Discount Amount']));
    const totalAmount = parseNum(getValFromRow(row, ['Total Amount', 'Total', 'Amount']));
    const finalAmount = parseNum(getValFromRow(row, ['final amount', 'Final Amount', 'Net Amount', 'Amount Paid']));

    const paymentMethod = cleanStr(getValFromRow(row, ['Payment Method', 'Payment', 'PaymentType']));
    const orderStatus = cleanStr(getValFromRow(row, ['Order Status', 'Status', 'OrderStatus']));
    const deliveryType = cleanStr(getValFromRow(row, ['Delivery Type', 'Delivery', 'Shipping Method']));

    const storeId = cleanStr(getValFromRow(row, ['Store ID', 'store id', 'StoreId']));
    const storeLocation = cleanStr(getValFromRow(row, ['Store Location', 'Location', 'Store']));

    const salespersonId = cleanStr(getValFromRow(row, ['Salesperson ID', 'SalespersonId', 'Salesperson']));
    const salespersonName = cleanStr(getValFromRow(row, ['Employee Name', 'Salesperson Name', 'Employee', 'Salesperson']));

    return {
        transaction_id: transactionId,
        date: parseDate(dateRaw),
        customer: {
            id: customerId,
            name: customerName,
            phone: phone,
            gender: gender,
            age: age,
            region: region,
            type: customerType
        },
        product: {
            id: productId,
            name: productName,
            brand: brand,
            category: category,
            tags: parseTags(tagsRaw)
        },
        quantity: quantity,
        price_per_unit: pricePerUnit,
        discount_percentage: discountPercentage,
        total_amount: totalAmount,
        final_amount: finalAmount,
        payment_method: paymentMethod,
        order_status: orderStatus,
        delivery_type: deliveryType,
        store: {
            id: storeId,
            location: storeLocation
        },
        salesperson: {
            id: salespersonId,
            name: salespersonName
        }
    };
}

module.exports = { mapCsvRow };
