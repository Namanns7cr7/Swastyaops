---
name: Enterprise Precision
colors:
  surface: '#101418'
  surface-dim: '#101418'
  surface-bright: '#353a3e'
  surface-container-lowest: '#0a0f13'
  surface-container-low: '#181c20'
  surface-container: '#1c2024'
  surface-container-high: '#262a2f'
  surface-container-highest: '#31353a'
  on-surface: '#dfe3e8'
  on-surface-variant: '#c1c6d6'
  inverse-surface: '#dfe3e8'
  inverse-on-surface: '#2d3135'
  outline: '#8b909f'
  outline-variant: '#414754'
  surface-tint: '#adc7ff'
  primary: '#adc7ff'
  on-primary: '#002e68'
  primary-container: '#1a73e8'
  on-primary-container: '#ffffff'
  inverse-primary: '#005bc0'
  secondary: '#50d7ee'
  on-secondary: '#00363e'
  secondary-container: '#00b0c6'
  on-secondary-container: '#003e46'
  tertiary: '#c4c7ca'
  on-tertiary: '#2d3133'
  tertiary-container: '#74777a'
  on-tertiary-container: '#ffffff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc7ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#9fefff'
  secondary-fixed-dim: '#50d7ee'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#004e59'
  tertiary-fixed: '#e0e3e6'
  tertiary-fixed-dim: '#c4c7ca'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#44474a'
  background: '#101418'
  on-background: '#dfe3e8'
  surface-variant: '#31353a'
typography:
  display-lg:
    fontFamily: Work Sans
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Work Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Work Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Work Sans
    fontSize: 20px
    fontWeight: '500'
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
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  kpi-number:
    fontFamily: Work Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-max: 1440px
  gutter: 24px
---

## Brand & Style
The design system centers on a "Premium Government Enterprise" aesthetic—a blend of high-utility corporate functionalism and modern digital clarity. The personality is authoritative, reliable, and efficient, designed to instill confidence in high-stakes operational environments.

The visual style follows a **Modern Corporate** approach with a heavy emphasis on structural clarity. It utilizes a refined color palette that balances trust (Blue) with operational freshness (Teal). The interface is characterized by generous white space, rigorous grid alignment, and subtle depth transitions that differentiate system-generated data from AI-assisted insights.

## Colors
This design system utilizes a semantic color structure optimized for dual-mode environments. 

- **Primary & Secondary:** Used for branding, primary actions, and progress indicators. In Dark Mode, these shift to higher-vibrancy, lower-saturation variants (`#8AB4F8`, `#4ECDE6`) to maintain WCAG AA compliance against dark surfaces.
- **Surface Strategy:** Employs a three-tier elevation system in dark mode (`BG Primary` > `Surface` > `Elevated`) to create visual hierarchy without relying solely on shadows.
- **Status Colors:** These are strictly reserved for operational feedback. Success (Green), Warning (Amber), and Critical (Red) must maintain a contrast ratio of at least 4.5:1 against their respective backgrounds.

## Typography
The typographic scale is designed for data density and readability. 

- **Work Sans** is used for headings and KPI metrics to provide a professional, grounded feel.
- **Inter** handles all body copy and UI controls, ensuring legibility across varying screen densities.
- **JetBrains Mono** is applied to status labels, timestamps, and confidence scores to evoke a sense of technical precision and "system-generated" data.
- **Numerical Formatting:** All financial and volume metrics must follow the **en-IN** locale (e.g., 10,00,000) to align with regional administrative standards.

## Layout & Spacing
The design system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

- **Rhythm:** An 8px linear scale governs all padding and margins. 
- **Margins:** Desktop views use 32px outer margins, while mobile scales down to 16px to maximize screen real estate.
- **Data Density:** Layouts should prioritize information density without crowding; use 24px gutters between major dashboard widgets and 16px for internal card padding.
- **Mobile Touch:** All interactive elements on mobile (buttons, list items) must maintain a minimum 48px tap target height. Primary actions on mobile should be pinned to the bottom of the viewport using a sticky container with a background blur.

## Elevation & Depth
Depth is conveyed through a combination of **Tonal Layering** and **Soft Shadows**.

- **Level 0 (Background):** Primary background color. No shadow.
- **Level 1 (Cards/Surfaces):** Use `surface` color with a 1px border. In light mode, apply a very soft ambient shadow (Y: 2px, B: 8px, Opacity: 4%).
- **Level 2 (Modals/Overlays):** Use `elevated` color. Increase shadow spread and opacity.
- **Interactive States:** On hover, cards should transition to a 1px `accent_blue` border or a slightly higher elevation shadow rather than changing background color.
- **Blur Effects:** Apply a 12px backdrop blur to sticky headers and navigation bars to maintain context while scrolling.

## Shapes
The shape language is "Soft-Professional."

- **Cards & Major Containers:** Use 16px (`rounded-lg`) for a modern, approachable enterprise look.
- **Buttons & Inputs:** Use 8px (`rounded-md`) to maintain a precise, functional feel.
- **Chips & Badges:** Use "Pill" (full) rounding for status indicators and confidence badges.
- **Alert Strips:** Alerts use a 0px radius on the left edge to accommodate the 4px vertical status indicator bar.

## Components

### KPI Cards
- **Structure:** Title (label-md), Large Number (kpi-number), Trend Indicator (body-sm with icon), and Timestamp (label-md).
- **Trend Rules:** Positive trends in success-green; negative in critical-red. Use "en-IN" formatting for all counts.

### AI Response Cards
- **Styling:** Use a subtle `accent_teal` top border (2px) to distinguish AI-generated content.
- **Features:** 
    - Title and a "Confidence Badge" (Pill-shaped, JetBrains Mono).
    - Collapsible "Why" section using a ghost-button trigger.
    - Primary Action Button aligned to the bottom right.

### Alerts & Notifications
- **Design:** Tinted background (5% opacity of status color) with a solid 4px left-border strip in the status color.
- **Hierarchy:** High-priority alerts should use semi-bold text for the title.

### Buttons & Inputs
- **Primary:** Solid `accent_blue` with white/dark-text.
- **Secondary:** Outlined with 1px `border` and `text_primary`.
- **Inputs:** 48px height, 1px border, labels positioned above the field. Active state uses 2px `accent_blue` border.

### Skeleton States
- Use a 1.5s linear shimmer effect.
- Shimmer colors: 
    - Light: `#E1E4E8` to `#F1F3F5`
    - Dark: `#232B33` to `#2D3640`

### Maps & Charts
- **Gridlines:** Use `border` color at 50% opacity.
- **Labels:** Use `text_secondary` at 12px.
- **Adaptation:** In Dark Mode, invert map tiles to "Dark/Muted" theme and increase data point stroke widths for visibility.
