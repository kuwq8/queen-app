const fs = require('fs');
const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      results = results.concat(walk(file));
    } else {
      if(file.endsWith('page.tsx')) results.push(file);
    }
  });
  return results;
};
const files = walk('src/app');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if(content.includes('export async function generateMetadata')) {
     console.log('Fixing Metadata:', f);
     
     content = content.replace(
       /export async function generateMetadata\([\s\S]*?\{[\s\S]*?params[\s\S]*?\}[\s\S]*?:[\s\S]*?Props,[\s\S]*?parent:[\s\S]*?ResolvingMetadata[\s\S]*?\)[\s\S]*?:[\s\S]*?Promise<Metadata>[\s\S]*?\{/,
       "export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {\n  const resolvedParams = await params;"
     );
     
     // Only replace params.id inside generateMetadata block?
     // Actually we can just do it file-wide if the page uses it. Wait, the Page component also uses params!
     
     fs.writeFileSync(f, content);
  }
});
