const fs = require('fs');
let content = fs.readFileSync('src/components/PostItem.tsx', 'utf8');

content = content.replace('  const router = useRouter();', '  const router = useRouter();\n  const [post, setPost] = useState(initialPost);\n  const isCommentsDisabled = post.community ? false : post.is_comments_disabled;');

fs.writeFileSync('src/components/PostItem.tsx', content);
