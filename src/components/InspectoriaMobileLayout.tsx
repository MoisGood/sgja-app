import { Rol } from '../types';
import SharedMobileLayout from './SharedMobileLayout';
import InspectoriaMobileBottomNav from './InspectoriaMobileBottomNav';

interface Props {
  children: React.ReactNode;
  rol: Rol;
  nombre: string;
  email: string;
  establecimientoNombre?: string;
  establecimientoLogo?: string;
}

export default function InspectoriaMobileLayout({ children, rol, nombre, email, establecimientoNombre, establecimientoLogo }: Props) {
  return (
    <SharedMobileLayout
      rol={rol}
      nombre={nombre}
      email={email}
      areaPrefix="/inspectoria/m/"
      bottomNav={<InspectoriaMobileBottomNav rol={rol} />}
      establecimientoNombre={establecimientoNombre}
      establecimientoLogo={establecimientoLogo}
    >
      {children}
    </SharedMobileLayout>
  );
}
