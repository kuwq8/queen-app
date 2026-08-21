const fs = require('fs');
let content = fs.readFileSync('src/components/PostItem.tsx', 'utf8');

const regex = /<div className="relative group">\s*<button\s*onClick=\{handleRepost\}[\s\S]*?<\/button>\s*<\/div>/;

if (regex.test(content)) {
  content = content.replace(regex, (match) => {
    return '{!post.community?.is_private && (\n' + match + '\n)}';
  });
  fs.writeFileSync('src/components/PostItem.tsx', content);
  console.log('Successfully updated PostItem retweet button.');
} else {
  console.log('Regex failed.');
}
