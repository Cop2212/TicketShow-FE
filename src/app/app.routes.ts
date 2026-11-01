import { Routes } from '@angular/router';
import { ClientLayoutComponent } from './layouts/client-layout/client-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { AdminEventsComponent } from './features/admin/events/admin-events.component';
import { AdminCreateEventComponent } from './features/admin/events/admin-create-event.component';
import { AdminVenuesComponent } from './features/admin/venues/admin-venues.component';
import { AdminVenueBookingsComponent } from './features/admin/venue-bookings/admin-venue-bookings.component';
import { AdminOrdersComponent } from './features/admin/orders/admin-orders.component';
import { AdminUsersComponent } from './features/admin/users/admin-users.component';
import { AdminRolesComponent } from './features/admin/roles/admin-roles.component';
import { AdminMenusComponent } from './features/admin/menus/admin-menus.component';
import { EventDetailComponent } from './features/events/event-detail/event-detail.component';
import { CheckoutComponent } from './features/checkout/checkout.component';
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
        component: HomeComponent
      },
      {
        path: 'events/:slug',
        component: EventDetailComponent
      },
      {
        path: 'checkout/:orderCode',
        component: CheckoutComponent
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
        path: 'events',
        component: AdminEventsComponent
      },
      {
        path: 'events/create',
        component: AdminCreateEventComponent
      },
      {
        path: 'venues',
        component: AdminVenuesComponent
      },
      {
        path: 'venue-bookings',
        component: AdminVenueBookingsComponent
      },
      {
        path: 'orders',
        component: AdminOrdersComponent
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
