const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.communityServer.findFirst().then(s => {
    if(!s) return console.log('No server');
    p.communityServer.delete({where:{id:s.id}})
    .then(res => console.log('Deleted:', res))
    .catch(e => {
        console.log('Prisma Error:', e.message);
    }).finally(() => p.$disconnect());
});
