import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Successfully connected to the database.');
    } catch (error: any) {
      console.error('FAILED TO CONNECT TO PRISMA. Error Message:', error.message);
      console.error('Prisma Error Details:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
