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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_config_1 = require("../multer.config");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async searchUsers(q, followingOnly, req) {
        let userId = null;
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(' ')[1];
            try {
                const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                userId = payload.sub;
            }
            catch (e) { }
        }
        return this.usersService.searchUsers(q, userId, followingOnly === 'true');
    }
    async updatePrivacy(req, allowDirectMessages) {
        return this.usersService.updatePrivacy(req.user.sub, allowDirectMessages);
    }
    async getBookmarks(req) {
        return this.usersService.getUserBookmarks(req.user.sub);
    }
    async getProfile(username, req) {
        const profile = await this.usersService.getUserProfile(username, req.user.sub);
        if (!profile)
            throw new common_1.NotFoundException('User not found');
        return profile;
    }
    async updateProfile(req, body) {
        return this.usersService.updateProfile(req.user.sub, body);
    }
    async uploadAvatar(req, file) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        const avatarUrl = `http://localhost:3001/uploads/${file.filename}`;
        await this.usersService.updateAvatar(req.user.sub, avatarUrl);
        return { avatarUrl };
    }
    async uploadCover(req, file) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        const coverUrl = `http://localhost:3001/uploads/${file.filename}`;
        await this.usersService.updateCover(req.user.sub, coverUrl);
        return { coverUrl };
    }
    async toggleFollow(username, req) {
        try {
            return await this.usersService.toggleFollow(username, req.user.sub);
        }
        catch (e) {
            throw new common_1.BadRequestException(e.message);
        }
    }
    async getUserPosts(username, req) {
        return this.usersService.getUserPosts(username, req.user.sub);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('followingOnly')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('privacy'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('allowDirectMessages')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Boolean]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updatePrivacy", null);
__decorate([
    (0, common_1.Get)('bookmarks'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getBookmarks", null);
__decorate([
    (0, common_1.Get)(':username'),
    __param(0, (0, common_1.Param)('username')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('profile/avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multer_config_1.multerOptions)),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Post)('profile/cover'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multer_config_1.multerOptions)),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "uploadCover", null);
__decorate([
    (0, common_1.Post)(':username/follow'),
    __param(0, (0, common_1.Param)('username')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "toggleFollow", null);
__decorate([
    (0, common_1.Get)(':username/posts'),
    __param(0, (0, common_1.Param)('username')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserPosts", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map