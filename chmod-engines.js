const fs = require('fs');
const path = require('path');

const enginesDir = path.join(__dirname, 'node_modules', '@prisma', 'engines');

try {
  if (fs.existsSync(enginesDir)) {
    const files = fs.readdirSync(enginesDir);
    for (const file of files) {
      const filePath = path.join(enginesDir, file);
      if (fs.statSync(filePath).isFile()) {
        fs.chmodSync(filePath, 0o755); // Set read, write, and execute permissions
        console.log(`Set executable permissions for ${file}`);
      }
    }
  } else {
    console.log('Prisma engines directory not found. Skipping chmod.');
  }
} catch (error) {
  console.error('Error setting permissions for Prisma engines:', error);
}
