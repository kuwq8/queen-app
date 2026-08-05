const fs = require('fs');

let code = fs.readFileSync('src/app/c/[slug]/admin/page.tsx', 'utf8');

// Replace domain inputs
code = code.replace(
  /<input type="text" className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-\[#5C4033\]" dir="ltr" \/>/,
  '<input type="text" value={newDomain.domain} onChange={e => setNewDomain({...newDomain, domain: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033]" dir="ltr" />'
);

code = code.replace(
  /<input type="text" className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-\[#5C4033\]" \/>/,
  '<input type="text" value={newDomain.seoTitle} onChange={e => setNewDomain({...newDomain, seoTitle: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033]" />'
);

code = code.replace(
  /<textarea className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-\[#5C4033\] min-h-\[60px\]" \/>/,
  '<textarea value={newDomain.seoDescription} onChange={e => setNewDomain({...newDomain, seoDescription: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033] min-h-[60px]" />'
);

code = code.replace(
  /<input type="text" className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-\[#5C4033\]" placeholder="شات، تعارف، دردشة\.\.\." \/>/,
  '<input type="text" value={newDomain.seoKeywords} onChange={e => setNewDomain({...newDomain, seoKeywords: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033]" placeholder="شات، تعارف، دردشة..." />'
);

// Replace submit button
code = code.replace(
  /<button onClick=\{\(\) => alert\('تم حفظ وإضافة النطاق بنجاح!'\)\} className="bg-green-600 text-white p-2 px-6 rounded-md font-bold hover:bg-green-700 w-full md:w-auto">حفظ وإضافة النطاق<\/button>/,
  `<button onClick={async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(\`http://localhost:3001/api/community/\${slug}/domains\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify(newDomain)
      });
      if(res.ok) {
        const saved = await res.json();
        setDomains([...domains, saved]);
        setNewDomain({ domain: '', seoTitle: '', seoDescription: '', seoKeywords: '' });
        alert('تم إضافة النطاق بنجاح!');
      } else {
        alert('حدث خطأ أثناء إضافة النطاق (تأكد من صحة النطاق وعدم تكراره)');
      }
    } catch(e) { alert('خطأ في الاتصال بالسيرفر'); }
  }} className="bg-green-600 text-white p-2 px-6 rounded-md font-bold hover:bg-green-700 w-full md:w-auto">حفظ وإضافة النطاق</button>`
);

// Replace empty domains table row
code = code.replace(
  /<tr className="border-t border-gray-200 text-center text-gray-500">\s*<td colSpan=\{3\} className="p-4">لا توجد نطاقات مربوطة حالياً\.<\/td>\s*<\/tr>/,
  `{domains.length === 0 ? (
                        <tr className="border-t border-gray-200 text-center text-gray-500">
                          <td colSpan={3} className="p-4">لا توجد نطاقات مربوطة حالياً.</td>
                        </tr>
                      ) : (
                        domains.map(d => (
                          <tr key={d.id} className="border-t border-gray-200 text-center">
                            <td className="p-3 text-left pl-4 font-bold" dir="ltr">{d.domain}</td>
                            <td className="p-3 text-gray-600 font-bold">{d.seoTitle || '-'}</td>
                            <td className="p-3">
                              <button onClick={async () => {
                                if(confirm('هل أنت متأكد من حذف هذا النطاق؟')) {
                                  const token = localStorage.getItem('token');
                                  await fetch(\`http://localhost:3001/api/community/\${slug}/domains/\${d.id}\`, {
                                    method: 'DELETE',
                                    headers: { Authorization: \`Bearer \${token}\` }
                                  });
                                  setDomains(domains.filter(x => x.id !== d.id));
                                }
                              }} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"><Ban size={16}/></button>
                            </td>
                          </tr>
                        ))
                      )}`
);

fs.writeFileSync('src/app/c/[slug]/admin/page.tsx', code);
console.log('Success');
