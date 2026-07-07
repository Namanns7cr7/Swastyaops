---
name: SwasthyaOps AI
colors:
  surface: '#f7fafd'
  surface-dim: '#d7dade'
  surface-bright: '#f7fafd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f7'
  surface-container: '#ebeef2'
  surface-container-high: '#e5e8ec'
  surface-container-highest: '#e0e3e6'
  on-surface: '#181c1f'
  on-surface-variant: '#414754'
  inverse-surface: '#2d3134'
  inverse-on-surface: '#eef1f5'
  outline: '#727785'
  outline-variant: '#c1c6d6'
  surface-tint: '#005bc0'
  primary: '#005bbf'
  on-primary: '#ffffff'
  primary-container: '#1a73e8'
  on-primary-container: '#ffffff'
  inverse-primary: '#adc7ff'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#8df5e4'
  on-secondary-container: '#007165'
  tertiary: '#5c5e60'
  on-tertiary: '#ffffff'
  tertiary-container: '#757778'
  on-tertiary-container: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc7ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#8df5e4'
  secondary-fixed-dim: '#70d8c8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f7fafd'
  on-background: '#181c1f'
  surface-variant: '#e0e3e6'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 57px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.25px
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
  title-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.15px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.5px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.25px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.1px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
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
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is engineered for high-stakes healthcare administration, blending the systematic rigor of Google Material 3 with a premium, enterprise-grade finish. It balances a sense of governmental authority with the cutting-edge efficiency of AI-driven logistics.

The aesthetic is **Corporate Modern** with a focus on **Minimalism**. It prioritizes clarity, utilizing generous white space to reduce cognitive load for command center operators who monitor vast amounts of real-time data from PHCs and CHCs. The interface should feel reliable, precise, and transparent, evoking a "single source of truth" for district health operations.

## Colors

The palette is anchored in **Google Blue (#1A73E8)** for primary actions and navigational branding, symbolizing trust and institutional stability. **Teal (#00897B)** serves as a secondary accent, particularly for health-tech associations and positive AI insights.

The background is strictly white or off-white to maintain a clinical, clean environment. Semantic colors (Success, Warning, Error) follow a slightly desaturated but highly legible profile to ensure they remain professional while drawing necessary attention to critical health metrics.

## Typography

This design system utilizes **Inter** across all levels to achieve a systematic, utilitarian, and neutral appearance that excels in data-heavy dashboards.

Headlines should be used sparingly to define major command center modules. Data points within charts and tables should prioritize `label-lg` and `body-md` for maximum legibility. For numerical data in AI-driven insights, use medium or semi-bold weights to distinguish static labels from dynamic variables.

## Layout & Spacing

The layout follows a **Fluid Grid** system based on an 8px spacing rhythm. 

- **Desktop:** 12-column grid with 24px gutters. Use wide margins (32px) to allow the "Cloud Dashboard" aesthetic to breathe.
- **Tablet:** 8-column grid with 16px gutters.
- **Mobile:** 4-column grid with 16px margins.

Cards and containers should be grouped logically using `gap: 24px`. Information-dense tables can utilize a condensed 8px vertical padding, while dashboard overview pages should use `lg` (24px) or `xl` (32px) padding to maintain a premium feel.

## Elevation & Depth

This design system employs **Tonal Layers** and **Ambient Shadows** to create a structured hierarchy. Surfaces do not "float" aggressively; instead, they sit subtly above the background to indicate interactivity.

- **Level 0 (Background):** Pure White (#FFFFFF) or very light grey (#F8F9FA).
- **Level 1 (Cards/Containers):** White with a 1px border (#E0E3E7) and a soft, diffused shadow (0px 4px 12px rgba(0,0,0,0.05)).
- **Level 2 (Hover/Active):** Slightly deeper shadow (0px 8px 24px rgba(0,0,0,0.08)) to indicate lift.
- **Modals:** Deep shadows with a 20% backdrop blur to focus the operator's attention on critical alerts.

## Shapes

The shape language is modern and approachable. 
- **Standard Cards:** Use `rounded-lg` (16px) to match the premium dashboard aesthetic.
- **Buttons & Inputs:** Use `rounded-md` (8px) to maintain a professional, slightly more structured look for functional elements.
- **Status Chips:** Use full pill-shaping (100px) to distinguish them clearly from interactive buttons.
- **Charts:** Bar and progress chart ends should be slightly rounded (4px) to remain consistent with the overall soft-geometric theme.

## Components

### Buttons
Primary buttons use the Primary Blue background with white text. Use "Filled" styles for main actions (e.g., "Export Report") and "Outlined" styles for secondary actions.

### Status Chips
Used for PHC availability or emergency levels. 
- **Active/Stable:** Teal background (10% opacity) with dark teal text.
- **Critical:** Red background (10% opacity) with dark red text.
- Chips should always include a small leading dot for immediate visual status recognition.

### Input Fields
Follow Material 3 "Outlined" style. 1px border (#DADCE0) that transitions to 2px Primary Blue on focus. Labels should be small and sit on the border line.

### Cards
All cards must have a 16px corner radius. Dashboard cards should have a consistent header style with a `title-md` font and an optional icon slot in the top right for contextual actions.

### Interactive Charts
Use Teal and Blue as the primary data colors. Tooltips should be dark (Neutral #3C4043) with high-contrast white text to pop against the light UI. Grid lines within charts must be very faint (#F1F3F4).

### Data Tables
Rows should have a subtle hover state (#F8F9FA). Use `label-md` for headers in all-caps or medium weight to differentiate from the data rows.
