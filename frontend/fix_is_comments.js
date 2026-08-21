const fs = require('fs');
let content = fs.readFileSync('src/components/PostItem.tsx', 'utf8');

// Remove any lines containing isCommentsDisabled = post.community
const lines = content.split(/\r?\n/);
const cleanedLines = lines.filter(l => !l.includes('isCommentsDisabled = post.community'));
content = cleanedLines.join('\n');

content = content.replace('const [post, setPost] = useState(initialPost);', 'const [post, setPost] = useState(initialPost);\n  const isCommentsDisabled = post.community ? false : post.is_comments_disabled;');

fs.writeFileSync('src/components/PostItem.tsx', content);
