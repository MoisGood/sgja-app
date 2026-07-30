import { Rol } from '../types';
import SharedMobileLayout from './SharedMobileLayout';
import SecretariaMobileBottomNav from './SecretariaMobileBottomNav';

interface Props {
  children: React.ReactNode;
  rol: Rol;
  nombre: string;
  email: string;
}

export default function SecretariaMobileLayout({ children, rol, nombre, email }: Props) {
  return (
    <SharedMobileLayout
      rol={rol}
      nombre={nombre}
      email={email}
      areaPrefix="/secretaria/m/"
      bottomNav={<SecretariaMobileBottomNav rol={rol} />}
    >
      {children}
    </SharedMobileLayout>
  );
}
