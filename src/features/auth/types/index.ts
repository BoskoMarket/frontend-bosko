export interface Credentials {
    email: string;
    password: string;
}

export interface RegisterUserPayload extends Credentials {
    userName: string;
    firstName: string;
    lastName: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
}
