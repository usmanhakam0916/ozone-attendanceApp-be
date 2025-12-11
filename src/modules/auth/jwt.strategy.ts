import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtDecode from 'jwt-decode';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UserService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // extract the bearer token from the request
      ignoreExpiration: false, // token will never expired
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async authenticate(req, options) {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const payload = jwtDecode(token);
      const user = await this.validate(payload);
      if (user) {
        const new_token = await this.authService.login(user);
        super.authenticate(
          {
            ...req,
            headers: {
              ...req.headers,
              authorization: `Bearer ${new_token.access_token}`,
            },
          },
          options,
        );
      } else {
        super.authenticate(req, options);
      }
    } else {
      super.authenticate(req, options);
    }
  }

  async validate(payload: any) {
    return this.usersService.findOne(payload.username);
  }
}
