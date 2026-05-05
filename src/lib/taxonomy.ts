export const MARQUES = ['casanoov', 'cazeboo', 'sicaan'] as const
export type Marque = typeof MARQUES[number]

export const MARQUE_LABELS: Record<Marque, string> = {
  casanoov: 'CASANOOV',
  cazeboo: 'CAZEBOO',
  sicaan: 'SICAAN',
}

export const MARQUE_COLORS: Record<Marque, { main: string; light: string; dark: string }> = {
  casanoov: { main: '#5c9934', light: '#e8f2dc', dark: '#4a7a1e' },
  cazeboo:  { main: '#39a0ad', light: '#dff3f5', dark: '#2e8a95' },
  sicaan:   { main: '#db9184', light: '#fdf0ee', dark: '#c4776a' },
}

export const TAXONOMY: Record<Marque, Record<string, string[]>> = {
  casanoov: {
    'Portail battant': [
      'Eiger', 'Vogel', 'Carpatia', 'Giona', 'Cimone', 'Veymont', 'Meije',
      'Arlberg', 'Life', 'Sunny', 'Veleta', 'Ruivo', 'Folya', 'Antelao',
      'Nali Arlberg', 'Nali Veleta', 'Nali Ruivo', 'Razo', 'Athos',
      'Calancia', 'Cervina', 'Cervina Ruivo', 'Dolomite Ruivo', 'Dolomite Sunny', 'Helmis',
    ],
    'Portail coulissant': [
      'Vogel', 'Eiger', 'Veymont', 'Carpatia', 'Arlberg', 'Life', 'Sunny',
      'Veleta', 'Adula', 'Dolomite Ruivo', 'Dolomite Sunny', 'Folya', 'Giona',
      'Halti', 'Nali', 'Nali Veleta', 'Nevis', 'Ruivo', 'Santis', 'Triglav',
    ],
    'Portillon': [
      'Eiger', 'Vogel', 'Giona', 'Cimone', 'Veymont', 'Meije', 'Halti',
      'Arlberg', 'Life', 'Sunny', 'Veleta', 'Athos', 'Nali Ruivo', 'Razo',
      'Antaleo', 'Calancia', 'Cervina', 'Cervina Ruivo', 'Dolomite Sunny',
      'Dolomite Ruivo', 'Folya', 'Helmis', 'Nali', 'Nali Arlberg', 'Nali Veleta',
      'Nevis', 'Olga', 'Santis',
    ],
    'Store latéral': ['Pilat'],
    'Clôture': [
      'Vogel', 'Niesen', 'Arlberg', 'Life', 'Sunny', 'Veleta', 'Adula',
      'Triglav', 'Ruivo', 'Stockhorn', 'Vettoro', 'Velino', 'Vano',
    ],
    'Brise vue souple et rigide': ['Cinto', 'Baldo', 'Viso'],
    'Panneau décoratif': ['Arlberg', 'Sunny', 'Veleta', 'Folya', 'Ruivo'],
    'Cache clim': [
      'Amaro', 'Amaro Sunny', 'Amaro Arlberg', 'Amaro Ruivo',
      'Aneto', 'Aneto Sunny', 'Aneto Arlberg', 'Aneto Ruivo',
    ],
    'Motorisation': [
      'Ranger battant', 'Ranger coulissant', 'Tanker battant',
      'Tanker coulissant', 'Bunker', 'Hicker',
    ],
    'Gazon synthétique': ['Pelmo', 'Orso'],
    'Poteaux': ['Eifel', 'Carmo', 'Dario', 'Elda', 'Velino'],
    'Haie artificielle': ['Pico'],
    'Dalle clipsable': ['Jura', 'Kora', 'Ossa', 'Rila', 'Serra'],
  },
  cazeboo: {
    'Pergola - Tonnelle': [
      'Santa', 'Santa motorisée', 'Piana', 'Agosta', 'Agosta motorisée',
      'Cala', 'Bahia', 'Maria', 'Noosa',
    ],
    'Carport': ['Kleo'],
    'Store banne': ['Fazzio', 'Fazzio LED', 'Vecchio'],
    'Kiosque': ['Grace', 'Sao'],
    'Parasol': ['Keri', 'Navagio'],
  },
  sicaan: {
    'Banc': ['Alix', 'Max'],
    'Bibliothèque': ['Kiara', 'Milie', 'Hera'],
    'Buffet': ['Eden', 'Elio', 'Kurt', 'Luka', 'Saskia'],
    'Canapé': ['Chloe', 'Maja', 'Oskar', 'Rosi', 'Sasha'],
    'Chaise': ['Gaby', 'Iris', 'Nova', 'Olivia'],
    'Chaise haute': ['Gaby', 'Iris', 'Nova', 'Olivia'],
    'Console': ['Alba', 'Saskia'],
    'Fauteuil': [
      'Emma', 'Erik', 'Freyja', 'Gaia', 'Jacques', 'Jofi', 'Judith',
      'Lena', 'Luna', 'Marie', 'Noa', 'Rosi', 'Stella', 'Tao',
    ],
    'Meuble TV': ['Ezra', 'Milo', 'Nolan', 'Saskia', 'Sven', 'Caleb', 'Come'],
    'Pouf': ['Charlotte 1', 'Charlotte 2', 'Juliette', 'Kate', 'Louise', 'Romeo'],
    'Table basse': ['Amaya', 'Giulia', 'Milo', 'Sven'],
    'Table de chevet': ['Milo', 'Nolan', 'Saskia', 'Elin'],
    'Meuble à chaussures': ['Ruben'],
  },
}

export function getTypes(marque: Marque): string[] {
  return Object.keys(TAXONOMY[marque] ?? {})
}

export function getGammes(marque: Marque, type: string): string[] {
  return TAXONOMY[marque]?.[type] ?? []
}

export const COULEURS = [
  'blanc',
  'gris_7016',
  'gris_anthracite',
  'noir',
  'vert',
  'marron',
  'beige',
  'sable',
] as const
export type Couleur = typeof COULEURS[number]

export function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
