import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { UserListComponent } from './user-list/user-list';
import { authGuard } from './guards/auth-guard';
import { noAuthGuard } from './guards/no-auth.guard';

export const routes: Routes = [
  // 1. Redirigir la raíz a usuarios (los guards decidirán el destino final)
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' },

  // 2. Ruta de Login (si ya hay sesión, noAuthGuard reenvía a /usuarios)
  { path: 'login', component: LoginComponent, canActivate: [noAuthGuard] },

  // 3. Ruta de Lista de Usuarios (si no hay sesión, authGuard reenvía a /login)
  { path: 'usuarios', component: UserListComponent, canActivate: [authGuard] },

  // 4. Ruta comodín por si escriben una URL no existente
  { path: '**', redirectTo: 'usuarios' }
];