import { Rol } from '../types';
import SharedMobileLayout from './SharedMobileLayout';
import SecretariaMobileBottomNav from './SecretariaMobileBottomNav';

interface Props {
  children: React.ReactNode;
  rol: Rol;
  nombre: string;
  email: string;
  establecimientoNombre?: string;
}

export default function SecretariaMobileLayout({ children, rol, nombre, email, establecimientoNombre }: Props) {
  return (
    <SharedMobileLayout
      rol={rol}
      nombre={nombre}
      email={email}
      areaPrefix="/secretaria/m/"
      bottomNav={<SecretariaMobileBottomNav rol={rol} />}
      establecimientoNombre={establecimientoNombre}
    >
      {children}
    </SharedMobileLayout>
  );
}
