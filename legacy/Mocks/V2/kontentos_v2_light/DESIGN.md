---
name: KontentOS V2 Light
colors:
  surface: '#f8f9fa'
  surface-dim: '#d8dae2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3fc'
  surface-container: '#ecedf6'
  surface-container-high: '#e6e8f0'
  surface-container-highest: '#e1e2ea'
  on-surface: '#191c22'
  on-surface-variant: '#4d4353'
  inverse-surface: '#2d3037'
  inverse-on-surface: '#eff0f9'
  outline: '#7e7384'
  outline-variant: '#d0c2d5'
  surface-tint: '#8433c4'
  primary: '#8231c2'
  on-primary: '#ffffff'
  primary-container: '#9d4edd'
  on-primary-container: '#fffdff'
  inverse-primary: '#e0b6ff'
  secondary: '#186e00'
  on-secondary: '#ffffff'
  secondary-container: '#76fc51'
  on-secondary-container: '#197200'
  tertiary: '#006673'
  on-tertiary: '#ffffff'
  tertiary-container: '#008191'
  on-tertiary-container: '#fafeff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f2daff'
  primary-fixed-dim: '#e0b6ff'
  on-primary-fixed: '#2e004e'
  on-primary-fixed-variant: '#6a0baa'
  secondary-fixed: '#7aff55'
  secondary-fixed-dim: '#5ce139'
  on-secondary-fixed: '#032100'
  on-secondary-fixed-variant: '#105300'
  tertiary-fixed: '#9eefff'
  tertiary-fixed-dim: '#55d7ed'
  on-tertiary-fixed: '#001f24'
  on-tertiary-fixed-variant: '#004e59'
  background: '#f9f9ff'
  on-background: '#191c22'
  surface-variant: '#e1e2ea'
  surface-glass: rgba(255, 255, 255, 0.7)
  glass-border: rgba(0, 0, 0, 0.08)
  deep-slate: '#1a1d23'
  cyber-neon-green: '#2eb800'
  electric-purple: '#9d4edd'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 32px
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
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  button-text:
    fontFamily: Montserrat
    fontSize: 15px
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
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  max-width: 1440px
---

## Brand & Style
This design system transition to Light Mode evolves the "Creator’s Secret Weapon" from a dark, clandestine engine into a high-clarity, professional command center. The brand maintains its high-energy, performance-driven personality but shifts toward an "Airy Professionalism." It bridges the gap between a high-end productivity suite and a viral creative studio.

The design style is **Glassmorphism**, characterized by light, frosted-glass surfaces, semi-transparent white blurs, and crisp, technical borders. The aesthetic avoids the heaviness of traditional shadows, opting for depth created through layered translucency and subtle tonal shifts. The result is a UI that feels lightweight, innovative, and exceptionally clean.

## Colors
The palette is centered on a crisp, off-white surface (`#f8f9fa`) to provide an airy, focused workspace. 

- **Primary (Electric Purple):** Retained at `#9d4edd`, providing a vibrant, high-contrast focal point for primary actions.
- **Secondary (Cyber Neon Green):** Adjusted to a slightly deeper, more legible `#2eb800` for light mode accessibility while maintaining its "viral" energy.
- **Tertiary (Hyper Cyan):** Refined to `#00acc1` to serve as a technical indicator for metrics and data.
- **Neutral/Text:** Deep Slate (`#1a1d23`) is used for primary typography to ensure maximum readability and a grounded, professional feel against the light background.

## Typography
The typography strategy prioritizes "Authority" and "Utility." 

**Montserrat** handles headlines with heavy weights, creating a bold, editorial presence. On mobile, display sizes scale down slightly to maintain layout integrity while preserving the impactful "viral" look. 

**Inter** is the workhorse for body content, providing a neutral, highly readable canvas for scripts and descriptions. 

**JetBrains Mono** is reserved for technical metadata, "DNA" scores, and metrics, reinforcing the "OS" aspect of the system with a monospaced, analytical character. Text colors should remain strictly Deep Slate or Primary Purple to maintain high contrast on light surfaces.

## Layout & Spacing
The layout follows a **Fluid Grid** model with an 8px base rhythm. This ensures a consistent, mathematical feel across all components.

- **Desktop:** 12-column grid. Main content areas use generous 48px margins to maintain an "airy" feel, while sidebars are fixed at 280px for a persistent, utility-driven navigation experience.
- **Mobile:** 4-column grid with 16px margins to maximize screen real estate.
- **Rhythm:** Vertical spacing between major modules should be significant (64px+) to create a clear "Dashboard" hierarchy, preventing the high density of information from feeling overwhelming.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Glassmorphism** rather than traditional drop shadows.

- **Level 0 (Base):** Solid off-white surface.
- **Level 1 (Cards):** Frosted white (`rgba(255, 255, 255, 0.7)`) with a `backdrop-filter: blur(12px)` and a 1px `glass-border` (`rgba(0,0,0,0.08)`).
- **Level 2 (Modals/Overlays):** High-opacity white glass (85%) with a 20px blur and a subtle, soft shadow (`0 10px 30px rgba(0,0,0,0.04)`) to lift it off the surface.
- **Interactive States:** Hovering over elements removes the blur or increases border opacity, creating a tactile "clarity" effect.

## Shapes
The shape language is **Rounded**, striking a balance between modern friendliness and professional structure.

- **Cards & Inputs:** 0.5rem (base roundedness) for a clean, architectural look.
- **Primary Buttons:** 1rem (rounded-lg) to make them feel punchy and approachable.
- **Tags & Status Pills:** Full-pill (rounded-full) to clearly distinguish non-interactive metadata from functional UI elements.

## Components
### Buttons
- **Primary:** Solid Electric Purple with white text. Use a subtle inner glow rather than a drop shadow to maintain the "cyber" aesthetic.
- **Secondary (Viral):** Cyber Neon Green background with Deep Slate text for high-impact growth actions.
- **Ghost/Glass:** Transparent background, 1px Deep Slate border at 15% opacity, and Montserrat text.

### Cards & Studio Modules
Cards utilize the Level 1 Glassmorphism style. On hover, the 1px border transitions from light gray to Electric Purple. Metrics within cards should be set in JetBrains Mono for a technical, precise feel.

### Input Fields
Inputs use a white surface with a 1px border. On focus, the border shifts to Cyber Neon Green, and the background gains a very subtle green tint (`rgba(46, 184, 0, 0.02)`) to indicate the active state.

### Teleprompter & Overlays
For focused creative tasks, use a full-screen semi-transparent white overlay (95% opacity). The "Active Line" of text should be highlighted with an Electric Purple underline or a soft purple glass backplate.

### Data Visualization
Charts must use Primary Purple, Secondary Green, and Tertiary Cyan. Use tonal variations of these colors for secondary data series, avoiding traditional red/amber unless indicating a critical error.