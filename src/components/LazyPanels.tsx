import { lazy } from 'react';

export const WalletPanel = lazy(() => import('./WalletPanel').then(m => ({ default: m.WalletPanel })));
export const AdminPanel = lazy(() => import('./AdminPanel').then(m => ({ default: m.AdminPanel })));
export const CreateGameModal = lazy(() => import('./CreateGameModal').then(m => ({ default: m.CreateGameModal })));
