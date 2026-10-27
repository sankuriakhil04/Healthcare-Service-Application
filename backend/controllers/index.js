const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const { getPool } = require("../config/database");

const tokenFor = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET || "careconnect-local-demo-secret-change-me",
    { expiresIn: "8h" },
  );

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  dateOfBirth: user.dateOfBirth,
  gender: user.gender,
});

const doctorFields = `
  id, name, specialization, qualification, experience, clinic, fee,
  available_days AS days, available_times AS times, image, available, about
`;

const appointmentFields = `
  a.id,
  a.patient_name AS patientName,
  a.email,
  a.phone,
  a.doctor_id AS doctorId,
  d.name AS doctor,
  d.specialization,
  DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS date,
  TIME_FORMAT(a.appointment_time, '%H:%i') AS time,
  a.reason,
  a.status,
  a.created_at AS createdAt
`;

function parseJson(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function doctorFromRow(row) {
  return {
    ...row,
    days: parseJson(row.days),
    times: parseJson(row.times),
    available: Boolean(row.available),
  };
}

function appointmentQuery() {
  return `SELECT ${appointmentFields} FROM appointments a JOIN doctors d ON d.id = a.doctor_id`;
}

exports.register = async (req, res) => {
  const { name, email, phone, password, dateOfBirth, gender } = req.body;
  if (
    ![name, email, phone, password, dateOfBirth, gender].every((value) =>
      String(value || "").trim(),
    )
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Please fill all required fields." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return res
      .status(400)
      .json({ success: false, message: "Enter a valid email address." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters.",
    });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateOfBirth))) {
    return res
      .status(400)
      .json({ success: false, message: "Enter a valid date of birth." });
  }

  const user = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: normalizedEmail,
    phone: String(phone).trim(),
    dateOfBirth,
    gender: String(gender).trim(),
  };
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO users (id, name, email, phone, password_hash, date_of_birth, gender)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.name,
        user.email,
        user.phone,
        await bcrypt.hash(password, 10),
        user.dateOfBirth,
        user.gender,
      ],
    );
    await connection.execute("INSERT INTO patients (user_id) VALUES (?)", [
      user.id,
    ]);
    await connection.commit();
    return res
      .status(201)
      .json({ success: true, message: "Registration successful.", user });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }
    throw error;
  } finally {
    connection.release();
  }
};

exports.login = async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");
  const [rows] = await getPool().execute(
    "SELECT id, name, email, phone, date_of_birth AS dateOfBirth, gender, password_hash AS passwordHash FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password." });
  }
  return res.json({
    success: true,
    token: tokenFor(user),
    user: publicUser(user),
  });
};

exports.listDoctors = async (_req, res) => {
  const [rows] = await getPool().query(
    `SELECT ${doctorFields} FROM doctors ORDER BY name`,
  );
  return res.json({ success: true, doctors: rows.map(doctorFromRow) });
};

exports.getDoctor = async (req, res) => {
  const [rows] = await getPool().execute(
    `SELECT ${doctorFields} FROM doctors WHERE id = ?`,
    [req.params.id],
  );
  if (!rows.length)
    return res
      .status(404)
      .json({ success: false, message: "Doctor not found." });
  return res.json({ success: true, doctor: doctorFromRow(rows[0]) });
};

exports.listServices = async (_req, res) => {
  const [services] = await getPool().query(
    "SELECT id, name, description, icon, available FROM healthcare_services ORDER BY name",
  );
  return res.json({
    success: true,
    services: services.map((service) => ({
      ...service,
      available: Boolean(service.available),
    })),
  });
};

exports.getService = async (req, res) => {
  const [rows] = await getPool().execute(
    "SELECT id, name, description, icon, available FROM healthcare_services WHERE id = ?",
    [req.params.id],
  );
  if (!rows.length)
    return res
      .status(404)
      .json({ success: false, message: "Service not found." });
  return res.json({
    success: true,
    service: { ...rows[0], available: Boolean(rows[0].available) },
  });
};

