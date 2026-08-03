import { Rol } from '../types';
import SharedMobileLayout from './SharedMobileLayout';
import BibliotecaMobileBottomNav from './BibliotecaMobileBottomNav';

interface Props {
  children: React.ReactNode;
  rol: Rol;
  nombre: string;
  email: string;
  establecimientoNombre?: string;
  establecimientoLogo?: string;
}

export default function BibliotecaMobileLayout({ children, rol, nombre, email, establecimientoNombre, establecimientoLogo }: Props) {
  return (
    <SharedMobileLayout
      rol={rol}
      nombre={nombre}
      email={email}
      areaPrefix="/biblioteca/m/"
      bottomNav={<BibliotecaMobileBottomNav rol={rol} />}
      establecimientoNombre={establecimientoNombre}
      establecimientoLogo={establecimientoLogo}
    >
      {children}
    </SharedMobileLayout>
  );
}
