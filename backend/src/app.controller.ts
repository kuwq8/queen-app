import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Res() res: Response) {
    // إعادة التوجيه التلقائي إلى واجهة Vercel الأساسية
    return res.redirect(301, 'https://queen-app-six.vercel.app/');
  }
}
