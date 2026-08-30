import { BrandKit } from './types';

export const DEFAULT_BRAND_KITS: Record<string, BrandKit> = {
  minimal_neo: {
    id: 'minimal_neo',
    name: 'Minimal Neo Studio',
    colors: {
      primary: '#0ea5e9',
      secondary: '#6366f1',
      accent: '#f43f5e',
      background: '#0f172a',
      text: '#ffffff'
    },
    primaryFont: { family: 'Inter', label: 'Inter Sans', category: 'sans' },
    secondaryFont: { family: 'Plus Jakarta Sans', label: 'Plus Jakarta', category: 'sans' },
    watermark: {
      position: 'top-right',
      opacity: 0.8,
      scale: 40,
      margin: 16
    }
  },
  hormozi_bold: {
    id: 'hormozi_bold',
    name: 'Alex Hormozi Authority',
    colors: {
      primary: '#eab308',
      secondary: '#ef4444',
      accent: '#22c55e',
      background: '#000000',
      text: '#ffffff'
    },
    primaryFont: { family: 'Impact', label: 'Impact Heavy', category: 'display' },
    secondaryFont: { family: 'Montserrat', label: 'Montserrat Bold', category: 'sans' },
    watermark: {
      position: 'bottom-right',
      opacity: 0.9,
      scale: 45,
      margin: 20
    }
  },
  luxury_serif: {
    id: 'luxury_serif',
    name: 'Luxury Vogue Editorial',
    colors: {
      primary: '#d4af37',
      secondary: '#1c1917',
      accent: '#a855f7',
      background: '#fafaf9',
      text: '#0c0a09'
    },
    primaryFont: { family: 'Playfair Display', label: 'Playfair Serif', category: 'serif' },
    secondaryFont: { family: 'Cinzel', label: 'Cinzel Display', category: 'serif' },
    watermark: {
      position: 'top-left',
      opacity: 0.7,
      scale: 35,
      margin: 24
    }
  },
  cyber_vivid: {
    id: 'cyber_vivid',
    name: 'Cyberpunk Creator',
    colors: {
      primary: '#00ffcc',
      secondary: '#ff007f',
      accent: '#7928ca',
      background: '#05050a',
      text: '#ffffff'
    },
    primaryFont: { family: 'Orbitron', label: 'Orbitron Cyber', category: 'display' },
    secondaryFont: { family: 'Space Grotesk', label: 'Space Grotesk', category: 'sans' },
    watermark: {
      position: 'bottom-left',
      opacity: 0.85,
      scale: 50,
      margin: 16
    }
  }
};
