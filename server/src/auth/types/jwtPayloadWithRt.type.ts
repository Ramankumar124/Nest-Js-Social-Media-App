import { AuthJwtPayload } from './auth-jwtPayload';

export type JwtPayloadWithRt = AuthJwtPayload & { refreshToken: string };
