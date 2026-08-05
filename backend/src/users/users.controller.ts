import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, NotFoundException, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../multer.config';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('search')
  async searchUsers(@Query('q') q: string, @Query('followingOnly') followingOnly: string, @Request() req: any) {
    // try to get user id if logged in
    let userId = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.sub;
      } catch (e) {}
    }
    return this.usersService.searchUsers(q, userId, followingOnly === 'true');
  }

  @UseGuards(JwtAuthGuard)
  @Patch('privacy')
  async updatePrivacy(@Request() req: any, @Body('allowDirectMessages') allowDirectMessages: boolean) {
    return this.usersService.updatePrivacy(req.user.sub, allowDirectMessages);
  }

  @Get('bookmarks')
  async getBookmarks(@Request() req: any) {
    return this.usersService.getUserBookmarks(req.user.sub);
  }

  @Get(':username')
  async getProfile(@Param('username') username: string, @Request() req: any) {
    const profile = await this.usersService.getUserProfile(username, req.user.sub);
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }

  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() body: any) {
    return this.usersService.updateProfile(req.user.sub, body);
  }

  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const avatarUrl = `http://localhost:3001/uploads/${file.filename}`;
    await this.usersService.updateAvatar(req.user.sub, avatarUrl);
    return { avatarUrl };
  }

  @Post('profile/cover')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadCover(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const coverUrl = `http://localhost:3001/uploads/${file.filename}`;
    await this.usersService.updateCover(req.user.sub, coverUrl);
    return { coverUrl };
  }

  @Post(':username/follow')
  async toggleFollow(@Param('username') username: string, @Request() req: any) {
    try {
      return await this.usersService.toggleFollow(username, req.user.sub);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  @Get(':username/posts')
  async getUserPosts(@Param('username') username: string, @Request() req: any) {
    return this.usersService.getUserPosts(username, req.user.sub);
  }
}
