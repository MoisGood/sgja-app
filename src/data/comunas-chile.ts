// src/data/comunas-chile.ts
// Regiones y comunas de Chile (datos estáticos de referencia).

export interface RegionChile {
  region: string;
  comunas: string[];
}

export const REGIONES_DE_CHILE: RegionChile[] = [
  {
    region: 'Arica y Parinacota',
    comunas: ['Arica', 'Camarones', 'Putre', 'General Lagos'],
  },
  {
    region: 'Tarapacá',
    comunas: [
      'Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Camiña', 'Colchane',
      'Huara', 'Pica',
    ],
  },
  {
    region: 'Antofagasta',
    comunas: [
      'Antofagasta', 'Mejillones', 'Sierra Gorda', 'Taltal',
      'Calama', 'Ollagüe', 'San Pedro de Atacama',
      'Tocopilla', 'María Elena',
    ],
  },
  {
    region: 'Atacama',
    comunas: [
      'Copiapó', 'Caldera', 'Tierra Amarilla',
      'Chañaral', 'Diego de Almagro',
      'Vallenar', 'Alto del Carmen', 'Freirina', 'Huasco',
    ],
  },
  {
    region: 'Coquimbo',
    comunas: [
      'La Serena', 'Coquimbo', 'Andacollo', 'La Higuera', 'Paihuano', 'Vicuña',
      'Illapel', 'Canela', 'Los Vilos', 'Salamanca',
      'Ovalle', 'Combarbalá', 'Monte Patria', 'Punitaqui', 'Río Hurtado',
    ],
  },
  {
    region: 'Valparaíso',
    comunas: [
      'Valparaíso', 'Casablanca', 'Concón', 'Juan Fernández', 'Puchuncaví',
      'Quintero', 'Viña del Mar', 'Isla de Pascua',
      'Los Andes', 'Calle Larga', 'Rinconada', 'San Esteban',
      'La Ligua', 'Cabildo', 'Papudo', 'Petorca', 'Zapallar',
      'Quillota', 'Calera', 'Hijuelas', 'La Cruz', 'Nogales',
      'San Antonio', 'Algarrobo', 'Cartagena', 'El Quisco', 'El Tabo', 'Santo Domingo',
      'San Felipe', 'Catemu', 'Llaillay', 'Panquehue', 'Putaendo', 'Santa María',
      'Quilpué', 'Limache', 'Olmué', 'Villa Alemana',
    ],
  },
  {
    region: 'Metropolitana de Santiago',
    comunas: [
      'Santiago', 'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque',
      'Estación Central', 'Huechuraba', 'Independencia', 'La Cisterna',
      'La Florida', 'La Granja', 'La Pintana', 'La Reina', 'Las Condes',
      'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa',
      'Pedro Aguirre Cerda', 'Peñalolén', 'Providencia', 'Pudahuel',
      'Quilicura', 'Quinta Normal', 'Recoleta', 'Renca', 'San Joaquín',
      'San Miguel', 'San Ramón', 'Vitacura',
      'Puente Alto', 'Pirque', 'San José de Maipo',
      'Colina', 'Lampa', 'Tiltil',
      'San Bernardo', 'Buin', 'Calera de Tango', 'Paine',
      'Melipilla', 'Alhué', 'Curacaví', 'María Pinto', 'San Pedro',
      'Talagante', 'El Monte', 'Isla de Maipo', 'Padre Hurtado', 'Peñaflor',
    ],
  },
  {
    region: "Libertador General Bernardo O'Higgins",
    comunas: [
      'Rancagua', 'Codegua', 'Coinco', 'Coltauco', 'Doñihue', 'Graneros',
      'Las Cabras', 'Machalí', 'Malloa', 'Mostazal', 'Olivar', 'Peumo',
      'Pichidegua', 'Quinta de Tilcoco', 'Rengo', 'Requínoa', 'San Vicente',
      'Pichilemu', 'La Estrella', 'Litueche', 'Marchihue', 'Navidad', 'Paredones',
      'San Fernando', 'Chépica', 'Chimbarongo', 'Lolol', 'Nancagua',
      'Palmilla', 'Peralillo', 'Placilla', 'Pumanque', 'Santa Cruz',
    ],
  },
  {
    region: 'Maule',
    comunas: [
      'Talca', 'Constitución', 'Curepto', 'Empedrado', 'Maule', 'Pelarco',
      'Pencahue', 'Río Claro', 'San Clemente', 'San Rafael',
      'Cauquenes', 'Chanco', 'Pelluhue',
      'Curicó', 'Hualañé', 'Licantén', 'Molina', 'Rauco', 'Romeral',
      'Sagrada Familia', 'Teno', 'Vichuquén',
      'Linares', 'Colbún', 'Longaví', 'Parral', 'Retiro', 'San Javier',
      'Villa Alegre', 'Yerbas Buenas',
    ],
  },
  {
    region: 'Ñuble',
    comunas: [
      'Chillán', 'Bulnes', 'Cobquecura', 'Coelemu', 'Coihueco', 'Chillán Viejo',
      'El Carmen', 'Ninhue', 'Ñiquén', 'Pemuco', 'Pinto', 'Portezuelo',
      'Quillón', 'Quirihue', 'Ránquil', 'San Carlos', 'San Fabián',
      'San Ignacio', 'San Nicolás', 'Treguaco', 'Yungay',
    ],
  },
  {
    region: 'Biobío',
    comunas: [
      'Concepción', 'Coronel', 'Chiguayante', 'Florida', 'Hualqui', 'Lota',
      'Penco', 'San Pedro de la Paz', 'Santa Juana', 'Talcahuano', 'Tomé', 'Hualpén',
      'Arauco', 'Cañete', 'Contulmo', 'Curanilahue', 'Lebu', 'Los Álamos', 'Tirúa',
      'Alto Biobío', 'Antuco', 'Cabrero', 'Laja', 'Los Ángeles', 'Mulchén',
      'Nacimiento', 'Negrete', 'Quilaco', 'Quilleco', 'San Rosendo',
      'Santa Bárbara', 'Tucapel', 'Yumbel',
    ],
  },
  {
    region: 'Araucanía',
    comunas: [
      'Temuco', 'Carahue', 'Cunco', 'Curarrehue', 'Freire', 'Galvarino',
      'Gorbea', 'Lautaro', 'Loncoche', 'Melipeuco', 'Nueva Imperial',
      'Padre Las Casas', 'Perquenco', 'Pitrufquén', 'Pucón', 'Saavedra',
      'Teodoro Schmidt', 'Toltén', 'Vilcún', 'Villarrica',
      'Angol', 'Collipulli', 'Curacautín', 'Ercilla', 'Lonquimay',
      'Los Sauces', 'Lumaco', 'Purén', 'Renaico', 'Traiguén', 'Victoria',
    ],
  },
  {
    region: 'Los Ríos',
    comunas: [
      'Valdivia', 'Corral', 'Futrono', 'La Unión', 'Lago Ranco', 'Lanco',
      'Los Lagos', 'Máfil', 'Mariquina', 'Paillaco', 'Panguipulli', 'Río Bueno',
    ],
  },
  {
    region: 'Los Lagos',
    comunas: [
      'Puerto Montt', 'Calbuco', 'Cochamó', 'Fresia', 'Frutillar',
      'Los Muermos', 'Llanquihue', 'Maullín', 'Puerto Varas',
      'Castro', 'Ancud', 'Chonchi', 'Curaco de Vélez', 'Dalcahue',
      'Puqueldón', 'Queilén', 'Quellón', 'Quemchi', 'Quinchao',
      'Chaitén', 'Futaleufú', 'Hualaihué', 'Palena',
    ],
  },
  {
    region: 'Aysén del General Carlos Ibáñez del Campo',
    comunas: [
      'Coyhaique', 'Lago Verde', 'Aysén', 'Cisnes', 'Guaitecas',
      'Chile Chico', 'Río Ibáñez', 'Cochrane', "O'Higgins", 'Tortel',
    ],
  },
  {
    region: 'Magallanes y de la Antártica Chilena',
    comunas: [
      'Punta Arenas', 'Laguna Blanca', 'Río Verde', 'San Gregorio',
      'Cabo de Hornos', 'Antártica',
      'Porvenir', 'Primavera', 'Timaukel',
      'Natales', 'Torres del Paine',
    ],
  },
];

/** Comunas de una región (o [] si no existe). */
export function comunasDeRegion(region: string): string[] {
  return REGIONES_DE_CHILE.find((r) => r.region === region)?.comunas ?? [];
}

/** Región a la que pertenece una comuna (o '' si no se encuentra). */
export function regionDeComuna(comuna: string): string {
  if (!comuna) return '';
  const norm = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const target = norm(comuna);
  return (
    REGIONES_DE_CHILE.find((r) => r.comunas.some((c) => norm(c) === target))
      ?.region ?? ''
  );
}
