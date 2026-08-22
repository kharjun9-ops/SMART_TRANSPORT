---
name: Lumina Transit
colors:
  surface: '#0c1322'
  surface-dim: '#0c1322'
  surface-bright: '#323949'
  surface-container-lowest: '#070e1d'
  surface-container-low: '#141b2b'
  surface-container: '#191f2f'
  surface-container-high: '#232a3a'
  surface-container-highest: '#2e3545'
  on-surface: '#dce2f7'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dce2f7'
  inverse-on-surface: '#293040'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0c1322'
  on-background: '#dce2f7'
  surface-variant: '#2e3545'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  status-number:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 20px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

This design system is engineered for the high-velocity, high-stakes environment of public transportation. It targets urban commuters who require immediate, glanceable information in varying lighting conditions. 

The aesthetic identity is **High-Contrast Glassmorphism**. By combining a deep, near-black foundation with vibrant, glowing functional accents, the UI prioritizes legibility and movement. The interface should feel like a high-tech head-up display (HUD)—precise, luminous, and responsive. Visual depth is created through translucent layers and background blurs, ensuring that even dense transit data remains organized and non-overwhelming.

## Colors

The palette is anchored by **Deep Charcoal (#111827)** to minimize eye strain during night-time use and maximize the pop of functional colors. 

- **Primary Blue (#3B82F6):** Used for wayfinding, active routes, and primary call-to-action buttons.
- **Crowd Indicators:** A strict semantic system where **Success Green (#10B981)** represents "Plenty of Seats," **Warning Amber (#F59E0B)** indicates "Standing Room Only," and **Danger Red (#EF4444)** signals "Near Capacity."
- **Glass Effects:** Surfaces use a semi-transparent version of #1F2937 (typically 60-80% opacity) with a 16px background blur to maintain contrast against map backgrounds or list scrolling.

## Typography

**Inter** is the exclusive typeface for this design system, chosen for its exceptional legibility in digital interfaces and tall x-height, which aids in reading bus numbers and ETAs quickly.

- **Headlines:** Use Bold (700) weights with slight negative letter spacing to create a compact, authoritative feel.
- **Functional Data:** ETAs and Route Numbers should use the `status-number` style to ensure they are the first thing a user sees.
- **Labels:** Small labels use Medium (500) or Semi-bold (600) weights to remain legible even when rendered in semi-transparent states.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a focus on bottom-oriented reachability for one-handed mobile use. 

- **Breakpoints:** Mobile (up to 600px), Tablet (601px - 1024px), Desktop (1025px+).
- **Mobile Layout:** Content is housed in a "Drawer" system that slides over the map. Margins are set to 20px to keep touch targets away from screen edges.
- **Rhythm:** An 8px-based spacing system is used for component layout, while a 4px "micro-unit" is used for tight data clusters (e.g., a bus icon next to its route number).

## Elevation & Depth

Depth is achieved through **Glassmorphism** rather than traditional shadows. 

1. **Base Layer:** The map or deep charcoal background.
2. **Surface Layer:** Glass cards with `backdrop-filter: blur(16px)` and a `1px` solid border using `#FFFFFF10` (white at 10% opacity) to define edges against the dark background.
3. **Primary Elevation:** For active elements like a selected route card, use a subtle inner glow (box-shadow: inset) of the primary blue color to make the element appear energized.
4. **Overlays:** Modals and high-priority alerts use a darker, less transparent background blur to pull focus.

## Shapes

The shape language is defined by **Rounded-2XL (1.5rem/24px)** corners for all primary containers and cards. This creates a friendly, modern silhouette that contrasts with the technical nature of transit data.

- **Buttons & Inputs:** Use the `rounded-lg` (16px) setting to maintain a consistent but slightly tighter curve.
- **Status Chips:** Use a full "Pill" shape (999px) to distinguish status indicators (like "On Time" or "Delayed") from interactive buttons.
- **Icons:** Should be encased in circular or heavily rounded square containers to match the overall softness.

## Components

- **Transit Cards:** These are the primary data vehicles. They feature a 24px corner radius, a 1px subtle border, and a glass background. The route number should be high-contrast (Primary Blue) against the glass.
- **Action Buttons:** Primary buttons are solid Primary Blue with white text. Secondary buttons should be "Ghost" style with a 1px border and high-blur glass background.
- **Crowd Level Chips:** Small pill-shaped badges. Use a "Glow" effect (a soft drop shadow of the same color) to make the green/amber/red status feel like a physical LED light.
- **Input Fields:** Search bars should be full-width with a subtle glass background and a persistent search icon. Use `rounded-xl` for these fields.
- **Route Timeline:** A vertical line component. The line should be neutral gray, but the "Active" portion of the trip should glow in Primary Blue.
- **Live Indicators:** For "Live" bus locations, use a pulsing animation on the icon to signify real-time data updates.