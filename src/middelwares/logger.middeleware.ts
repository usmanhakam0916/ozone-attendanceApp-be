import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  logger = new Logger('Request');
  use(req: Request, response: Response, next: NextFunction) {
    const now = Date.now();
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');
      const resp = {
        requestTime: `${Date.now() - now}ms`,
        request: `${method} ${originalUrl} ${ip} ${userAgent}`,
        body: req.body,
        response: {
          status: statusCode,
          responseContentLength: contentLength,
        },
      };
      this.logger.log(JSON.stringify(resp));
    });
    next();
  }
}
