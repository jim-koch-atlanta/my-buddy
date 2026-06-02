export interface User {
    id: string; // uuid
    email: string;
    name: string;
    timezone: string;
    cognitoSub: string;
    emailVerified: boolean;
    status: string;
    createdAt: Date;
}