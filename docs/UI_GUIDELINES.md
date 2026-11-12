# UI Guidelines

**Status:** Phase 0 design direction  
**Date:** 12 November 2026

## Design principles

Modern Minimal with a Calm & Friendly healthcare tone. The product should feel premium, clear, professional and reassuring. Use the attached boards as visual guidance for hierarchy, component style and sample flows. Their names, statistics, qualifications, medications, dates, addresses and contact details are mock content, not approved clinic facts.

## Color and type

Use semantic tokens rather than scattered hex values. Starting palette values from the blueprint are provisional pending contrast checks:

| Token | Reference | Use |
| --- | --- | --- |
| Forest / primary | `#075B46` or `#075B4B` | Main actions, navigation, strong emphasis |
| Sage | `#A9C9B5` | Supporting fills, borders, selected states |
| Mint | `#E6F0E9` | Soft backgrounds and calm accents |
| Ivory | `#F8F8F2` | Warm page/card surface |
| White | `#FFFFFF` | Content surface |
| Charcoal | `#263A32` | Body text and high contrast |

The supplied boards show small variations in forest/mint hex values; select and document one token set during UI implementation. No pink, purple or lavender. Use Manrope or Inter for interface text; headings can use the selected UI family with a restrained display treatment. Confirm font licensing and load locally/through an approved provider.

## Layout and components

- Generous whitespace, clear page titles and simple navigation. Use rounded cards and subtle shadows sparingly; preserve a clear page background and content hierarchy.
- Establish spacing, radius, border, elevation, typography and focus tokens before building screens.
- Buttons need primary, secondary and quiet/link styles, with clear hover, focus, disabled and loading states.
- Inputs require visible labels, help/error text, keyboard operation and appropriate autocomplete. Do not rely on placeholder text as a label.
- Status badges pair color with text/icon; never encode appointment status by color alone.
- Tables/lists need responsive alternatives, empty/loading/error states and accessible row actions.
- Use Lucide icons consistently; decorative botanicals and illustrations must not obscure text or control focus.
- Charts and dashboards use synthetic data until actual operational definitions are agreed.

## Page guidance

- **Public home:** photographic hero carousel with both verified doctors only after approved images/biographies; explicit controls and accessible slide announcements; speciality cards; separate illustrated mint carousel; how it works; doctor introductions; approved testimonials; contact/location; footer. Ensure meaningful content remains available without carousel interaction.
- **About/doctors/services/contact:** clear content hierarchy; factual claims require clinic review. Address, map and opening hours remain placeholders until provided.
- **Booking:** step indicator with clear back/next, selected speciality/doctor/date/time summary, timezone clarity, unavailable-slot feedback, final review and confirmation. Prevent accidental duplicate submission.
- **Patient portal:** mobile-first navigation and dashboard; obvious next appointment and actions; separate medical/administrative information; accessible PDF/record download states.
- **Doctor portal:** schedule views day/week/month, patient identity confirmation, clear draft/final states for notes and prescriptions, and explicit finalization review.
- **Admin:** operational data and clinical data separated in navigation and permissions; confirm booking source (phone/walk-in/online); audit-impacting changes clearly indicated.

## Responsive and accessibility requirements

Design mobile first and adapt through tablet/desktop breakpoints. Support keyboard-only navigation, visible focus, semantic landmarks/headings, screen-reader labels, reduced motion, touch targets, and WCAG AA contrast targets. Verify all palette combinations during implementation. Do not autoplay carousels in a way that prevents reading; pause controls are required if movement is automatic.

## Content and imagery

Do not invent provider qualifications, achievements, experience, testimonials, treatment claims or clinic facts. Use clearly identified placeholders in drafts and replace only with clinic-approved information. Obtain appropriate consent and usage rights for doctor/patient imagery. Use licensed imagery or bespoke healthcare illustrations; avoid real patient imagery without documented consent.
