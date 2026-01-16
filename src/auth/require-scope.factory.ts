import { RequireScopeMiddleware } from './require-scope.middleware';

export function createRequireScopeMiddleware(scope: string) {
  return new RequireScopeMiddleware(scope);
}
