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
  content = content.replace(/contains: search/g, "contains: search, mode: 'insensitive'");
  fs.writeFileSync(file, content);
});

console.log('Case-insensitive search applied.');
