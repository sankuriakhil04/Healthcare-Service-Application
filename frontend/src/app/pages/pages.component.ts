import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Doctor, ServiceItem, Appointment, MedicalRecord, Profile } from '../core/models';
import { AuthService } from '../core/auth.service';
import {
  AppointmentService,
  ContactService,
  DoctorService,
  HealthcareService,
  MedicalRecordService,
  PatientService,
} from '../core/api.services';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './templates/home-page.html',
})
export class HomePage {}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './templates/about-page.html',
})
export class AboutPage {}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './templates/doctors-page.html',
})
export class DoctorsPage {
  private api = inject(DoctorService);
  doctors: Doctor[] = [];
  loading = true;
  error = '';
  searchText = '';
  specialty = '';
  availability = 'all';
  specialties: string[] = [];
  constructor() {
    this.api.list().subscribe({
      next: (r) => {
        this.doctors = r.doctors;
        this.specialties = [...new Set(this.doctors.map((d) => d.specialization))];
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load doctors. Please try again later.';
        this.loading = false;
      },
    });
  }
  get filtered() {
    return this.doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(this.searchText.toLowerCase()) &&
        (!this.specialty || d.specialization === this.specialty) &&
        (this.availability === 'all' ||
          (this.availability === 'available' ? d.available : !d.available)),
    );
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './templates/doctor-details-page.html',
})
export class DoctorDetailsPage {
  private api = inject(DoctorService);
  private route = inject(ActivatedRoute);
  doctor?: Doctor;
  loading = true;
  error = '';
  constructor() {
    this.route.paramMap.subscribe((p) => {
      this.api.get(p.get('id') || '').subscribe({
        next: (r) => {
          this.doctor = r.doctor;
          this.loading = false;
        },
        error: () => {
          this.error = 'We couldn’t find that doctor.';
          this.loading = false;
        },
      });
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './templates/services-page.html',
})
export class ServicesPage {
  private api = inject(HealthcareService);
  services: ServiceItem[] = [];
  loading = true;
  error = '';
  constructor() {
    this.api.list().subscribe({
      next: (r) => {
        this.services = r.services;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to load services.';
      },
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './templates/appointments-page.html',
})
export class AppointmentsPage {
  private fb = inject(FormBuilder);
  private api = inject(AppointmentService);
  private docApi = inject(DoctorService);
  private route = inject(ActivatedRoute);
  doctors: Doctor[] = [];
  saving = false;
  error = '';
  success = '';
  today = new Date().toISOString().slice(0, 10);
  form = this.fb.group({
    patientName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[+\d][\d\s()-]{7,18}$/)]],
    doctorId: ['', Validators.required],
    date: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
    time: ['', Validators.required],
    reason: ['', Validators.required],
  });
  constructor() {
    this.docApi.list().subscribe((r) => {
      this.doctors = r.doctors;
      const id = this.route.snapshot.queryParamMap.get('doctor');
      if (id) this.form.patchValue({ doctorId: id });
    });
    this.form.controls.doctorId.valueChanges.subscribe(() => this.form.controls.time.setValue(''));
  }
  get selectedTimes() {
    return this.doctors.find((d) => d.id === this.form.value.doctorId)?.times || [];
  }
  invalid(k: string) {
    const c = this.form.get(k);
    return !!c && c.invalid && c.touched;
  }
  submit() {
    this.form.markAllAsTouched();
    this.error = '';
    this.success = '';
    if (this.form.invalid) return;
    this.saving = true;
    this.api.create(this.form.getRawValue()).subscribe({
      next: (r) => {
        this.success = `${r.appointment.doctor} · ${r.appointment.date} at ${r.appointment.time}`;
        this.saving = false;
      },
      error: (e) => {
        this.error = e.error?.message || 'Appointment booking failed. Please try again.';
        this.saving = false;
      },
    });
  }
  reset() {
    this.form.reset();
    this.error = '';
    this.success = '';
  }
}

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './templates/my-appointments-page.html',
})
export class MyAppointmentsPage {
  private api = inject(AppointmentService);
  appointments: Appointment[] = [];
  loading = true;
  error = '';
  constructor() {
    this.load();
  }
  load() {
    this.api.list().subscribe({
      next: (r) => {
        this.appointments = r.appointments;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to load appointments. Please sign in again.';
      },
    });
  }
  cancel(a: Appointment) {
    if (!confirm('Cancel this appointment?')) return;
    this.api.cancel(a.id).subscribe({
      next: () => this.load(),
      error: () => (this.error = 'Unable to cancel this appointment.'),
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './templates/medical-records-page.html',
})
export class MedicalRecordsPage {
  private api = inject(MedicalRecordService);
  records: MedicalRecord[] = [];
  loading = true;
  error = '';
  constructor() {
    this.api.list().subscribe({
      next: (r) => {
        this.records = r.records;
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load medical records.';
        this.loading = false;
      },
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './templates/profile-page.html',
})
export class ProfilePage {
  private fb = inject(FormBuilder);
  private api = inject(PatientService);
  form = this.fb.group({
    name: ['', Validators.required],
    email: [''],
    phone: ['', Validators.required],
    dateOfBirth: [''],
    gender: [''],
    bloodGroup: [''],
    address: [''],
    emergencyContact: [''],
  });
  saving = false;
  error = '';
  success = '';
  constructor() {
    this.api.profile().subscribe({
      next: (r) => this.form.patchValue(r.profile),
      error: () => (this.error = 'Unable to load your profile.'),
    });
  }
  save() {
    this.error = '';
    this.success = '';
    if (this.form.invalid) {
      this.error = 'Please fill all required fields.';
      return;
    }
    this.saving = true;
    this.api.update(this.form.getRawValue() as Profile).subscribe({
      next: () => {
        this.saving = false;
        this.success = 'Your profile has been updated.';
      },
      error: () => {
        this.saving = false;
        this.error = 'Unable to save your profile.';
      },
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './templates/dashboard-page.html',
})
export class DashboardPage {
  private api = inject(PatientService);
  data: any;
  loading = true;
  error = '';
  constructor() {
    this.api.dashboard().subscribe({
      next: (r) => {
        this.data = r.dashboard;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to load your dashboard.';
      },
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './templates/login-page.html',
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  loading = false;
  error = '';
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  invalid(k: string) {
    const c = this.form.get(k);
    return !!c && c.invalid && c.touched;
  }
  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.getRawValue() as { email: string; password: string }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl(
          this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard',
        );
      },
      error: (e) => {
        this.loading = false;
        this.error = e.error?.message || 'Unable to connect to the server.';
      },
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './templates/register-page.html',
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  loading = false;
  error = '';
  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[+\d][\d\s()-]{7,18}$/)]],
    dateOfBirth: ['', Validators.required],
    gender: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });
  invalid(k: string) {
    const c = this.form.get(k);
    if (k === 'confirmPassword' && c?.touched) return c.value !== this.form.value.password;
    return !!c && c.invalid && c.touched;
  }
  submit() {
    this.error = '';
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error = 'Please complete all required fields correctly.';
      return;
    }
    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.error = 'Passwords do not match. Please enter the same password twice.';
      return;
    }
    this.loading = true;
    const { confirmPassword, ...payload } = this.form.getRawValue();
    this.auth.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login'], { queryParams: { registered: '1' } });
      },
      error: (e) => {
        this.loading = false;
        this.error =
          e.status === 0
            ? 'Cannot reach the API. Check that the backend is running on port 3000 and reload this page.'
            : e.error?.message || `Registration failed (HTTP ${e.status}). Please try again.`;
      },
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './templates/contact-page.html',
})
export class ContactPage {
  private fb = inject(FormBuilder);
  private api = inject(ContactService);
  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: [''],
    message: ['', Validators.required],
  });
  loading = false;
  success = '';
  error = '';
  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error = 'Please fill all required fields.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.api.send(this.form.getRawValue()).subscribe({
      next: (r) => {
        this.success = r.message;
        this.loading = false;
        this.form.reset();
      },
      error: (e) => {
        this.error = e.error?.message || 'Unable to send your message.';
        this.loading = false;
      },
    });
  }
}