exports.listAppointments = async (req, res) => {
  const [appointments] = await getPool().execute(
    `${appointmentQuery()} WHERE a.user_id = ? ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    [req.user.sub],
  );
  return res.json({ success: true, appointments });
};

exports.getAppointment = async (req, res) => {
  const [rows] = await getPool().execute(
    `${appointmentQuery()} WHERE a.user_id = ? AND a.id = ? LIMIT 1`,
    [req.user.sub, req.params.id],
  );
  if (!rows.length)
    return res
      .status(404)
      .json({ success: false, message: "Appointment not found." });
  return res.json({ success: true, appointment: rows[0] });
};

exports.createAppointment = async (req, res) => {
  const { patientName, email, phone, doctorId, date, time, reason } = req.body;
  if (
    ![patientName, email, phone, doctorId, date, time, reason].every((value) =>
      String(value || "").trim(),
    )
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Please fill all required fields." });
  }
  if (!/^\S+@\S+\.\S+$/.test(String(email))) {
    return res
      .status(400)
      .json({ success: false, message: "Enter a valid email address." });
  }
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(String(date)) ||
    date < new Date().toISOString().slice(0, 10)
  ) {
    return res.status(400).json({
      success: false,
      message: "Appointment date must be today or later.",
    });
  }
  if (!/^\d{2}:\d{2}$/.test(String(time))) {
    return res
      .status(400)
      .json({ success: false, message: "Choose a valid appointment time." });
  }

  const connection = await getPool().getConnection();
  const id = crypto.randomUUID();
  try {
    await connection.beginTransaction();
    const [doctors] = await connection.execute(
      `SELECT id, name, specialization FROM doctors WHERE id = ? FOR UPDATE`,
      [doctorId],
    );
    if (!doctors.length) {
      await connection.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Please select a valid doctor." });
    }

    const [conflicts] = await connection.execute(
      `SELECT id FROM appointments
       WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status = 'Confirmed'
       LIMIT 1`,
      [doctorId, date, time],
    );
    if (conflicts.length) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "That appointment time is no longer available.",
      });
    }

    await connection.execute(
      `INSERT INTO appointments
       (id, user_id, doctor_id, patient_name, email, phone, appointment_date, appointment_time, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.sub,
        doctorId,
        String(patientName).trim(),
        String(email).trim().toLowerCase(),
        String(phone).trim(),
        date,
        time,
        String(reason).trim(),
      ],
    );
    await connection.commit();

    const appointment = {
      id,
      patientName: String(patientName).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      doctorId,
      doctor: doctors[0].name,
      specialization: doctors[0].specialization,
      date,
      time,
      reason: String(reason).trim(),
      status: "Confirmed",
    };
    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.updateAppointment = async (req, res) => {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const [appointments] = await connection.execute(
      "SELECT id, doctor_id AS doctorId, appointment_date AS date, appointment_time AS time, reason, status FROM appointments WHERE id = ? AND user_id = ? FOR UPDATE",
      [req.params.id, req.user.sub],
    );
    if (!appointments.length) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found." });
    }

    const current = appointments[0];
    const date = req.body.date || String(current.date).slice(0, 10);
    const time = req.body.time || String(current.time).slice(0, 5);
    const reason =
      req.body.reason === undefined
        ? current.reason
        : String(req.body.reason).trim();
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      date < new Date().toISOString().slice(0, 10) ||
      !/^\d{2}:\d{2}$/.test(time) ||
      !reason
    ) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Enter a valid future date, time, and reason.",
      });
    }

    await connection.execute("SELECT id FROM doctors WHERE id = ? FOR UPDATE", [
      current.doctorId,
    ]);
    const [conflicts] = await connection.execute(
      `SELECT id FROM appointments
       WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status = 'Confirmed' AND id <> ?
       LIMIT 1`,
      [current.doctorId, date, time, req.params.id],
    );
    if (conflicts.length) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "That appointment time is no longer available.",
      });
    }

    await connection.execute(
      "UPDATE appointments SET appointment_date = ?, appointment_time = ?, reason = ? WHERE id = ? AND user_id = ?",
      [date, time, reason, req.params.id, req.user.sub],
    );
    await connection.commit();
    const [updated] = await getPool().execute(
      `${appointmentQuery()} WHERE a.user_id = ? AND a.id = ? LIMIT 1`,
      [req.user.sub, req.params.id],
    );
    return res.json({ success: true, appointment: updated[0] });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.deleteAppointment = async (req, res) => {
  const [result] = await getPool().execute(
    "UPDATE appointments SET status = 'Cancelled' WHERE id = ? AND user_id = ? AND status <> 'Cancelled'",
    [req.params.id, req.user.sub],
  );
  if (!result.affectedRows) {
    const [existing] = await getPool().execute(
      `${appointmentQuery()} WHERE a.id = ? AND a.user_id = ? LIMIT 1`,
      [req.params.id, req.user.sub],
    );
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found." });
    return res.json({
      success: true,
      message: "Appointment is already cancelled.",
      appointment: existing[0],
    });
  }

  const [rows] = await getPool().execute(
    `${appointmentQuery()} WHERE a.id = ? AND a.user_id = ? LIMIT 1`,
    [req.params.id, req.user.sub],
  );
  return res.json({
    success: true,
    message: "Appointment cancelled.",
    appointment: rows[0],
  });
};

exports.getProfile = async (req, res) => {
  const [rows] = await getPool().execute(
    `SELECT u.name, u.email, u.phone, DATE_FORMAT(u.date_of_birth, '%Y-%m-%d') AS dateOfBirth,
            u.gender, p.blood_group AS bloodGroup, p.address, p.emergency_contact AS emergencyContact
     FROM users u JOIN patients p ON p.user_id = u.id WHERE u.id = ? LIMIT 1`,
    [req.user.sub],
  );
  if (!rows.length)
    return res
      .status(404)
      .json({ success: false, message: "Profile not found." });
  return res.json({ success: true, profile: rows[0] });
};

