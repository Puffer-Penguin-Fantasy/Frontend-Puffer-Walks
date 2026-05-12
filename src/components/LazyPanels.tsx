import { lazy } from 'react';

const lazyWithRetry = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error: any) {
      // Check if it's a dynamic import failure (stale chunk)
      if (
        error.message?.includes("Failed to fetch dynamically imported module") ||
        error.message?.includes("Importing a module script failed")
      ) {
        window.location.reload();
      }
      throw error;
    }
  });

export const WalletPanel = lazyWithRetry(() => import('./WalletPanel').then(m => ({ default: m.WalletPanel })));
export const AdminPanel = lazyWithRetry(() => import('./AdminPanel').then(m => ({ default: m.AdminPanel })));
export const CreateGameModal = lazyWithRetry(() => import('./CreateGameModal').then(m => ({ default: m.CreateGameModal })));
