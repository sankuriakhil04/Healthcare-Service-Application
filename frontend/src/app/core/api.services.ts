import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Doctor, ServiceItem, Appointment, Profile, MedicalRecord } from './models';
import { API_BASE_URL } from './api-url';
@Injectable({ providedIn: 'root' })
export class DoctorService {
  private http = inject(HttpClient);
  list() {
    return this.http.get<{ doctors: Doctor[] }>(`${API_BASE_URL}/doctors`);
  }
  get(id: string) {
    return this.http.get<{ doctor: Doctor }>(`${API_BASE_URL}/doctors/${id}`);
  }
}
@Injectable({ providedIn: 'root' })
export class HealthcareService {
  private http = inject(HttpClient);
  list() {
    return this.http.get<{ services: ServiceItem[] }>(`${API_BASE_URL}/services`);
  }
}
@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private http = inject(HttpClient);
  list() {
    return this.http.get<{ appointments: Appointment[] }>(`${API_BASE_URL}/appointments`);
  }
  create(data: object) {
    return this.http.post<{ appointment: Appointment; message: string }>(
      `${API_BASE_URL}/appointments`,
      data,
    );
  }
  cancel(id: string) {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/appointments/${id}`);
  }
}
@Injectable({ providedIn: 'root' })
export class PatientService {
  private http = inject(HttpClient);
  profile() {
    return this.http.get<{ profile: Profile }>(`${API_BASE_URL}/profile`);
  }
  update(data: Profile) {
    return this.http.put<{ profile: Profile }>(`${API_BASE_URL}/profile`, data);
  }
  dashboard() {
    return this.http.get<any>(`${API_BASE_URL}/dashboard`);
  }
}
@Injectable({ providedIn: 'root' })
export class MedicalRecordService {
  private http = inject(HttpClient);
  list() {
    return this.http.get<{ records: MedicalRecord[] }>(`${API_BASE_URL}/medical-records`);
  }
}
@Injectable({ providedIn: 'root' })
export class ContactService {
  private http = inject(HttpClient);
  send(data: object) {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/contact`, data);
  }
}
