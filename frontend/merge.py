import re

with open('./src/app/c/[slug]/admin/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

start_idx = code.find("{/* Requests Tab */}")
end_idx = code.find("{/* Permissions Tab (Likes Settings) */}")

if start_idx == -1 or end_idx == -1:
    print("Could not find delimiters")
    exit(1)

middle_chunk = code[start_idx:end_idx]

code = code[:start_idx] + code[end_idx:]

end_of_tabs_idx = code.find("        </div>\n      </div>\n    </div>")
if end_of_tabs_idx != -1:
    code = code[:end_of_tabs_idx] + middle_chunk + code[end_of_tabs_idx:]
else:
    print("Could not find end of tabs")
    exit(1)

code = re.sub(
    r'(<Save size=\{18\} \/> حفظ التغييرات\s*<\/button>\s*<\/div>\s*<\/div>\s*)\)}\s*{/\* Permissions Tab', 
    r'\1\n{/* MERGED TABS START */}\n{/* Permissions Tab', 
    code
)

code = re.sub(r'{\/\* Permissions Tab \(Likes Settings\) \*\/}\s*{activeTab === \'permissions\' && \(', '{/* Permissions Section */}', code)
code = re.sub(r'<Save size=\{18\} \/> حفظ إعدادات الصلاحيات\s*<\/button>\s*<\/div>\s*}\)', '<Save size={18} /> حفظ إعدادات الصلاحيات\n                </button>\n             </div>', code)

code = re.sub(r'{\/\* Shortcuts Tab \*\/}\s*{activeTab === \'shortcuts\' && \(', '{/* Shortcuts Section */}', code)
code = re.sub(r'<Ban size=\{16\}\/><\/button><\/td>\s*<\/tr>\s*<\/tbody>\s*<\/table>\s*<\/div>\s*<\/div>\s*}\)', '<Ban size={16}/></button></td>\n                      </tr>\n                    </tbody>\n                  </table>\n                </div>\n              </div>', code)

code = re.sub(r'{\/\* Bots Tab \*\/}\s*{activeTab === \'bots\' && \(', '{/* Bots Section */}', code)
code = re.sub(r'<\/div>\s*<\/div>\s*<\/div>\s*}\)', '</div>\n                </div>\n              </div>', code)

code = re.sub(r'{\/\* Gifts Tab \*\/}\s*{activeTab === \'gifts\' && \(', '{/* Gifts Section */}', code)
code = re.sub(r'<span>لا يوجد بانرات حالياً<\/span>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*}\)', '<span>لا يوجد بانرات حالياً</span>\n                    </div>\n                  </div>\n                </div>\n              </div>', code)

code = re.sub(r'{\/\* Domains Tab \*\/}\s*{activeTab === \'domains\' && \(', '{/* Domains Section */}', code)
code = re.sub(r'<td colSpan=\{3\} className="p-4">لا توجد نطاقات مربوطة حالياً\.<\/td>\s*<\/tr>\s*<\/tbody>\s*<\/table>\s*<\/div>\s*<\/div>\s*}\)', '<td colSpan={3} className="p-4">لا توجد نطاقات مربوطة حالياً.</td>\n                      </tr>\n                    </tbody>\n                  </table>\n                </div>\n              </div>\n            {/* CLOSE SETTINGS TAB */}\n            )}\n', code)


with open('./src/app/c/[slug]/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Success")
