# UI/UX Design System Specification
# United Pakistan — Dawati Management System (DMS)

## 1. Visual Direction & Principles
- **Aesthetic**: Premium, minimalist, modern SaaS application.
- **Palette**: Clean white and light neutral backgrounds with restrained, purposeful red accents.
- **Priority**: Handheld mobile browser viewport (360px - 428px width) first; responsive scaling to desktop dashboards.
- **Typography**: Inter / sans-serif with strong typographic hierarchy.

## 2. Color Palette & Semantic Tokens

| Token | Hex Value | Purpose |
|---|---|---|
| `--bg-primary` | `#FFFFFF` | Main card and view backgrounds |
| `--bg-secondary` | `#F7F7F7` | Body canvas, page background, input fills |
| `--primary-red` | `#C62828` | Primary CTA buttons, active tab indicators, branding accents |
| `--primary-red-hover` | `#A91F1F` | Button hover and active states |
| `--text-main` | `#252525` | Primary headings, body copy, active text |
| `--text-secondary` | `#737373` | Subtitles, labels, metadata, placeholders |
| `--border` | `#E8E8E8` | Subtle borders, dividers, card outlines |
| `--status-success` | `#16845B` | Active status badges, target achieved |
| `--status-warning` | `#D99021` | Inactive status warnings, pending requests |
| `--status-error` | `#C62828` | Critical alerts, validation errors, deleted indicators |

## 3. Responsive Rules & Component Guidelines
1. **Forms**: Full-width inputs with 44px minimum touch targets on mobile viewports.
2. **Tables vs Cards**: On desktop, show dense data tables. On screens $< 768\text{px}$, automatically collapse table rows into responsive cards to prevent awkward horizontal scrolling.
3. **Quick Action**: Prominent mobile Floating Action Button (FAB) or sticky bottom trigger for rapid "Record Meeting".
4. **Autocomplete Selects**: Touch-friendly searchable dropdowns for Person, Unit, Rabtakar, and Daeen selection.
