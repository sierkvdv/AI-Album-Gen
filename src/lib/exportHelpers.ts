import type { ProjectState, TextLayer, Layer } from '@/app/editor/[generationId]/page';

/**
 * Genereert een SVG met alle zichtbare tekstlagen uit het project.
 * Bewaart positie, schaal, rotatie, font‑eigenschappen en outlines.
 * Schatten zoals schaduwen en blur-behind worden niet ondersteund in SVG.
 */
export function createOverlaySvg(project: ProjectState): string {
  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${project.baseWidth}" height="${project.baseHeight}" viewBox="0 0 ${project.baseWidth} ${project.baseHeight}" xml:space="preserve">`,
  );
  for (const layer of project.layers as Layer[]) {
    if (layer.type !== 'text' || layer.visible === false) continue;
    const tl = layer as TextLayer;
    const x = tl.x;
    const y = tl.y;
    const transform = `rotate(${tl.rotation} ${x} ${y}) scale(${tl.scale})`;
    const textContent = (tl.uppercase ? tl.text.toUpperCase() : tl.text)
      .split('\n')
      .map((line, idx) => {
        const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const dy = idx === 0 ? '0' : `${tl.fontSize * tl.lineHeight}`;
        return `<tspan x="${x}" dy="${dy}">${escaped}</tspan>`;
      })
      .join('');
    const styleParts: string[] = [];
    if (tl.letterSpacing !== 0) styleParts.push(`letter-spacing:${tl.letterSpacing}px`);
    if (tl.lineHeight !== 1) styleParts.push(`line-height:${tl.lineHeight}`);
    const strokeAttr = tl.outline
      ? ` stroke="${tl.outline.color}" stroke-width="${tl.outline.width}" stroke-linejoin="round"`
      : '';
    parts.push(
      `<text x="${x}" y="${y}" font-family="${tl.fontFamily}" font-size="${tl.fontSize}" font-weight="${tl.fontWeight}" font-style="${tl.italic ? 'italic' : 'normal'}" fill="${tl.color}" opacity="${tl.opacity}" transform="${transform}" text-anchor="middle" dominant-baseline="middle"${strokeAttr}${styleParts.length ? ` style="${styleParts.join(';')}"` : ''}>${textContent}</text>`,
    );
  }
  parts.push('</svg>');
  return parts.join('');
}
