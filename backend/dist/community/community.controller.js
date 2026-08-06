"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityController = void 0;
const common_1 = require("@nestjs/common");
const community_service_1 = require("./community.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let CommunityController = class CommunityController {
    communityService;
    constructor(communityService) {
        this.communityService = communityService;
    }
    async createServer(req, body) {
        return this.communityService.createServer(req.user.sub, body.name, body.slug, body.description, body.bannerUrl);
    }
    async searchServers(q) {
        return this.communityService.searchServers(q);
    }
    async checkSlug(slug) {
        return this.communityService.checkSlugAvailability(slug);
    }
    async getMyServers(req) {
        return this.communityService.getUserServers(req.user.sub);
    }
    async getServerBySlug(slug) {
        return this.communityService.getServerBySlug(slug);
    }
    async joinServer(req, slug) {
        return this.communityService.joinServer(req.user.sub, slug);
    }
    async createRoom(req, slug, name) {
        return this.communityService.createRoom(req.user.sub, slug, name);
    }
    async getRoomMessages(req, roomId) {
        return this.communityService.getRoomMessages(req.user.sub, roomId);
    }
    async getServerSettings(slug) {
        return this.communityService.getServerSettings(slug);
    }
    async updateServerSettings(req, slug, settingsData) {
        return this.communityService.updateServerSettings(req.user.sub, slug, settingsData);
    }
    async updateServerBanner(req, slug, bannerUrl) {
        return this.communityService.updateServerBanner(req.user.sub, slug, bannerUrl);
    }
    async getRoles(slug) {
        return this.communityService.getRoles(slug);
    }
    async createRole(req, slug, body) {
        return this.communityService.createRole(req.user.sub, slug, body);
    }
    async updateRole(req, id, body) {
        return this.communityService.updateRole(req.user.sub, id, body);
    }
    async deleteRole(req, id) {
        return this.communityService.deleteRole(req.user.sub, id);
    }
    async getShortcuts(slug) {
        return this.communityService.getShortcuts(slug);
    }
    async createShortcut(req, slug, body) {
        return this.communityService.createShortcut(req.user.sub, slug, body.shortcut, body.expansion);
    }
    async deleteShortcut(req, id) {
        return this.communityService.deleteShortcut(req.user.sub, id);
    }
    async getBots(slug) {
        return this.communityService.getBots(slug);
    }
    async createBot(req, slug, body) {
        return this.communityService.createBot(req.user.sub, slug, body);
    }
    async updateBot(req, id, body) {
        return this.communityService.updateBot(req.user.sub, id, body);
    }
    async deleteBot(req, id) {
        return this.communityService.deleteBot(req.user.sub, id);
    }
    async getGifts(slug) {
        return this.communityService.getGifts(slug);
    }
    async createGift(req, slug, body) {
        return this.communityService.createGift(req.user.sub, slug, body.name, body.imageUrl);
    }
    async deleteGift(req, id) {
        return this.communityService.deleteGift(req.user.sub, id);
    }
    async getBanners(slug) {
        return this.communityService.getBanners(slug);
    }
    async createBanner(req, slug, body) {
        return this.communityService.createBanner(req.user.sub, slug, body.imageUrl);
    }
    async deleteBanner(req, id) {
        return this.communityService.deleteBanner(req.user.sub, id);
    }
    async getDomains(slug) {
        return this.communityService.getDomains(slug);
    }
    async createDomain(req, slug, body) {
        return this.communityService.createDomain(req.user.sub, slug, body);
    }
    async deleteDomain(req, id) {
        return this.communityService.deleteDomain(req.user.sub, id);
    }
    async getFakeUsers(slug) {
        return this.communityService.getFakeUsers(slug);
    }
    async createFakeUser(req, slug, body) {
        return this.communityService.createFakeUser(req.user.sub, slug, body);
    }
    async updateFakeUser(req, id, body) {
        return this.communityService.updateFakeUser(req.user.sub, id, body);
    }
    async deleteFakeUser(req, id) {
        return this.communityService.deleteFakeUser(req.user.sub, id);
    }
    async getEmojis(slug) {
        return this.communityService.getEmojis(slug);
    }
    async createEmoji(req, slug, body) {
        return this.communityService.createEmoji(req.user.sub, slug, body);
    }
    async deleteEmoji(req, id) {
        return this.communityService.deleteEmoji(req.user.sub, id);
    }
};
exports.CommunityController = CommunityController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createServer", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "searchServers", null);
__decorate([
    (0, common_1.Get)('check-slug/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "checkSlug", null);
__decorate([
    (0, common_1.Get)('my-servers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getMyServers", null);
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getServerBySlug", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':slug/join'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "joinServer", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':slug/rooms'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __param(2, (0, common_1.Body)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createRoom", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('rooms/:roomId/messages'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('roomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getRoomMessages", null);
__decorate([
    (0, common_1.Get)(':slug/settings'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getServerSettings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':slug/settings'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "updateServerSettings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':slug/banner'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __param(2, (0, common_1.Body)('bannerUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "updateServerBanner", null);
__decorate([
    (0, common_1.Get)(':slug/roles'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getRoles", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':slug/roles'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createRole", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':slug/roles/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "updateRole", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':slug/roles/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Get)(':slug/shortcuts'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getShortcuts", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':slug/shortcuts'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createShortcut", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':slug/shortcuts/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "deleteShortcut", null);
__decorate([
    (0, common_1.Get)(':slug/bots'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getBots", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':slug/bots'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createBot", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':slug/bots/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "updateBot", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':slug/bots/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "deleteBot", null);
__decorate([
    (0, common_1.Get)(':slug/gifts'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getGifts", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':slug/gifts'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createGift", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':slug/gifts/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "deleteGift", null);
__decorate([
    (0, common_1.Get)(':slug/banners'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getBanners", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':slug/banners'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createBanner", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':slug/banners/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "deleteBanner", null);
__decorate([
    (0, common_1.Get)(':slug/domains'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getDomains", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':slug/domains'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createDomain", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':slug/domains/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "deleteDomain", null);
__decorate([
    (0, common_1.Get)(':slug/fake-users'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getFakeUsers", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':slug/fake-users'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createFakeUser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':slug/fake-users/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "updateFakeUser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':slug/fake-users/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "deleteFakeUser", null);
__decorate([
    (0, common_1.Get)(':slug/emojis'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "getEmojis", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':slug/emojis'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('slug')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "createEmoji", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':slug/emojis/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CommunityController.prototype, "deleteEmoji", null);
exports.CommunityController = CommunityController = __decorate([
    (0, common_1.Controller)('community'),
    __metadata("design:paramtypes", [community_service_1.CommunityService])
], CommunityController);
//# sourceMappingURL=community.controller.js.map