exports.updateProfile = async (req, res) => {
  const allowed = [
    "name",
    "phone",
    "dateOfBirth",
    "gender",
    "bloodGroup",
    "address",
    "emergencyContact",
  ];
  const [currentRows] = await getPool().execute(
    `SELECT u.name, u.email, u.phone, DATE_FORMAT(u.date_of_birth, '%Y-%m-%d') AS dateOfBirth,
            u.gender, p.blood_group AS bloodGroup, p.address, p.emergency_contact AS emergencyContact
     FROM users u JOIN patients p ON p.user_id = u.id WHERE u.id = ? LIMIT 1`,
    [req.user.sub],
  );
  if (!currentRows.length)
    return res
      .status(404)
      .json({ success: false, message: "Profile not found." });

  const profile = { ...currentRows[0] };
  for (const key of allowed) {
    if (req.body[key] !== undefined)
      profile[key] = String(req.body[key]).trim();
  }
  if (
    !profile.name ||
    !profile.phone ||
    !/^\d{4}-\d{2}-\d{2}$/.test(profile.dateOfBirth)
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid name, phone, and date of birth.",
    });
  }

  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      "UPDATE users SET name = ?, phone = ?, date_of_birth = ?, gender = ? WHERE id = ?",
      [
        profile.name,
        profile.phone,
        profile.dateOfBirth,
        profile.gender,
        req.user.sub,
      ],
    );
    await connection.execute(
      "UPDATE patients SET blood_group = ?, address = ?, emergency_contact = ? WHERE user_id = ?",
      [
        profile.bloodGroup,
        profile.address,
        profile.emergencyContact,
        req.user.sub,
      ],
    );
    await connection.commit();
    return res.json({
      success: true,
      message: "Profile updated successfully.",
      profile,
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.listRecords = async (req, res) => {
  const [records] = await getPool().execute(
    `SELECT id, patient_name AS patient, doctor, diagnosis,
            DATE_FORMAT(record_date, '%Y-%m-%d') AS date, prescription, notes
     FROM medical_records WHERE user_id = ? ORDER BY record_date DESC`,
    [req.user.sub],
  );
  return res.json({ success: true, records });
};

exports.getRecord = async (req, res) => {
  const [rows] = await getPool().execute(
    `SELECT id, patient_name AS patient, doctor, diagnosis,
            DATE_FORMAT(record_date, '%Y-%m-%d') AS date, prescription, notes
     FROM medical_records WHERE id = ? AND user_id = ? LIMIT 1`,
    [req.params.id, req.user.sub],
  );
  if (!rows.length)
    return res
      .status(404)
      .json({ success: false, message: "Medical record not found." });
  return res.json({ success: true, record: rows[0] });
};

exports.dashboard = async (req, res) => {
  const pool = getPool();
  const userId = req.user.sub;
  const [userRows] = await pool.execute(
    "SELECT name FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  const [[appointmentCount]] = await pool.execute(
    "SELECT COUNT(*) AS total FROM appointments WHERE user_id = ?",
    [userId],
  );
  const [[doctorCount]] = await pool.query(
    "SELECT COUNT(*) AS total FROM doctors WHERE available = 1",
  );
  const [[recordCount]] = await pool.execute(
    "SELECT COUNT(*) AS total FROM medical_records WHERE user_id = ?",
    [userId],
  );
  const [upcomingAppointments] = await pool.execute(
    `${appointmentQuery()} WHERE a.user_id = ? AND a.appointment_date >= CURDATE() AND a.status = 'Confirmed'
     ORDER BY a.appointment_date, a.appointment_time`,
    [userId],
  );
  const [recentActivity] = await pool.execute(
    `${appointmentQuery()} WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT 5`,
    [userId],
  );

  return res.json({
    success: true,
    dashboard: {
      welcome: userRows[0]?.name || "Patient",
      totalAppointments: appointmentCount.total,
      upcomingAppointments,
      availableDoctors: doctorCount.total,
      medicalRecords: recordCount.total,
      recentActivity,
    },
  });
};

exports.contact = async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (![name, email, message].every((value) => String(value || "").trim())) {
    return res.status(400).json({
      success: false,
      message: "Name, email and message are required.",
    });
  }
  if (!/^\S+@\S+\.\S+$/.test(String(email))) {
    return res
      .status(400)
      .json({ success: false, message: "Enter a valid email address." });
  }

  await getPool().execute(
    "INSERT INTO contact_messages (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)",
    [
      crypto.randomUUID(),
      String(name).trim(),
      String(email).trim().toLowerCase(),
      String(subject || "").trim(),
      String(message).trim(),
    ],
  );
  return res.status(201).json({
    success: true,
    message: "Thank you. Your message has been received.",
  });
};
