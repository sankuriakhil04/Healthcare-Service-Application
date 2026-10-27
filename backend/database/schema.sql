CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  phone VARCHAR(25) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(40) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patients (
  user_id CHAR(36) NOT NULL PRIMARY KEY,
  blood_group VARCHAR(10) NOT NULL DEFAULT '',
  address VARCHAR(500) NOT NULL DEFAULT '',
  emergency_contact VARCHAR(50) NOT NULL DEFAULT '',
  CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS doctors (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  qualification VARCHAR(180) NOT NULL,
  experience INT UNSIGNED NOT NULL DEFAULT 0,
  clinic VARCHAR(180) NOT NULL,
  fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  available_days JSON NOT NULL,
  available_times JSON NOT NULL,
  image TEXT NOT NULL,
  available TINYINT(1) NOT NULL DEFAULT 1,
  about TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS healthcare_services (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(32) NOT NULL,
  available TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  doctor_id VARCHAR(36) NOT NULL,
  patient_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(25) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('Confirmed', 'Cancelled') NOT NULL DEFAULT 'Confirmed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_appointments_user_date (user_id, appointment_date),
  INDEX idx_appointments_slot (doctor_id, appointment_date, appointment_time, status),
  CONSTRAINT fk_appointments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS medical_records (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  patient_name VARCHAR(120) NOT NULL,
  doctor VARCHAR(120) NOT NULL,
  diagnosis VARCHAR(255) NOT NULL,
  record_date DATE NOT NULL,
  prescription TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_medical_records_user_date (user_id, record_date),
  CONSTRAINT fk_medical_records_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_messages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  subject VARCHAR(180) NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO doctors
  (id, name, specialization, qualification, experience, clinic, fee, available_days, available_times, image, available, about)
VALUES
  ('d1', 'Dr. Maya Patel', 'Cardiology', 'MBBS, MD, DM Cardiology', 12, 'CareConnect Heart Centre', 850, JSON_ARRAY('Monday', 'Wednesday', 'Friday'), JSON_ARRAY('09:00', '10:30', '14:00'), 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=700&q=80', 1, 'Dr. Patel provides compassionate, evidence-based heart care and preventive cardiac consultations.'),
  ('d2', 'Dr. Arjun Mehta', 'Dermatology', 'MBBS, MD Dermatology', 9, 'CareConnect Skin Clinic', 650, JSON_ARRAY('Tuesday', 'Thursday', 'Saturday'), JSON_ARRAY('10:00', '11:30', '16:00'), 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=700&q=80', 1, 'Dr. Mehta supports patients with medical and preventive skin care.'),
  ('d3', 'Dr. Sarah Thomas', 'Pediatrics', 'MBBS, MD Pediatrics', 15, 'CareConnect Children’s Clinic', 700, JSON_ARRAY('Monday', 'Tuesday', 'Thursday'), JSON_ARRAY('09:30', '12:00', '15:30'), 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=700&q=80', 1, 'Dr. Thomas helps children and families build healthy futures through attentive care.'),
  ('d4', 'Dr. Neel Kapoor', 'General Medicine', 'MBBS, MD Internal Medicine', 11, 'CareConnect Family Clinic', 500, JSON_ARRAY('Monday', 'Wednesday', 'Saturday'), JSON_ARRAY('08:30', '11:00', '17:00'), 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=700&q=80', 0, 'Dr. Kapoor offers thoughtful primary care and long-term wellness planning.');

INSERT IGNORE INTO healthcare_services (id, name, description, icon, available) VALUES
  ('s1', 'General Consultation', 'Everyday health concerns, checkups and referrals with a primary care doctor.', '✚', 1),
  ('s2', 'Cardiology', 'Heart health assessments, prevention and specialist consultations.', '♡', 1),
  ('s3', 'Dermatology', 'Expert care for skin, hair and nail health.', '◉', 1),
  ('s4', 'Pediatrics', 'Support for growing children, from wellness visits to common illnesses.', '☀', 1),
  ('s5', 'Dental Care', 'Preventive oral health care and dental consultations.', '✧', 1),
  ('s6', 'Physiotherapy', 'Personalized movement and rehabilitation plans.', '↗', 1),
  ('s7', 'Mental Wellness', 'Confidential guidance for emotional wellbeing and resilience.', '❋', 1),
  ('s8', 'Diagnostic Services', 'Convenient access to essential diagnostic tests.', '⌕', 1),
  ('s9', 'Pharmacy', 'Medication guidance and prescription support.', '⚕', 1),
  ('s10', 'Emergency Care', 'For a life-threatening emergency, call your local emergency number.', '!', 1);
