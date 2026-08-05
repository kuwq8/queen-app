import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Request, BadRequestException, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../multer.config';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  async createPost(@Request() req: any, @Body('content') content: string, @Body('mediaUrl') mediaUrl?: string, @Body('quotePostId') quotePostId?: string) {
    return this.postsService.createPost(req.user.sub, content, mediaUrl, quotePostId);
  }

  @Post('media')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadMedia(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const mediaUrl = `http://localhost:3001/uploads/${file.filename}`;
    return { mediaUrl };
  }

  @Get()
  async getFeed(@Request() req: any, @Query('followingOnly') followingOnly?: string) {
    return this.postsService.getFeed(req.user.sub, followingOnly === 'true');
  }

  @Patch(':id')
  async updatePost(@Param('id') id: string, @Request() req: any, @Body('content') content: string) {
    try {
      return await this.postsService.updatePost(id, req.user.sub, content);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string, @Request() req: any) {
    try {
      return await this.postsService.deletePost(id, req.user.sub);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Request() req: any) {
    return this.postsService.toggleLike(req.user.sub, id);
  }

  @Post(':id/bookmark')
  async toggleBookmark(@Param('id') id: string, @Request() req: any) {
    return this.postsService.toggleBookmark(req.user.sub, id);
  }

  @Post(':id/comments')
  async addComment(@Param('id') id: string, @Request() req: any, @Body('content') content?: string, @Body('mediaUrl') mediaUrl?: string) {
    if (!content && !mediaUrl) throw new BadRequestException('Content or media is required');
    return this.postsService.addComment(req.user.sub, id, content, mediaUrl);
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return this.postsService.getPostComments(id);
  }

  @Post(':id/repost')
  async toggleRepost(@Param('id') id: string, @Request() req: any) {
    return this.postsService.toggleRepost(req.user.sub, id);
  }
}
