import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { UserType, validUserStatus } from '../user/user.entity';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    const noAuth = this.reflector.get<boolean>('no-auth', context.getHandler());
    // return true;
    if (noAuth) return true;
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException({
          message: 'username or password is invalid',
        })
      );
    }

    if (
      !validUserStatus.includes(user.status) &&
      user.type === UserType.EMPLOYEE
    ) {
      throw new HttpException(
        { message: `You're not allowed to use this app.`, status: user.status },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
