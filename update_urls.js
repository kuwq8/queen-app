const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                replaceInDir(fullPath);
            }
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('http://localhost:3001')) {
                content = content.replace(/http:\/\/localhost:3001/g, 'https://queen-app.onrender.com');
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

replaceInDir(path.join(__dirname, 'frontend', 'src'));
console.log('Done!');
