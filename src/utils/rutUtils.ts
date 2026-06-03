export function limpiarRUT(rut: string): string {
  return rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
}

/** Para guardar: solo dígito + DV, sin puntos */
export function formatoSimple(rut: string): string {
  const limpio = limpiarRUT(rut);
  if (limpio.length < 2) return limpio;
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}

/** Para mostrar: 15.135.354-6 */
export function formatearRUT(rut: string): string {
  const limpio = limpiarRUT(rut);
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  const formateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formateado}-${dv}`;
}

function digitoVerificador(rut: string): string {
  let suma = 0;
  let multiplo = 2;
  for (let i = rut.length - 1; i >= 0; i--) {
    suma += parseInt(rut[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = suma % 11;
  const dv = 11 - resto;
  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
}

export function validarRUT(rut: string): boolean {
  const limpio = limpiarRUT(rut);
  if (limpio.length < 2) return false;
  if (!/^[0-9]+[0-9K]$/.test(limpio)) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return digitoVerificador(cuerpo) === dv;
}
