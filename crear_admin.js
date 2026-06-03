const admin = require('firebase-admin');
const fs = require('fs');

const sa = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

admin.initializeApp({ credential: admin.credential.cert(sa) });

admin.firestore().collection('usuarios').doc('FQiBt92jG0XQNGD1oG1IEMk7Xtp1').set({
  id_usuario:          'FQiBt92jG0XQNGD1oG1IEMk7Xtp1',
  email:               'soportetipresente@gmail.com',
  nombre_completo:     'Administrador CRAReservas',
  foto_url:            null,
  rol:                 'ADMIN',
  id_establecimiento:  'est_001',
  activo:              true,
  created_at:          admin.firestore.Timestamp.now(),
  updated_at:          admin.firestore.Timestamp.now(),
}).then(() => {
  console.log('✅ Usuario ADMIN creado correctamente');
  process.exit(0);
}).catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
