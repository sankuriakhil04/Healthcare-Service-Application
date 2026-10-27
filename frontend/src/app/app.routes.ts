import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import {
  HomePage,
  AboutPage,
  DoctorsPage,
  DoctorDetailsPage,
  ServicesPage,
  AppointmentsPage,
  MyAppointmentsPage,
  MedicalRecordsPage,
  ProfilePage,
  DashboardPage,
  LoginPage,
  RegisterPage,
  ContactPage,
} from './pages/pages.component';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomePage },
  { path: 'about', component: AboutPage },
  { path: 'doctors', component: DoctorsPage },
  { path: 'doctors/:id', component: DoctorDetailsPage },
  { path: 'services', component: ServicesPage },
  { path: 'appointments', component: AppointmentsPage, canActivate: [authGuard] },
  { path: 'my-appointments', component: MyAppointmentsPage, canActivate: [authGuard] },
  { path: 'medical-records', component: MedicalRecordsPage, canActivate: [authGuard] },
  { path: 'profile', component: ProfilePage, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardPage, canActivate: [authGuard] },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'contact', component: ContactPage },
  { path: '**', redirectTo: 'home' },
];
