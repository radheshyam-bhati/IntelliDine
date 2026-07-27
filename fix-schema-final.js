const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

schema = schema.replace(/  previewFeatures = \["multiSchema"\]\n/, '');
schema = schema.replace(/  url      = env\("DATABASE_URL"\)\n/, '');

fs.writeFileSync('prisma/schema.prisma', schema);
