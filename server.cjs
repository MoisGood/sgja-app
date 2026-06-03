const http = require('http');
const nodemailer = require('nodemailer');

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log(`📨 ${req.method} ${req.url}`);

  // Handle preflight
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // Accept all methods to /api/send-email
  if (!req.url.startsWith('/api/send-email')) {
    return res.writeHead(404).end(JSON.stringify({ error: 'Not found' }));
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { to, subject, html, emailConfig } = JSON.parse(body);
      if (!to || !subject || !html) {
        res.writeHead(400); res.end(JSON.stringify({ error: 'Faltan campos' }));
        return;
      }

      const user = emailConfig?.email || process.env.GMAIL_USER;
      const pass = emailConfig?.appPassword || process.env.GMAIL_APP_PASSWORD;
      const displayName = emailConfig?.displayName || 'SGJA';
      const port = parseInt(emailConfig?.port) || 587;
      const secure = port === 465;

      if (!user || !pass) {
        res.writeHead(400); res.end(JSON.stringify({ error: 'Credenciales no configuradas' }));
        return;
      }

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port,
        secure,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"${displayName}" <${user}>`,
        to,
        subject,
        html,
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`📧 API de correos local en http://localhost:${PORT}/api/send-email`);
});
