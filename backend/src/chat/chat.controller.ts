import { Controller, Get, Post, Body, Request, UseGuards, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../multer.config';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  async getUserRooms(@Request() req: any) {
    return this.chatService.getUserRooms(req.user.sub);
  }

  @Get('rooms/:id')
  async getRoom(@Param('id') roomId: string, @Request() req: any) {
    return this.chatService.getRoom(roomId, req.user.sub);
  }

  @Post('rooms')
  async createRoom(@Request() req: any, @Body() data: { usernames: string[], isGroup?: boolean, name?: string }) {
    return this.chatService.createRoom(req.user.sub, data.usernames, data.isGroup, data.name);
  }

  @Get(':roomId/messages')
  async getMessages(@Request() req: any, @Param('roomId') roomId: string) {
    return this.chatService.getRoomMessages(roomId, req.user.sub);
  }

  @Post('media')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  uploadMedia(@UploadedFile() file: Express.Multer.File) {
    return { mediaUrl: `http://localhost:3001/${file.filename}` };
  }
}
