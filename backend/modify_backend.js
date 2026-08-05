const fs = require('fs');

// --- 1. Modify community.service.ts ---
let serviceCode = fs.readFileSync('src/community/community.service.ts', 'utf8');

// Fix createRole to handle isDefault
serviceCode = serviceCode.replace(
  /async createRole\(userId: string, slug: string, data: any\) \{/,
  `async createRole(userId: string, slug: string, data: any) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server || server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    if (data.isDefault) {
      await this.prisma.communityRole.updateMany({ where: { serverId: server.id }, data: { isDefault: false } });
    }`
);

// Fix updateRole to handle isDefault
serviceCode = serviceCode.replace(
  /async updateRole\(userId: string, id: string, data: any\) \{/,
  `async updateRole(userId: string, id: string, data: any) {
    const r = await this.prisma.communityRole.findUnique({ where: { id }, include: { server: true } });
    if (!r || r.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    if (data.isDefault) {
      await this.prisma.communityRole.updateMany({ where: { serverId: r.serverId }, data: { isDefault: false } });
    }`
);

// Append FakeUsers to service
serviceCode += `
  // --- Fake Users ---
  async getFakeUsers(slug: string) {
    return this.prisma.communityFakeUser.findMany({ where: { server: { slug } }, include: { role: true } });
  }
  async createFakeUser(userId: string, slug: string, data: any) {
    const server = await this.prisma.communityServer.findUnique({ where: { slug } });
    if (!server || server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityFakeUser.create({ data: { ...data, serverId: server.id } });
  }
  async updateFakeUser(userId: string, id: string, data: any) {
    const f = await this.prisma.communityFakeUser.findUnique({ where: { id }, include: { server: true } });
    if (!f || f.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityFakeUser.update({ where: { id }, data });
  }
  async deleteFakeUser(userId: string, id: string) {
    const f = await this.prisma.communityFakeUser.findUnique({ where: { id }, include: { server: true } });
    if (!f || f.server.ownerId !== userId) throw new BadRequestException('Unauthorized');
    return this.prisma.communityFakeUser.delete({ where: { id } });
  }
}
`;

// Remove trailing } so it appends nicely inside the class
serviceCode = serviceCode.replace(/\}\s*$/, ''); // replace last closing brace
serviceCode += `
}
`;
fs.writeFileSync('src/community/community.service.ts', serviceCode);


// --- 2. Modify community.controller.ts ---
let controllerCode = fs.readFileSync('src/community/community.controller.ts', 'utf8');

// Append FakeUsers to controller
controllerCode = controllerCode.replace(/\}\s*$/, ''); // replace last closing brace
controllerCode += `
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
}
`;
fs.writeFileSync('src/community/community.controller.ts', controllerCode);

console.log('Success!');
