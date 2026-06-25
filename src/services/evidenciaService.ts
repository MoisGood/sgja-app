import { supabase } from '../lib/supabase';

const BUCKET = 'evidencias';
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.7;

export async function comprimirImagen(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Error al comprimir imagen'));
      }, 'image/jpeg', JPEG_QUALITY);
    };
    img.onerror = () => reject(new Error('Error al cargar imagen'));
    img.src = URL.createObjectURL(file);
  });
}

export async function subirEvidencia(
  ticketId: string,
  archivo: File,
  tipo: 'falla' | 'reparacion'
): Promise<{ url?: string; error?: string }> {
  try {
    const blob = await comprimirImagen(archivo);
    const ext = 'jpg';
    const path = `${ticketId}/${tipo}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg',
      });

    if (uploadError) return { error: uploadError.message };

    const { data: publicUrl } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return { url: publicUrl.publicUrl };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al subir imagen' };
  }
}

export async function obtenerEvidencias(ticketId: string): Promise<string[]> {
  const { data } = await supabase.storage
    .from(BUCKET)
    .list(ticketId, { sortBy: { column: 'created_at', order: 'desc' } });

  if (!data) return [];

  return data.map(f => {
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(`${ticketId}/${f.name}`);
    return pub.publicUrl;
  });
}

export async function eliminarEvidencia(path: string): Promise<string | null> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return error ? error.message : null;
}

export async function subirFotoEquipo(
  idEstablecimiento: string,
  archivo: File
): Promise<{ url?: string; error?: string }> {
  try {
    const blob = await comprimirImagen(archivo);
    const ext = 'jpg';
    const path = `equipos/${idEstablecimiento}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg',
      });

    if (uploadError) return { error: uploadError.message };

    const { data: publicUrl } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return { url: publicUrl.publicUrl };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al subir imagen' };
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
