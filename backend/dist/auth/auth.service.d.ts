import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(body: any): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            email: string;
        };
    }>;
    login(body: any): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            email: string;
        };
    }>;
}
