---
name: KontentOS V2
colors:
  surface: '#111317'
  surface-dim: '#111317'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#d0c2d5'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#998d9e'
  outline-variant: '#4d4353'
  surface-tint: '#e0b6ff'
  primary: '#e0b6ff'
  on-primary: '#4c007d'
  primary-container: '#9d4edd'
  on-primary-container: '#fffdff'
  inverse-primary: '#8433c4'
  secondary: '#d7ffc5'
  on-secondary: '#053900'
  secondary-container: '#2ff801'
  on-secondary-container: '#0f6d00'
  tertiary: '#00dbe9'
  on-tertiary: '#00363a'
  tertiary-container: '#00828b'
  on-tertiary-container: '#f9ffff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f2daff'
  primary-fixed-dim: '#e0b6ff'
  on-primary-fixed: '#2e004e'
  on-primary-fixed-variant: '#6a0baa'
  secondary-fixed: '#79ff5b'
  secondary-fixed-dim: '#2ae500'
  on-secondary-fixed: '#022100'
  on-secondary-fixed-variant: '#095300'
  tertiary-fixed: '#7df4ff'
  tertiary-fixed-dim: '#00dbe9'
  on-tertiary-fixed: '#002022'
  on-tertiary-fixed-variant: '#004f54'
  background: '#111317'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
  electric-purple: '#9D4EDD'
  cyber-neon-green: '#39FF14'
  deep-slate: '#1A1D23'
  charcoal-black: '#0F1115'
  hyper-cyan: '#00F0FF'
  glass-border: rgba(255, 255, 255, 0.12)
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 36px
    fontWeight: '900'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  button-text:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  max-width: 1440px
---

## Brand & Style

The design system embodies "The Creator's Secret Weapon"—a high-octane, performance-driven environment designed to bridge the gap between raw creativity and viral authority. The brand personality is dual-natured: it is as energetic and "hype-focused" as a trending TikTok, yet as precise and reliable as a high-end fintech dashboard. It targets the modern content entrepreneur who values speed, efficiency, and data-backed confidence.

### Design Style: Cyber-Glassmorphism
This design system utilizes a **Cyber-Glassmorphism** aesthetic. This style merges the depth and sophistication of frosted glass layers with the aggressive, high-contrast energy of "Cyber-Neon" accents. 

- **Translucency:** Interfaces use varying levels of background blur to maintain context while focusing on active tasks.
- **Glowing Accents:** Interactive elements and data visualizations utilize inner and outer glows to simulate a "live" digital environment.
- **Structural Precision:** Despite the vibrant colors, the layout remains strictly professional with clear grids, ensuring the "Authority" aspect of the brand is never lost to visual noise.

## Colors

The palette is optimized for a high-contrast **Dark Mode** default. The primary engine of the UI is fueled by **Electric Purple**, used for primary actions and brand identity. **Cyber Neon Green** serves as the functional "Success" and "Viral" indicator, used sparingly for high-impact call-outs and growth metrics.

**Deep Slate** and **Charcoal Black** form the structural foundation, providing a canvas that allows the vibrant accents to pop without causing eye strain. **Hyper Cyan** is introduced as a tertiary color for secondary data points and technical information, reinforcing the "OS" (Operating System) feel.

## Typography

The typography strategy balances "Impact" with "Utility." 

- **Headlines:** Montserrat is used in heavy weights (700-900) to create an authoritative, editorial feel. Display sizes use tight letter-spacing to mimic viral social media overlays.
- **Body:** Inter provides maximum readability for scriptwriting, data analysis, and long-form settings.
- **Technical/Labels:** JetBrains Mono is utilized for "Creator DNA" scores, metrics, and metadata to emphasize the platform's analytical "Engine" and "OS" intelligence.

All large display text should be treated with high-contrast colors (white or primary neon) against the dark background.

## Layout & Spacing

The layout follows a **Fluid Grid** system with an 8px base unit. 

- **Desktop:** A 12-column grid with generous 24px gutters. Sidebars are fixed-width (280px) to house the "Omni-Channel" navigation, while the main content area expands.
- **Mobile:** A 4-column grid with 16px margins.
- **The Dashboard Feel:** Information density is high but organized through "Card Grouping." Spacing should prioritize the "Daily Dashboard" (Section 2.1) as the central hub, using increased vertical padding (64px+) between major modules to prevent cognitive overload.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Backdrop Blurs** rather than traditional heavy shadows.

1.  **Level 0 (Base):** Charcoal Black (#0F1115).
2.  **Level 1 (Cards/Surface):** Deep Slate (#1A1D23) with a 1px `glass-border`.
3.  **Level 2 (Modals/Overlays):** Semi-transparent Deep Slate (70% opacity) with a 20px background blur (backdrop-filter) and a subtle outer glow using the Primary or Secondary color.
4.  **Indicators:** Active states use a "Cyber Glow"—a soft, diffused 8px outer shadow tinted with the element's hex color to simulate a neon light source.

## Shapes

The design uses a **Rounded** (0.5rem base) language to feel modern and approachable, but maintains a structural "tech" feel by avoiding fully circular (pill) shapes for everything except status tags and specific "Vibe Pills."

- **Cards & Inputs:** 0.5rem (rounded)
- **Buttons:** 1rem (rounded-lg) for a punchier, friendly feel.
- **Status Tags/Pills:** Full rounded (pill-shaped) to differentiate them from functional inputs.

## Components

### Buttons & CTAs
- **Primary CTA:** Solid Electric Purple with white text. High-energy actions (like "Publish Now") include a subtle `0 0 15px` outer glow in Purple.
- **Viral Action:** For specific features like "Viral Idea Roulette," use a Cyber Neon Green background with Charcoal Black text for maximum punch.
- **Glass Button:** Transparent background with a 1px white border (20% opacity) and blur, used for secondary actions.

### Idea Studio Cards (2.4)
Cards should feature a 1px `glass-border`. When hovered, the border transitions from gray to Electric Purple. Content readiness scores should be displayed in a JetBrains Mono "Badge" in the top-right corner.

### Inputs & Teleprompter (3.2)
- **Inputs:** Deep Slate background, no shadow, 1px border. Focus state triggers a Cyber Neon Green border.
- **Teleprompter:** Full-screen overlay with a 90% black tint and white text. The "Active Line" should be highlighted with a Cyber Neon Green underline.

### Data Visualization (6.1)
Charts and graphs must use the **Primary (Purple)**, **Secondary (Green)**, and **Tertiary (Cyan)** colors. Avoid traditional reds or oranges; use Purple for "Neutral/High" and Green for "Growth."

### Floating Action Button (FAB)
A "Quick Create" FAB sits in the bottom right of the mobile view, styled as a circular Electric Purple button with a white '+' icon and a strong Cyber Glow.