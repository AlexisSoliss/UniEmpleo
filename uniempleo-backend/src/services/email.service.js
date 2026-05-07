// src/services/email.service.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true para 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía un correo de verificación de cuenta.
 */
const sendVerificationEmail = async (to, nombre, token) => {
  const url = `${process.env.FRONTEND_URL}/verificar-cuenta?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'UniEmpleo – Verifica tu cuenta',
    html: `
      <h2>Hola, ${nombre}</h2>
      <p>Gracias por registrarte en <strong>UniEmpleo</strong>.</p>
      <p>Haz clic en el siguiente enlace para activar tu cuenta:</p>
      <a href="${url}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
        Verificar cuenta
      </a>
      <p>Este enlace expira en 24 horas.</p>
    `
  });
};

/**
 * Envía un correo de recuperación de contraseña.
 */
const sendPasswordResetEmail = async (to, nombre, token) => {
  const url = `${process.env.FRONTEND_URL}/restablecer-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'UniEmpleo – Recupera tu contraseña',
    html: `
      <h2>Hola, ${nombre}</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <a href="${url}" style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
        Restablecer contraseña
      </a>
      <p>Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.</p>
    `
  });
};

/**
 * Notifica al candidato cuando cambia el estado de su postulación.
 */
const sendStatusChangeEmail = async (to, nombre, tituloPuesto, nuevoEstado) => {
  const estadoLabel = {
    en_revision:      'En Revisión',
    preseleccionado:  'Preseleccionado',
    aceptado:         'Aceptado ✅',
    rechazado:        'Rechazado',
  }[nuevoEstado] || nuevoEstado;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `UniEmpleo – Actualización de tu postulación: ${tituloPuesto}`,
    html: `
      <h2>Hola, ${nombre}</h2>
      <p>El estado de tu postulación al puesto <strong>${tituloPuesto}</strong> ha cambiado:</p>
      <p style="font-size:1.2rem;font-weight:bold;">${estadoLabel}</p>
      <p>Ingresa a tu panel en UniEmpleo para más detalles.</p>
    `
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendStatusChangeEmail,
};
