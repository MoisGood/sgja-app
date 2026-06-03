import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { to, subject, html, emailConfig } = req.body || {};

  if (!to || !subject || !html) {
    return res.status(400).json({ ok: false, error: 'Faltan campos requeridos' });
  }

  const EMAIL_USER = emailConfig?.email || process.env.EMAIL_USER;
  const EMAIL_PASS = emailConfig?.appPassword || process.env.EMAIL_PASS;

  if (!EMAIL_USER || !EMAIL_PASS) {
    return res.status(400).json({ ok: false, error: 'Credenciales de correo no configuradas' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject,
      html,
    });

    console.log('Correo enviado:', info.response);

    return res.status(200).json({
      ok: true,
      message: 'Correo enviado',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}
