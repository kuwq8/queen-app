import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createServer(@Request() req: any, @Body() body: { name: string, slug: string, description?: string, bannerUrl?: string }) {
    return this.communityService.createServer(req.user.sub, body.name, body.slug, body.description, body.bannerUrl);
  }

  @Get()
  async searchServers(@Query('q') q: string) {
    return this.communityService.searchServers(q);
  }

  @Get('check-slug/:slug')
  async checkSlug(@Param('slug') slug: string) {
    return this.communityService.checkSlugAvailability(slug);
  }

  @Get('my-servers')
  @UseGuards(JwtAuthGuard)
  async getMyServers(@Request() req: any) {
    return this.communityService.getUserServers(req.user.sub);
  }

  @Get(':slug')
  async getServerBySlug(@Param('slug') slug: string) {
    return this.communityService.getServerBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':slug/join')
  async joinServer(@Request() req: any, @Param('slug') slug: string) {
    return this.communityService.joinServer(req.user.sub, slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':slug/rooms')
  async createRoom(@Request() req: any, @Param('slug') slug: string, @Body('name') name: string) {
    return this.communityService.createRoom(req.user.sub, slug, name);
  }

  @UseGuards(JwtAuthGuard)
  @Get('rooms/:roomId/messages')
  async getRoomMessages(@Request() req: any, @Param('roomId') roomId: string) {
    return this.communityService.getRoomMessages(req.user.sub, roomId);
  }

  @Get(':slug/settings')
  async getServerSettings(@Param('slug') slug: string) {
    return this.communityService.getServerSettings(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':slug/settings')
  async updateServerSettings(@Request() req: any, @Param('slug') slug: string, @Body() settingsData: any) {
    return this.communityService.updateServerSettings(req.user.sub, slug, settingsData);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':slug/banner')
  async updateServerBanner(@Request() req: any, @Param('slug') slug: string, @Body('bannerUrl') bannerUrl: string) {
    return this.communityService.updateServerBanner(req.user.sub, slug, bannerUrl);
  }
  // --- Roles ---
  @Get(':slug/roles')
  async getRoles(@Param('slug') slug: string) {
    return this.communityService.getRoles(slug);
  }
  @UseGuards(JwtAuthGuard)
  @Post(':slug/roles')
  async createRole(@Request() req: any, @Param('slug') slug: string, @Body() body: any) {
    return this.communityService.createRole(req.user.sub, slug, body);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':slug/roles/:id')
  async updateRole(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.communityService.updateRole(req.user.sub, id, body);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':slug/roles/:id')
  async deleteRole(@Request() req: any, @Param('id') id: string) {
    return this.communityService.deleteRole(req.user.sub, id);
  }

  // --- Shortcuts ---
  @Get(':slug/shortcuts')
  async getShortcuts(@Param('slug') slug: string) {
    return this.communityService.getShortcuts(slug);
  }
  @UseGuards(JwtAuthGuard)
  @Post(':slug/shortcuts')
  async createShortcut(@Request() req: any, @Param('slug') slug: string, @Body() body: { shortcut: string, expansion: string }) {
    return this.communityService.createShortcut(req.user.sub, slug, body.shortcut, body.expansion);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':slug/shortcuts/:id')
  async deleteShortcut(@Request() req: any, @Param('id') id: string) {
    return this.communityService.deleteShortcut(req.user.sub, id);
  }

  // --- Bots ---
  @Get(':slug/bots')
  async getBots(@Param('slug') slug: string) {
    return this.communityService.getBots(slug);
  }
  @UseGuards(JwtAuthGuard)
  @Post(':slug/bots')
  async createBot(@Request() req: any, @Param('slug') slug: string, @Body() body: any) {
    return this.communityService.createBot(req.user.sub, slug, body);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':slug/bots/:id')
  async updateBot(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.communityService.updateBot(req.user.sub, id, body);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':slug/bots/:id')
  async deleteBot(@Request() req: any, @Param('id') id: string) {
    return this.communityService.deleteBot(req.user.sub, id);
  }

  // --- Gifts ---
  @Get(':slug/gifts')
  async getGifts(@Param('slug') slug: string) {
    return this.communityService.getGifts(slug);
  }
  @UseGuards(JwtAuthGuard)
  @Post(':slug/gifts')
  async createGift(@Request() req: any, @Param('slug') slug: string, @Body() body: { name: string, imageUrl: string }) {
    return this.communityService.createGift(req.user.sub, slug, body.name, body.imageUrl);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':slug/gifts/:id')
  async deleteGift(@Request() req: any, @Param('id') id: string) {
    return this.communityService.deleteGift(req.user.sub, id);
  }

  // --- Banners ---
  @Get(':slug/banners')
  async getBanners(@Param('slug') slug: string) {
    return this.communityService.getBanners(slug);
  }
  @UseGuards(JwtAuthGuard)
  @Post(':slug/banners')
  async createBanner(@Request() req: any, @Param('slug') slug: string, @Body() body: { imageUrl: string }) {
    return this.communityService.createBanner(req.user.sub, slug, body.imageUrl);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':slug/banners/:id')
  async deleteBanner(@Request() req: any, @Param('id') id: string) {
    return this.communityService.deleteBanner(req.user.sub, id);
  }

  // --- Domains ---
  @Get(':slug/domains')
  async getDomains(@Param('slug') slug: string) {
    return this.communityService.getDomains(slug);
  }
  @UseGuards(JwtAuthGuard)
  @Post(':slug/domains')
  async createDomain(@Request() req: any, @Param('slug') slug: string, @Body() body: any) {
    return this.communityService.createDomain(req.user.sub, slug, body);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':slug/domains/:id')
  async deleteDomain(@Request() req: any, @Param('id') id: string) {
    return this.communityService.deleteDomain(req.user.sub, id);
  }

  // --- Fake Users ---
  @Get(':slug/fake-users')
  async getFakeUsers(@Param('slug') slug: string) {
    return this.communityService.getFakeUsers(slug);
  }
  @UseGuards(JwtAuthGuard)
  @Post(':slug/fake-users')
  async createFakeUser(@Request() req: any, @Param('slug') slug: string, @Body() body: any) {
    return this.communityService.createFakeUser(req.user.sub, slug, body);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':slug/fake-users/:id')
  async updateFakeUser(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.communityService.updateFakeUser(req.user.sub, id, body);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':slug/fake-users/:id')
  async deleteFakeUser(@Request() req: any, @Param('id') id: string) {
    return this.communityService.deleteFakeUser(req.user.sub, id);
  }

  // --- Emojis ---
  @Get(':slug/emojis')
  async getEmojis(@Param('slug') slug: string) {
    return this.communityService.getEmojis(slug);
  }
  @UseGuards(JwtAuthGuard)
  @Post(':slug/emojis')
  async createEmoji(@Request() req: any, @Param('slug') slug: string, @Body() body: { type: string; url: string }) {
    return this.communityService.createEmoji(req.user.sub, slug, body);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':slug/emojis/:id')
  async deleteEmoji(@Request() req: any, @Param('id') id: string) {
    return this.communityService.deleteEmoji(req.user.sub, id);
  }
}
