const fs = require('fs');
let code = fs.readFileSync('./src/app/c/[slug]/admin/page.tsx', 'utf8');

const startDelim = '{/* Requests Tab */}';
const endDelim = '{/* Permissions Tab (Likes Settings) */}';

const startIdx = code.indexOf(startDelim);
const endIdx = code.indexOf(endDelim);

if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find delimiters");
    process.exit(1);
}

const middleChunk = code.substring(startIdx, endIdx);
code = code.substring(0, startIdx) + code.substring(endIdx);

const endOfTabsDelim = '        </div>\n      </div>\n    </div>';
const endOfTabsIdx = code.lastIndexOf(endOfTabsDelim);

if (endOfTabsIdx !== -1) {
    code = code.substring(0, endOfTabsIdx) + middleChunk + code.substring(endOfTabsIdx);
} else {
    console.error("Could not find end of tabs");
    process.exit(1);
}

// Fix settings tab ending
const settingsEndRegex = /(<Save size=\{18\} \/> حفظ التغييرات\s*<\/button>\s*<\/div>\s*<\/div>\s*)\)}\s*{\/\* Permissions Tab/;
code = code.replace(settingsEndRegex, '$1\n{/* MERGED TABS START */}\n{/* Permissions Tab');

code = code.replace(/{\/\* Permissions Tab \(Likes Settings\) \*\/}\s*{activeTab === 'permissions' && \(/, '{/* Permissions Section */}');
code = code.replace(/<Save size=\{18\} \/> حفظ إعدادات الصلاحيات\s*<\/button>\s*<\/div>\s*}\)/, '<Save size={18} /> حفظ إعدادات الصلاحيات\\n                </button>\\n             </div>');

code = code.replace(/{\/\* Shortcuts Tab \*\/}\s*{activeTab === 'shortcuts' && \(/, '{/* Shortcuts Section */}');
code = code.replace(/<Ban size=\{16\}\/><\/button><\/td>\s*<\/tr>\s*<\/tbody>\s*<\/table>\s*<\/div>\s*<\/div>\s*}\)/, '<Ban size={16}/></button></td>\\n                      </tr>\\n                    </tbody>\\n                  </table>\\n                </div>\\n              </div>');

code = code.replace(/{\/\* Bots Tab \*\/}\s*{activeTab === 'bots' && \(/, '{/* Bots Section */}');
code = code.replace(/<\/div>\s*<\/div>\s*<\/div>\s*}\)/, '</div>\\n                </div>\\n              </div>');

code = code.replace(/{\/\* Gifts Tab \*\/}\s*{activeTab === 'gifts' && \(/, '{/* Gifts Section */}');
code = code.replace(/<span>لا يوجد بانرات حالياً<\/span>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*}\)/, '<span>لا يوجد بانرات حالياً</span>\\n                    </div>\\n                  </div>\\n                </div>\\n              </div>');

code = code.replace(/{\/\* Domains Tab \*\/}\s*{activeTab === 'domains' && \(/, '{/* Domains Section */}');
code = code.replace(/<td colSpan=\{3\} className="p-4">لا توجد نطاقات مربوطة حالياً\.<\/td>\s*<\/tr>\s*<\/tbody>\s*<\/table>\s*<\/div>\s*<\/div>\s*}\)/, '<td colSpan={3} className="p-4">لا توجد نطاقات مربوطة حالياً.</td>\\n                      </tr>\\n                    </tbody>\\n                  </table>\\n                </div>\\n              </div>\\n            {/* CLOSE SETTINGS TAB */}\\n            )}\\n');

fs.writeFileSync('./src/app/c/[slug]/admin/page.tsx', code);
console.log("Success");
