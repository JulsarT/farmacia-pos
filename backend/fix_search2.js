const fs = require('fs');
const files = [
  'src/customers/customers.service.ts',
  'src/purchases/purchases.service.ts',
  'src/suppliers/suppliers.service.ts',
  'src/products/products.service.ts',
  'src/sales/sales.service.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/mode: 'insensitive'/g, "mode: 'insensitive' as const");
  fs.writeFileSync(file, content);
});

console.log('Case-insensitive search casted.');
