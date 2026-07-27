const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Add previewFeatures = ["multiSchema"] to generator
schema = schema.replace(
  /generator client \{\n  provider = "prisma-client-js"\n\}/,
  'generator client {\n  provider = "prisma-client-js"\n  previewFeatures = ["multiSchema"]\n}'
);

// Add schemas = ["intellidine"] to datasource
schema = schema.replace(
  /datasource db \{\n  provider = "postgresql"\n\}/,
  'datasource db {\n  provider = "postgresql"\n  schemas  = ["intellidine", "public"]\n}'
);

// Add @@schema("intellidine") to all models
const lines = schema.split('\n');
let inModel = false;
let newLines = [];
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (line.startsWith('model ') || line.startsWith('enum ')) {
    inModel = true;
  }
  if (inModel && line.startsWith('}')) {
    newLines.push('  @@schema("intellidine")');
    inModel = false;
  }
  newLines.push(line);
}

fs.writeFileSync('prisma/schema.prisma', newLines.join('\n'));
