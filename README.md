# AI Album Cover Generator

The AI Album Cover Generator is a full‑stack SaaS application that allows users to
generate beautiful square album covers using OpenAI's DALL·E API and manage
their creations in a modern dashboard. Authentication is handled via Auth.js
v5 with support for Google OAuth and a development credentials provider. A
credits system tracks usage and integrates with Stripe Checkout for payments.

## Project Structure

The codebase follows the **Next.js App Router** pattern. Key folders include:

- `src/app` – App router pages and API routes.
- `src/lib` – Shared helpers (Prisma client, style presets, etc.).
- `prisma` – Database schema definition for Prisma.
- `public` – Static assets used by the UI.

## Editor & Export

The simple editor enables you to transform your AI‑generated covers into
polished artwork. You can open the editor from the dashboard by clicking
**Edit** on one of your generations. Each project is saved as a separate
entity in the database so you can revisit and tweak your designs later.

### Editing covers

- **Add and move text** – Click **Add Text** to insert a new layer. Drag text
  directly on the preview to position it.
- **Typography controls** – Adjust font size, colour, scale, rotation,
  opacity and uppercase from the side panel. Future enhancements such as
  custom font uploads, outlines, shadows and blur‑behind effects can be
  layered onto the same architecture.
- **Image filters** – Tweak brightness, contrast, saturation, hue and blur
  using intuitive sliders. Filters are applied in real time and are
  faithfully reproduced on export.
- **Save your work** – Press **Save** to persist the current state. The
  project JSON (crop, filters and layers) is stored in the `Project` table via
  Prisma.

### Exporting your artwork

Click **Export** to download a ZIP archive containing several assets:

- `cover_3000.png` – A 3000×3000 PNG of your flattened design.
- `cover_1400.jpg` – A 1400×1400 high‑quality JPG version.
- `thumb_600.jpg` – A 600×600 thumbnail for social previews.
- `overlay.svg` – An SVG containing vector text layers with positions and
  transforms preserved.
- `project.json` – The full project state so you can re‑import or audit your
  settings later.

The export is performed entirely on the client using a hidden canvas and
compressed with JSZip, avoiding server‑side costs.

### Known limitations

This initial release of the editor focuses on core functionality. The
following enhancements are planned or could be added in the future:

- Crop presets and draggable crop overlays.
- Advanced readability helpers such as automatic contrast, outlines, drop
  shadows and background blurring.
- Undo/redo history and keyboard shortcuts for power users.
- Uploading custom WOFF2 fonts and additional Google Fonts integration.

Contributions are welcome!