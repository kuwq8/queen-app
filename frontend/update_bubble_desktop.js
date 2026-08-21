const fs = require('fs');
let content = fs.readFileSync('src/components/ChannelPostBubble.tsx', 'utf8');

content = content.replace(
  'className="w-[98%] sm:w-[90%] md:w-[80%] bg-[#202c33] rounded-2xl rounded-tr-none p-3 relative shadow-md group"',
  'className="w-[98%] sm:w-[85%] md:w-[70%] lg:w-[60%] xl:w-[55%] bg-[#202c33] rounded-2xl rounded-tr-none p-4 relative shadow-md group"'
);

content = content.replace(
  'className="text-[#e9edef] text-[15px] whitespace-pre-wrap leading-relaxed pb-6 pt-1"',
  'className="text-[#e9edef] text-[15px] sm:text-[16px] whitespace-pre-wrap leading-relaxed sm:leading-7 pb-6 pt-1"'
);

fs.writeFileSync('src/components/ChannelPostBubble.tsx', content);
