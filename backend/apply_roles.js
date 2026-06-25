const fs = require('fs');
const controllers = [
  { path: 'src/users/users.controller.ts', roles: "@Roles('ADMIN')" },
  { path: 'src/config/config.controller.ts', roles: "@Roles('ADMIN')" },
  { path: 'src/purchases/purchases.controller.ts', roles: "@Roles('ADMIN', 'FARMACEUTICO')" },
  { path: 'src/suppliers/suppliers.controller.ts', roles: "@Roles('ADMIN', 'FARMACEUTICO')" },
  { path: 'src/inventory/inventory.controller.ts', roles: "@Roles('ADMIN', 'FARMACEUTICO')" },
  { path: 'src/reports/reports.controller.ts', roles: "@Roles('ADMIN')" },
];

controllers.forEach(c => {
  let content = fs.readFileSync(c.path, 'utf8');
  content = "import { Roles } from '../auth/roles.decorator';\n" + content;
  content = content.replace(/@Controller\('/, `${c.roles}\n@Controller('`);
  fs.writeFileSync(c.path, content);
});

console.log('Controllers updated.');
