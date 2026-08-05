const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'test@gemini.com',
        username: 'testuser',
        password: hashedPassword,
      },
    });
    console.log('User created:', user);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('User already exists!');
    } else {
      console.error(error);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
