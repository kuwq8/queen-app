const fs = require('fs');
let content = fs.readFileSync('src/app/communities/[id]/ClientPage.tsx', 'utf8');

const brokenJSX = `{currentUserId === community?.creator_id && (
        {currentUserId === community?.creator_id && (<button 
          onClick={() => setIsComposeOpen(true)}
          className="absolute bottom-20 left-4 bg-sky-600 hover:bg-sky-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-sky-500/30 z-40 transition-colors"
        >
          <Feather size={24} />
        </button>)}
      )}`;

const fixedJSX = `{currentUserId === community?.creator_id && (
        <button 
          onClick={() => setIsComposeOpen(true)}
          className="absolute bottom-20 left-4 bg-sky-600 hover:bg-sky-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-sky-500/30 z-40 transition-colors"
        >
          <Feather size={24} />
        </button>
      )}`;

content = content.replace(brokenJSX, fixedJSX);
fs.writeFileSync('src/app/communities/[id]/ClientPage.tsx', content);
