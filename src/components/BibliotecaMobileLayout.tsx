import { Rol } from '../types';
import SharedMobileLayout from './SharedMobileLayout';
import BibliotecaMobileBottomNav from './BibliotecaMobileBottomNav';

interface Props {
  children: React.ReactNode;
  rol: Rol;
  nombre: string;
  email: string;
}

export default function BibliotecaMobileLayout({ children, rol, nombre, email }: Props) {
  return (
    <SharedMobileLayout
      rol={rol}
      nombre={nombre}
      email={email}
      areaPrefix="/biblioteca/m/"
      bottomNav={<BibliotecaMobileBottomNav rol={rol} />}
    >
      {children}
    </SharedMobileLayout>
  );
}
