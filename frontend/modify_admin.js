const fs = require('fs');

let code = fs.readFileSync('src/app/c/[slug]/admin/page.tsx', 'utf8');

// 1. Add Fake Users states
if (!code.includes('const [fakeUsers, setFakeUsers]')) {
  code = code.replace(
    'const [newDomain, setNewDomain] = useState({ domain: \'\', seoTitle: \'\', seoDescription: \'\', seoKeywords: \'\' });',
    `const [newDomain, setNewDomain] = useState({ domain: '', seoTitle: '', seoDescription: '', seoKeywords: '' });
  const [fakeUsers, setFakeUsers] = useState<any[]>([]);
  const [newFakeUser, setNewFakeUser] = useState({ name: '', status: 'متصل', avatarUrl: '', roleId: '' });
  useEffect(() => {
    if (activeTab === 'settings') {
      const token = localStorage.getItem('token');
      if (token) {
        fetch(\`http://localhost:3001/api/community/\${slug}/fake-users\`, {
          headers: { Authorization: \`Bearer \${token}\` }
        }).then(r => r.json()).then(data => setFakeUsers(data || []));
      }
    }
  }, [activeTab, slug]);`
  );
}

// 2. Add isDefault checkbox to role editor
const isDefaultCheckbox = `
                <label className="flex items-center gap-2 mt-4 text-[#5C4033] font-bold">
                  <input type="checkbox" checked={editingRole.isDefault || false} onChange={e => setEditingRole({...editingRole, isDefault: e.target.checked})} className="w-5 h-5 accent-[#5C4033]" />
                  رتبة افتراضية (تُعطى تلقائياً للأعضاء الجدد)
                </label>
`;
if (!code.includes('رتبة افتراضية')) {
  code = code.replace(
    '                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">',
    isDefaultCheckbox + '\n                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">'
  );
}

// 3. Replace Bots Section
const botsSection = `{/* Bots Section */}
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
               <div>
                 <h3 className="text-lg font-bold text-[#5C4033] mb-4 flex items-center gap-2">
                   <Bot size={24} className="text-[#8B5A2B]" />
                   إدارة العضويات الوهمية (Bots)
                 </h3>
                 <p className="text-sm text-gray-500 mb-6">يمكنك إضافة عضويات وهمية لتظهر في قائمة المتواجدين وللترحيب بالأعضاء الجدد.</p>
                 
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex flex-col gap-4">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <input type="text" placeholder="اسم العضوية الوهمية" value={newFakeUser.name} onChange={e => setNewFakeUser({...newFakeUser, name: e.target.value})} className="border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033]" />
                     <input type="text" placeholder="الحالة (مثال: متصل، مشغول...)" value={newFakeUser.status} onChange={e => setNewFakeUser({...newFakeUser, status: e.target.value})} className="border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033]" />
                     <input type="text" placeholder="رابط الصورة الرمزية" value={newFakeUser.avatarUrl} onChange={e => setNewFakeUser({...newFakeUser, avatarUrl: e.target.value})} className="border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033]" dir="ltr" />
                   </div>
                   <div className="flex items-center gap-4">
                     <select value={newFakeUser.roleId} onChange={e => setNewFakeUser({...newFakeUser, roleId: e.target.value})} className="border border-gray-300 rounded-md p-2 outline-none focus:border-[#5C4033] flex-1">
                       <option value="">-- اختر رتبة العضوية الوهمية --</option>
                       {roles.map(r => (
                         <option key={r.id} value={r.id}>{r.name}</option>
                       ))}
                     </select>
                     <button onClick={async () => {
                       const token = localStorage.getItem('token');
                       const res = await fetch(\`http://localhost:3001/api/community/\${slug}/fake-users\`, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
                         body: JSON.stringify(newFakeUser)
                       });
                       if(res.ok) {
                         const saved = await res.json();
                         setFakeUsers([...fakeUsers, saved]);
                         setNewFakeUser({ name: '', status: 'متصل', avatarUrl: '', roleId: '' });
                         alert('تم إضافة العضوية الوهمية بنجاح!');
                       }
                     }} className="bg-green-600 text-white p-2 px-6 rounded-md font-bold hover:bg-green-700">إضافة العضوية</button>
                   </div>
                 </div>

                 <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-[#5C4033] text-white">
                        <tr>
                          <th className="p-3 text-right">الاسم</th>
                          <th className="p-3 text-center">الحالة</th>
                          <th className="p-3 text-center">الرتبة</th>
                          <th className="p-3 text-center">حذف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fakeUsers.length === 0 ? (
                          <tr className="border-t border-gray-200 text-center text-gray-500">
                            <td colSpan={4} className="p-4">لا توجد عضويات وهمية حالياً.</td>
                          </tr>
                        ) : (
                          fakeUsers.map(f => (
                            <tr key={f.id} className="border-t border-gray-200 text-center">
                              <td className="p-3 text-right font-bold flex items-center gap-2">
                                <img src={f.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed='+f.name} alt="avatar" className="w-8 h-8 rounded-full border border-gray-300" />
                                {f.name}
                              </td>
                              <td className="p-3 text-gray-600">{f.status}</td>
                              <td className="p-3 text-gray-600 font-bold">{roles.find(r => r.id === f.roleId)?.name || '-'}</td>
                              <td className="p-3">
                                <button onClick={async () => {
                                  if(confirm('هل أنت متأكد من حذف هذه العضوية الوهمية؟')) {
                                    const token = localStorage.getItem('token');
                                    await fetch(\`http://localhost:3001/api/community/\${slug}/fake-users/\${f.id}\`, {
                                      method: 'DELETE',
                                      headers: { Authorization: \`Bearer \${token}\` }
                                    });
                                    setFakeUsers(fakeUsers.filter(x => x.id !== f.id));
                                  }
                                }} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"><Ban size={16}/></button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                 </div>
               </div>
             </div>`;

code = code.replace(
  /\{\/\* Bots Section \*\/\}[\s\S]*?\{\/\* Likes Permissions Section \*\/\}/,
  botsSection + '\n\n           {/* Likes Permissions Section */}'
);

fs.writeFileSync('src/app/c/[slug]/admin/page.tsx', code);
console.log('Success');
