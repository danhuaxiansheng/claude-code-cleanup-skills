# Example: Used But Unnecessary Cache Wrapper

This is the kind of cleanup normal unused-code scans often miss.

## Before

```ts
export class CacheInvalidator {
  constructor(private cache: CacheManager) {}

  onLogout(): void {
    this.cache.clear();
  }

  onProductUpdate(): void {
    this.cache.clearByPrefix('market:product');
    this.cache.clearByPrefix('market:symbol');
  }
}

export const cacheInvalidator = new CacheInvalidator(localCache);

export async function logout() {
  await authApi.logout();
  clearAuthSession();
  cacheInvalidator.onLogout();
  sessionCache.clear();
}
```

An unused-code scan may report that `CacheInvalidator` is used, because `logout()` calls it.

## Necessary Code Audit

The better question is whether `logout()` needs that wrapper.

The wrapper adds no current behavior. `onLogout()` only calls `localCache.clear()`. Once the call site is simplified, the wrapper-specific methods and prefix-clearing API can be rechecked.

## After

```ts
export async function logout() {
  await authApi.logout();
  clearAuthSession();
  localCache.clear();
  sessionCache.clear();
}
```

Then remove newly orphaned code:

- `CacheInvalidator`
- `createCacheInvalidator`
- `cacheInvalidator`
- `clearByPrefix`
- stale exports and types
- dead comments and debug-only config

## Keep Real Constraints

Do not delete platform checks just because they look defensive. SSR checks, browser storage availability, quota handling, permission states, and valid nullable domain states are real runtime constraints.
