// src/controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
const emailService = require('../services/email.service');

// ─────────────────────────────────────────────
// RF-01 · Registro de usuario
// ─────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { nombre_completo, correo_electronico, contrasena, tipo_usuario } = req.body;

    // Verificar si el correo ya existe
    const existe = await query(
      'SELECT id_usuario FROM usuarios WHERE correo_electronico = $1',
      [correo_electronico]
    );
    if (existe.rows.length > 0) {
      return res.status(409).json({ ok: false, message: 'El correo ya está registrado.' });
    }

    // Hashear contraseña
    const contrasena_hash = await bcrypt.hash(contrasena, 10);

    // Token de verificación de correo (RF-06)
    const token_verificacion = crypto.randomBytes(32).toString('hex');

    const result = await query(
      `INSERT INTO usuarios
         (nombre_completo, correo_electronico, contrasena_hash, tipo_usuario, token_verificacion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_usuario, nombre_completo, correo_electronico, tipo_usuario`,
      [nombre_completo, correo_electronico, contrasena_hash, tipo_usuario, token_verificacion]
    );

    const usuario = result.rows[0];

    // Enviar correo de verificación
    await emailService.sendVerificationEmail(
      correo_electronico,
      nombre_completo,
      token_verificacion
    );

    res.status(201).json({
      ok: true,
      message: 'Usuario registrado. Revisa tu correo para verificar tu cuenta.',
      data: usuario,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-02 · Login
// ─────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { correo_electronico, contrasena } = req.body;

    const result = await query(
      'SELECT * FROM usuarios WHERE correo_electronico = $1',
      [correo_electronico]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas.' });
    }

    const usuario = result.rows[0];

    if (!usuario.activo) {
      return res.status(403).json({ ok: false, message: 'Cuenta suspendida. Contacta al administrador.' });
    }

    if (!usuario.verificado) {
      return res.status(403).json({ ok: false, message: 'Debes verificar tu correo antes de iniciar sesión.' });
    }

    const passwordOk = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!passwordOk) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas.' });
    }

    // Actualizar último acceso
    await query(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = $1',
      [usuario.id_usuario]
    );

    // Generar JWT
    const token = jwt.sign(
      { id_usuario: usuario.id_usuario, tipo_usuario: usuario.tipo_usuario },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }
    );

    res.json({
      ok: true,
      message: 'Inicio de sesión exitoso.',
      token,
      data: {
        id_usuario:        usuario.id_usuario,
        nombre_completo:   usuario.nombre_completo,
        correo_electronico: usuario.correo_electronico,
        tipo_usuario:      usuario.tipo_usuario,
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-03 · Solicitar recuperación de contraseña
// ─────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { correo_electronico } = req.body;

    const result = await query(
      'SELECT id_usuario, nombre_completo FROM usuarios WHERE correo_electronico = $1',
      [correo_electronico]
    );

    // Por seguridad, siempre responder igual aunque no exista el correo
    if (result.rows.length === 0) {
      return res.json({ ok: true, message: 'Si el correo está registrado, recibirás un enlace de recuperación.' });
    }

    const usuario = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await query(
      'UPDATE usuarios SET token_recuperacion = $1, token_expiracion = $2 WHERE id_usuario = $3',
      [token, expiracion, usuario.id_usuario]
    );

    await emailService.sendPasswordResetEmail(correo_electronico, usuario.nombre_completo, token);

    res.json({ ok: true, message: 'Si el correo está registrado, recibirás un enlace de recuperación.' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-03 · Restablecer contraseña con token
// ─────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, nueva_contrasena } = req.body;

    const result = await query(
      'SELECT id_usuario, token_expiracion FROM usuarios WHERE token_recuperacion = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'Token inválido o ya utilizado.' });
    }

    const usuario = result.rows[0];

    if (new Date() > new Date(usuario.token_expiracion)) {
      return res.status(400).json({ ok: false, message: 'El enlace ha expirado. Solicita uno nuevo.' });
    }

    const contrasena_hash = await bcrypt.hash(nueva_contrasena, 10);

    await query(
      `UPDATE usuarios
       SET contrasena_hash = $1, token_recuperacion = NULL, token_expiracion = NULL
       WHERE id_usuario = $2`,
      [contrasena_hash, usuario.id_usuario]
    );

    res.json({ ok: true, message: 'Contraseña restablecida exitosamente.' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-04 · Logout (stateless: el frontend descarta el token)
// ─────────────────────────────────────────────
const logout = (req, res) => {
  res.json({ ok: true, message: 'Sesión cerrada. Descarta el token en el cliente.' });
};

// ─────────────────────────────────────────────
// RF-06 · Verificar cuenta por correo
// ─────────────────────────────────────────────
const verifyAccount = async (req, res, next) => {
  try {
    const { token } = req.query;

    const result = await query(
      'SELECT id_usuario FROM usuarios WHERE token_verificacion = $1 AND verificado = FALSE',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'Token inválido o cuenta ya verificada.' });
    }

    await query(
      'UPDATE usuarios SET verificado = TRUE, token_verificacion = NULL WHERE id_usuario = $1',
      [result.rows[0].id_usuario]
    );

    res.json({ ok: true, message: '¡Cuenta verificada exitosamente! Ya puedes iniciar sesión.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, forgotPassword, resetPassword, logout, verifyAccount };
