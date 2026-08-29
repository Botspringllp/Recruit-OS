---
name: Precision Enterprise
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#715d00'
  on-secondary: '#ffffff'
  secondary-container: '#fed400'
  on-secondary-container: '#6f5c00'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001e2c'
  on-tertiary-container: '#008ebf'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#ffe177'
  secondary-fixed-dim: '#ebc300'
  on-secondary-fixed: '#231b00'
  on-secondary-fixed-variant: '#554500'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
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
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
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
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1440px
  sidebar-width: 280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style
The design system focuses on high-utility enterprise SaaS environments where clarity and speed of information processing are paramount. The brand personality is authoritative yet frictionless, utilizing a **Minimalist** design style that eliminates visual noise to prioritize user workflows. 

The aesthetic is characterized by high-contrast structural elements—specifically the "Deep Navy" navigation zones—contrasted against "Pure White" workspaces. This clear spatial division helps users mentally categorize global navigation versus contextual task execution. The emotional response is one of confidence and reliability, achieved through generous whitespace, precise alignment, and a strict "utility-first" visual hierarchy.

## Colors
This design system employs a high-contrast functional palette. 

- **Primary (#0F172A):** Reserved for the global sidebar, header backgrounds, and primary navigation nodes. It provides a "dark mode" anchor for the application's periphery.
- **Action (#FFD400):** A high-visibility "Bright Yellow" used exclusively for primary calls to action (CTAs), such as "Send Template" or "Save Changes." Text on this color must be the Primary Deep Navy for legibility.
- **Surface (#FFFFFF):** The main content panels use a pure white background to maximize readability of data and messaging feeds.
- **Supportive Tones:** A secondary "Sky Blue" (#38BDF8) is used for info-level alerts and links, while a neutral slate (#64748B) handles secondary text and iconography.

## Typography
**Inter** is the sole typeface, chosen for its exceptional legibility in data-heavy interfaces. 

- **Hierarchy:** We use a tight scale where headlines are distinguished primarily by weight (600-700) rather than just size. 
- **Utility:** Labels use a slightly increased letter-spacing and uppercase styling to differentiate them from interactive body text.
- **Readability:** Body text is optimized at 16px for standard use, with a 14px variant for dense tables or secondary metadata.

## Layout & Spacing
The design system utilizes a **Fixed-Fluid hybrid grid**. 
- **Sidebar:** A fixed 280px left-hand navigation column in Deep Navy.
- **Main Canvas:** A fluid content area that stretches up to a max-width of 1440px, centered on larger screens.
- **Rhythm:** An 8px linear scale governs all padding and margins. 
- **Adaptivity:** On tablet (under 1024px), the sidebar collapses into a hamburger menu. On mobile (under 768px), horizontal margins reduce to 16px and stackable elements (cards) take full width.

## Elevation & Depth
Depth is signaled through **Tonal Layering** and **Subtle Shadows**. 

1. **Level 0 (Background):** The main application background uses a very light neutral tint (#F8FAFC) to make the white cards pop.
2. **Level 1 (Cards/Panels):** Pure white surfaces with a 1px border (#E2E8F0) and a soft, high-diffusion shadow: `0 4px 6px -1px rgb(0 0 0 / 0.05)`.
3. **Level 2 (Overlays/Modals):** Floating elements use a more pronounced shadow to indicate focus: `0 20px 25px -5px rgb(0 0 0 / 0.1)`.

Avoid heavy blurs or glassmorphism to maintain the clean, "Saas-standard" professional feel.

## Shapes
We use a **Soft** shape language (4px - 12px radii). 
- **Standard UI (Inputs, Buttons, Small Cards):** 4px (0.25rem) radius for a precise, professional look.
- **Large Containers (Main Panels):** 8px (0.5rem) radius.
- **Badges/Status Tags:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.

## Components
- **Primary Buttons:** Solid Bright Yellow (#FFD400) with Deep Navy text. No gradients. 4px border radius.
- **Secondary Buttons:** Transparent background with a 1px Deep Navy border or a light grey ghost style for low-priority actions.
- **Status Badges:** Use a light tinted background of the status color (e.g., Light Green for 'Success') with a high-contrast dark text of the same hue.
- **Messaging Feed:** Messages should be grouped by date. Outgoing messages (WhatsApp) use a subtle light-blue tint, while incoming messages remain white with a thin border. 
- **Sidebars:** High-contrast Deep Navy. Active states should be indicated by a Bright Yellow vertical bar on the left edge of the menu item (4px width).
- **Input Fields:** 1px border (#CBD5E1). On focus, the border changes to Primary Deep Navy with a 2px outer "halo" of the secondary yellow at 20% opacity.