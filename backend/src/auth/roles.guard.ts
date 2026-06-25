import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true; // No se requiere ningún rol específico
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    // ADMIN siempre tiene acceso
    if (user.role === 'ADMIN') return true;

    return requiredRoles.includes(user.role);
  }
}
