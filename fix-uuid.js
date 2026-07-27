const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

schema = schema.replace(/customerId(\s+)String\?(\s+)@map\("customer_id"\)/g, 'customerId$1String? @db.Uuid$2@map("customer_id")');
schema = schema.replace(/createdByUserId(\s+)String\?(\s+)@map\("created_by_user_id"\)/g, 'createdByUserId$1String? @db.Uuid$2@map("created_by_user_id")');
schema = schema.replace(/tableId(\s+)String\?(\s+)@map\("table_id"\)/g, 'tableId$1String? @db.Uuid$2@map("table_id")');

fs.writeFileSync('prisma/schema.prisma', schema);
