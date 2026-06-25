const fs = require('fs');

let content = fs.readFileSync('src/products/products.controller.ts', 'utf8');
content = "import { Roles } from '../auth/roles.decorator';\n" + content;

// Replace all @Post, @Put, @Delete to include @Roles('ADMIN', 'FARMACEUTICO')
content = content.replace(/@Post/g, "@Roles('ADMIN', 'FARMACEUTICO')\n  @Post");
content = content.replace(/@Put/g, "@Roles('ADMIN', 'FARMACEUTICO')\n  @Put");
content = content.replace(/@Delete/g, "@Roles('ADMIN', 'FARMACEUTICO')\n  @Delete");

fs.writeFileSync('src/products/products.controller.ts', content);
console.log('Products updated.');
