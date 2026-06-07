import { useState, useEffect } from 'react';
import { Rol } from '../types';
import { obtenerUsuarioPorUid } from '../services/supabaseDB';
import { obtenerSolicitudPorUid, obtenerDatosPersonales } from '../services/database';
import { obtenerEstadoMantenimiento, debeBloquear } from '../services/mantenimientoService';
import { marcarCuentaActiva } from '../services/funcionarios';
import { handleError } from '../utils/errorHandler';
import type { User } from '@supabase/supabase-js';

export interface PerfilState {
  uid: string | null;
  rol: Rol | null;
  idEstablecimiento: string | null;
  nombre: string | null;
  apellidos: string | null;
  email: string | null;
  autorizado: boolean;
  documentoExiste: boolean;
  usuarioInactivo: boolean;
  datosPendientes: boolean;
  mantenimientoBloqueo: boolean;
  mttoHorario: string;
}

const PERFIL_VACIO: PerfilState = {
  uid: null, rol: null, idEstablecimiento: null,
  nombre: null, apellidos: null, email: null,
  autorizado: false, documentoExiste: false,
  usuarioInactivo: false, datosPendientes: false,
  mantenimientoBloqueo: false, mttoHorario: '',
};

export function useUsuarioLogueado(user: User | null): {
  perfil: PerfilState;
  cargando: boolean;
} {
  const [perfil, setPerfil] = useState<PerfilState>(PERFIL_VACIO);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let mounted = true;
    setCargando(true);

    if (!user) {
      setPerfil(PERFIL_VACIO);
      setCargando(false);
      return;
    }

    const resolver = async () => {
      try {
        const userEmail = user.email || '';
        const userData = await obtenerUsuarioPorUid(user.id);

        if (!mounted) return;

        if (!userData) {
          const solicitud = await obtenerSolicitudPorUid(user.id);
          const pendiente = solicitud && solicitud.estado === 'pendiente';

          if (!mounted) return;

          if (pendiente) {
            setPerfil({
              uid: user.id, rol: null, idEstablecimiento: null,
              nombre: solicitud.nombre, apellidos: solicitud.apellidos,
              email: solicitud.correo || userEmail || null,
              autorizado: false, documentoExiste: true,
              usuarioInactivo: true, datosPendientes: false,
              mantenimientoBloqueo: false, mttoHorario: '',
            });
          } else {
            setPerfil({
              uid: user.id, rol: null, idEstablecimiento: null,
              nombre: user.user_metadata?.full_name || userEmail.split('@')[0] || null,
              apellidos: null,
              email: userEmail || null,
              autorizado: false, documentoExiste: false,
              usuarioInactivo: true, datosPendientes: false,
              mantenimientoBloqueo: false, mttoHorario: '',
            });
          }
          setCargando(false);
          return;
        }

        if (!userData.activo) {
          const solicitudExistente = await obtenerSolicitudPorUid(user.id);

          if (!mounted) return;

          setPerfil({
            uid: user.id, rol: null,
            idEstablecimiento: userData.id_establecimiento,
            nombre: userData.nombre, apellidos: userData.apellidos,
            email: userEmail || userData.email || '',
            autorizado: false,
            documentoExiste: !!solicitudExistente,
            usuarioInactivo: true, datosPendientes: false,
            mantenimientoBloqueo: false, mttoHorario: '',
          });
          setCargando(false);
          return;
        }

        if (userData.rol !== 'ADMIN' && userData.id_establecimiento) {
          const mtto = await obtenerEstadoMantenimiento(userData.id_establecimiento);
          const bloquear = debeBloquear(mtto.activo, mtto.desde, mtto.hasta, userData.rol, mtto.modo);

          if (!mounted) return;

          if (bloquear) {
            setPerfil({
              uid: user.id, rol: userData.rol as Rol,
              idEstablecimiento: userData.id_establecimiento,
              nombre: userData.nombre, apellidos: userData.apellidos,
              email: userEmail || userData.email || '',
              autorizado: false, documentoExiste: true,
              usuarioInactivo: false, datosPendientes: false,
              mantenimientoBloqueo: true,
              mttoHorario: `${mtto.desde} - ${mtto.hasta}`,
            });
            setCargando(false);
            return;
          }
        }

        let datosPendientes = false;
        if (userData.rol !== 'APODERADO') {
          const datos = await obtenerDatosPersonales(user.id);
          datosPendientes = !datos || !datos.apellidos || !datos.telefono || !datos.ciudad || !datos.direccion || !datos.emergencia_nombre || !datos.emergencia_telefono || !datos.emergencia_parentesco;
        }

        if (!mounted) return;

        setPerfil({
          uid: user.id,
          rol: userData.rol as Rol,
          idEstablecimiento: userData.id_establecimiento,
          nombre: userData.nombre,
          apellidos: userData.apellidos,
          email: userData.email || userEmail,
          autorizado: true,
          documentoExiste: true,
          usuarioInactivo: false,
          datosPendientes,
          mantenimientoBloqueo: false,
          mttoHorario: '',
        });

        sessionStorage.setItem('id_usuario_actual', user.id);
        marcarCuentaActiva(user.id).catch(e => handleError(e, 'Error al marcar cuenta activa'));
        setCargando(false);
      } catch (error) {
        handleError(error, 'Error al obtener datos del usuario');

        if (!mounted) return;

        setPerfil({
          uid: user.id, rol: null, idEstablecimiento: null,
          nombre: null, apellidos: null,
          email: user.email || null,
          autorizado: false, documentoExiste: false,
          usuarioInactivo: false, datosPendientes: false,
          mantenimientoBloqueo: false, mttoHorario: '',
        });
        setCargando(false);
      }
    };

    resolver();
  }, [user?.id]);

  return { perfil, cargando };
}
