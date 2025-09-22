import type { ProjectState, TextLayer } from '@/app/editor/[generationId]/page';

/**
 * Generate an SVG overlay for a project. The overlay contains a
 * `<text>` element for each layer with its position, rotation, scale and
 * styling preserved. Special characters in the text are escaped.
 */
export function createOverlaySvg(project: ProjectState): string {
  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${project.baseWidth}" height="${project.baseHeight}" viewBox="0 0 ${project.baseWidth} ${project.baseHeight}">`,
  );
  project.layers.forEach((layer: TextLayer) => {
    const x = layer.x;
    const y = layer.y;
    const transform = `rotate(${layer.rotation} ${x} ${y}) scale(${layer.scale})`;
    const text = layer.uppercase ? layer.text.toUpperCase() : layer.text;
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    parts.push(
      `<text x="${x}" y="${y}" fill="${layer.color}" font-family="${layer.fontFamily}" font-size="${layer.fontSize}" opacity="${layer.opacity}" transform="${transform}" text-anchor="middle" dominant-baseline="middle">${escaped}</text>`,
    );
  });
  parts.push('</svg>');
  return parts.join('');
}