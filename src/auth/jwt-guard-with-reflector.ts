// src/auth/jwt-guard-with-reflector.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

@Injectable()
export class JwtGuardWithReflector extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const handler = context.getHandler();
    const clazz = context.getClass();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      clazz,
    ]);

    // DEBUG: log to help diagnose why @Public routes may still be unauthorized
    // (temporary - remove once issue is resolved)
    try {
      const handlerName = (handler && (handler.name || handler.constructor?.name)) || 'unknownHandler';
      const className = (clazz && (clazz.name || clazz.constructor?.name)) || 'unknownClass';
      // Use console.debug so it's easy to filter in logs
      // eslint-disable-next-line no-console
      console.debug(`[JwtGuardWithReflector] isPublic=%s handler=%s class=%s`, String(isPublic), handlerName, className);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.debug('[JwtGuardWithReflector] failed to log handler/class', err?.message || err);
    }

    if (isPublic) return true;

    return super.canActivate(context);
  }
}