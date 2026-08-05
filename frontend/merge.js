const fs = require('fs');
let code = fs.readFileSync('./src/app/c/[slug]/admin/page.tsx', 'utf8');

// 1. Remove the closing of settings tab
code = code.replace(/<div className="md:col-span-2 flex justify-end mt-4 border-t pt-4">\s*<button onClick={handleSaveSettings}.*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*}\)/s, 
`<div className="md:col-span-2 flex justify-end mt-4 border-t pt-4">
                  <button onClick={handleSaveSettings} className="bg-[#5C4033] hover:bg-[#3e2b22] text-white font-bold py-3 px-8 rounded-md shadow-md text-lg">
                    حفظ التغييرات
                  </button>
                </div>
              </div>
              
              {/* MERGED TABS START HERE */}
              <div className="mt-8 border-t-4 border-[#8B5A2B] pt-8">
                <h2 className="text-2xl font-extrabold text-[#5C4033] mb-6">الإعدادات الإضافية</h2>
                <div className="flex flex-col gap-8">
`);

const bottomSectionsRegex = /{\/\* Permissions Tab \(Likes Settings\) \*\/}.*?{\/\* Domains Tab \*\/}.*?<\/div>\s*}\)/s;
const match = code.match(bottomSectionsRegex);

if (match) {
    let bottomSections = match[0];
    
    code = code.replace(bottomSectionsRegex, '');
    
    bottomSections = bottomSections.replace(/{\/\* Permissions Tab \(Likes Settings\) \*\/}\s*{activeTab === 'permissions' && \(/, '{/* Permissions Tab */}');
    bottomSections = bottomSections.replace(/<Save size={18} \/> حفظ إعدادات الصلاحيات\s*<\/button>\s*<\/div>\s*}\)/, '<Save size={18} /> حفظ إعدادات الصلاحيات\n                </button>\n             </div>');
    
    bottomSections = bottomSections.replace(/{\/\* Shortcuts Tab \*\/}\s*{activeTab === 'shortcuts' && \(/, '{/* Shortcuts Tab */}');
    bottomSections = bottomSections.replace(/<Ban size={16}\/><\/button><\/td>\s*<\/tr>\s*<\/tbody>\s*<\/table>\s*<\/div>\s*<\/div>\s*}\)/, '<Ban size={16}/></button></td>\n                      </tr>\n                    </tbody>\n                  </table>\n                </div>\n              </div>');
    
    bottomSections = bottomSections.replace(/{\/\* Bots Tab \*\/}\s*{activeTab === 'bots' && \(/, '{/* Bots Tab */}');
    bottomSections = bottomSections.replace(/<\/div>\s*<\/div>\s*<\/div>\s*}\)/, '</div>\n                </div>\n              </div>');
    
    bottomSections = bottomSections.replace(/{\/\* Gifts Tab \*\/}\s*{activeTab === 'gifts' && \(/, '{/* Gifts Tab */}');
    bottomSections = bottomSections.replace(/<span>لا يوجد بانرات حالياً<\/span>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*}\)/, '<span>لا يوجد بانرات حالياً</span>\n                    </div>\n                  </div>\n                </div>\n              </div>');
    
    bottomSections = bottomSections.replace(/{\/\* Domains Tab \*\/}\s*{activeTab === 'domains' && \(/, '{/* Domains Tab */}');
    bottomSections = bottomSections.replace(/<td colSpan={3} className=\"p-4\">لا توجد نطاقات مربوطة حالياً.<\/td>\s*<\/tr>\s*<\/tbody>\s*<\/table>\s*<\/div>\s*<\/div>\s*}\)/, '<td colSpan={3} className=\"p-4\">لا توجد نطاقات مربوطة حالياً.</td>\n                      </tr>\n                    </tbody>\n                  </table>\n                </div>\n              </div>');
    
    code = code.replace('{/* MERGED TABS START HERE */}', bottomSections + '\n                </div>\n              </div>\n            </div>\n          )}');
    
    fs.writeFileSync('./src/app/c/[slug]/admin/page.tsx', code);
    console.log("Success");
} else {
    console.log("Could not match bottom sections");
}
