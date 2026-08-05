import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
