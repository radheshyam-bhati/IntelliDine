const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const map = {
  'restaurantId': 'restaurant_id',
  'createdAt': 'created_at',
  'taxRate': 'tax_rate',
  'serviceChargeRate': 'service_charge_rate',
  'displayOrder': 'display_order',
  'categoryId': 'category_id',
  'imageUrl': 'image_url',
  'dietaryTags': 'dietary_tags',
  'isAvailable': 'is_available',
  'isManualOverride': 'is_manual_override',
  'availabilityWindow': 'availability_window',
  'currentStock': 'current_stock',
  'reorderThreshold': 'reorder_threshold',
  'supplierName': 'supplier_name',
  'menuItemId': 'menu_item_id',
  'ingredientId': 'ingredient_id',
  'quantityRequired': 'quantity_required',
  'tableId': 'table_id',
  'customerId': 'customer_id',
  'createdByUserId': 'created_by_user_id',
  'orderId': 'order_id',
  'specialRequest': 'special_request',
  'unitPriceAtOrder': 'unit_price_at_order',
  'orderIds': 'order_ids',
  'taxAmount': 'tax_amount',
  'serviceChargeAmount': 'service_charge_amount',
  'paymentStatus': 'payment_status',
  'paymentReference': 'payment_reference',
  'customerName': 'customer_name',
  'customerPhone': 'customer_phone',
  'partySize': 'party_size',
  'reservedFor': 'reserved_for',
  'joinedAt': 'joined_at',
  'changeAmount': 'change_amount',
  'forecastDate': 'forecast_date',
  'predictedQuantity': 'predicted_quantity',
  'generatedAt': 'generated_at',
};

const lines = schema.split('\n');
const newLines = lines.map(line => {
  if (line.includes('@map') || line.includes('@@map')) return line;
  if (!line.trim() || line.startsWith('model') || line.startsWith('}') || line.startsWith('//') || line.includes('{')) return line;
  
  for (const [camel, snake] of Object.entries(map)) {
    // regex to match the exact field name
    const regex = new RegExp(`^(\\s+)${camel}(\\s+\\w+)`);
    if (regex.test(line)) {
      line = line.replace(regex, `$1${camel}$2`);
      line += ` @map("${snake}")`;
      break;
    }
  }
  return line;
});

// also rename full_name to name or ensure full_name exists on User
let inUser = false;
for (let i = 0; i < newLines.length; i++) {
  if (newLines[i].startsWith('model User {')) inUser = true;
  if (inUser && newLines[i].startsWith('}')) inUser = false;
  
  if (inUser) {
    if (newLines[i].includes('updatedAt')) {
      newLines[i] = '// ' + newLines[i]; // remove updatedAt
    }
    if (newLines[i].includes('name          String?')) {
      newLines[i] = `  fullName      String? @map("full_name")\n` + newLines[i];
    }
  }
}

fs.writeFileSync('prisma/schema.prisma', newLines.join('\n'));
