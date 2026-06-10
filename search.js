const fs = require('fs');
const path = require('path');

function searchFiles(dir, term) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      searchFiles(filePath, term);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(term)) {
        console.log(`Found "${term}" in: ${filePath}`);
      }
    }
  }
}

searchFiles('.', 'NARU');
searchFiles('.', 'Rechercher');
searchFiles('.', 'Demander');
searchFiles('.', 'SAVOIR CE QUE VOUS VOULEZ');
