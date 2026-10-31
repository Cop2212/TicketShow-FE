import { Routes } from '@angular/router';
import { ClientLayoutComponent } from './layouts/client-layout/client-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { AdminCreateEventComponent } from './features/admin/events/admin-create-event.component';
import { AdminUsersComponent } from './features/admin/users/admin-users.component';
import { AdminRolesComponent } from './features/admin/roles/admin-roles.component';
import { AdminMenusComponent } from './features/admin/menus/admin-menus.component';
import { EventDetailComponent } from './features/events/event-detail/event-detail.component';
import { MyTicketsComponent } from './features/my-tickets/my-tickets.component';
import { StaffScannerComponent } from './features/staff-scanner/staff-scanner.component';

export const routes: Routes = [
  {
    path: '',
    component: ClientLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent
      },
      {
        path: 'events',
        component: EventDetailComponent
      },
      {
        path: 'events/:slug',
        component: EventDetailComponent
      },
      {
        path: 'my-tickets',
        component: MyTicketsComponent
      },
      {
        path: 'scanner',
        component: StaffScannerComponent
      },
      {
        path: 'auth/login',
        component: LoginComponent
      },
      {
        path: 'auth/register',
        component: RegisterComponent
      }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        component: AdminDashboardComponent
      },
      {
        path: 'events/create',
        component: AdminCreateEventComponent
      },
      {
        path: 'scanner',
        component: StaffScannerComponent
      },
      {
        path: 'users',
        component: AdminUsersComponent
      },
      {
        path: 'roles',
        component: AdminRolesComponent
      },
      {
        path: 'menus',
        component: AdminMenusComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
