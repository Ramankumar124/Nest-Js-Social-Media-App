import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthJwtPayload } from '../types/auth-jwtPayload';
// extracts 123 user id from the req.user object
export const GetCurrentUserId = createParamDecorator(
  (_: undefined, context: ExecutionContext): number => {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthJwtPayload;
    return user.sub;
  },
);
