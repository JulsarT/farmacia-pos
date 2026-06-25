const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Reemplazar tipos en argumentos y propiedades (id: string => id: number)
  const fields = [
    'id', 'userId', 'customerId', 'productId', 'supplierId', 
    'categoryId', 'laboratoryId', 'lotId', 'purchaseId', 
    'saleId', 'accountPayableId', 'cashRegisterId'
  ];

  for (const field of fields) {
    // field: string
    const regex = new RegExp(`\\b${field}\\s*:\\s*string(?![\\w])`, 'g');
    content = content.replace(regex, `${field}: number`);
    
    // field?: string
    const regexOpt = new RegExp(`\\b${field}\\s*\\?\\s*:\\s*string(?![\\w])`, 'g');
    content = content.replace(regexOpt, `${field}?: number`);

    // Array field: string[]
    const regexArr = new RegExp(`\\b${field}s\\s*:\\s*string\\[\\]`, 'g');
    content = content.replace(regexArr, `${field}s: number[]`);
  }

  // En DTOs, @IsString() -> @IsNumber() o @IsInt() para esos fields.
  // Es complejo con Regex. Haremos un approach mas simple:
  // @IsString()
  // fieldId: string -> @IsInt() fieldId: number
  // Para eso, como ya cambiamos `field: number`, buscaremos `@IsString()` justo encima de algo que sea `: number`?
  // Mejor usamos un replace que reemplace `@IsString()` por `@IsInt()` en las lineas anteriores a los ids.
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed:', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walk(path.join(__dirname, 'src'));
