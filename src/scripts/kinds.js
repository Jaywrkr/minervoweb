// Las seis formas de Minervo. El color viene de los tokens CSS; la tecla es su pad.
export const KINDS = [
  { id: 'circulo', name: 'círculo', key: 'a', token: 'menta' },
  { id: 'dona', name: 'dona', key: 's', token: 'naranja' },
  { id: 'luna', name: 'media luna', key: 'd', token: 'mostaza' },
  { id: 'triangulo', name: 'triángulo', key: 'f', token: 'verde' },
  { id: 'pildora', name: 'píldora', key: 'g', token: 'rosa' },
  { id: 'cuadrado', name: 'cuadrado', key: 'h', token: 'violeta' },
];

export const kindOf = (id) => KINDS.find((k) => k.id === id);

// Medio tamaño relativo de cada forma respecto a su escala base (para encajarlas en una celda).
export const EXTENT = { circulo: 1, dona: 0.9, luna: 1.15, triangulo: 1.1, pildora: 1.4, cuadrado: 0.95 };

// Iconos de 24×24 para los pads.
export const ICONS = {
  circulo: '<circle cx="12" cy="12" r="10" fill="var(--menta)"/>',
  dona: '<circle cx="12" cy="12" r="7.5" fill="none" stroke="var(--naranja)" stroke-width="5"/>',
  luna: '<path d="M2 8 A10 10 0 0 0 22 8 Z" fill="var(--mostaza)"/>',
  triangulo: '<path d="M4 2 L22 12 L4 22 Z" fill="var(--verde)"/>',
  pildora: '<rect x="1" y="7" width="22" height="10" rx="5" fill="var(--rosa)"/>',
  cuadrado: '<rect x="3" y="3" width="18" height="18" fill="var(--violeta)"/>',
};
