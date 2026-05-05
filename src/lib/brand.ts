import { MARQUE_COLORS, type Marque } from './taxonomy'

const DEFAULT = { main: '#5d9228', light: '#e8f2dc', dark: '#4a7a1e' }
let baseBrand: Marque | '' = ''

export function applyBrandTheme(marque: Marque | '' | null) {
  const colors = marque ? MARQUE_COLORS[marque] : DEFAULT
  const root = document.documentElement
  root.style.setProperty('--brand-main', colors.main)
  root.style.setProperty('--brand-light', colors.light)
  root.style.setProperty('--brand-dark', colors.dark)
}

export function setBaseBrand(marque: Marque | '') {
  baseBrand = marque
  applyBrandTheme(marque)
}

export function restoreBaseBrand() {
  applyBrandTheme(baseBrand)
}
