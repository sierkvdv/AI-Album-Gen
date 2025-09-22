"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Represents a single editable text layer on the canvas. Each layer stores
 * its own transform (position, scale and rotation) and basic typography
 * options. Additional readability options (outline, shadow, blurBehind)
 * can be added later.
 */
export interface TextLayer {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  scale: number;
  rotation: number;
  x: number;
  y: number;
  opacity: number;
  uppercase: boolean;
}

/**
 * Project state persisted to the backend. The editor stores the base
 * dimensions of the original image along with crop/filter settings and
 * an array of text layers. Additional metadata can be stored on the
 * filters and crop objects.
 */
export interface ProjectState {
  id: string;
  baseAssetUrl: string;
  baseWidth: number;
  baseHeight: number;
  crop: any;
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
    vignette: number;
    grain: number;
    blur: number;
  };
  layers: TextLayer[];
}

/**
 * Compute a CSS filter string from the filters object. This helper is used
 * to apply the same visual adjustments to the preview image. The values
 * correspond closely with the sliders in the UI.
 */
function computeCssFilters(filters: ProjectState['filters']): string {
  return [
    `brightness(${filters.brightness}%)`,
    `contrast(${filters.contrast}%)`,
    `saturate(${filters.saturation}%)`,
    `hue-rotate(${filters.hue}deg)`,
    filters.blur > 0 ? `blur(${filters.blur}px)` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * The main editor page. It loads the generation and any existing project
 * state from the backend, allows the user to add/edit/remove text layers
 * and tweak simple filters, and provides save/export actions.
 */
export default function EditorPage({ params }: { params: { generationId: string } }) {
  const router = useRouter();
  const generationId = params.generationId;
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectState | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{ layerId: string; offsetX: number; offsetY: number } | null>(null);

  // Load generation and project on mount. If no existing project exists for
  // this generation, one will be created on demand by POSTing to the
  // /api/projects/new endpoint. This ensures a persistent ID is assigned.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Fetch the generation details (only URL and size). This also
        // implicitly verifies the user has access to the generation.
        const genRes = await fetch(`/api/generation/${generationId}`);
        if (!genRes.ok) throw new Error('Failed to load generation');
        const generation = await genRes.json();
        // Try to find an existing project for this generation. We use
        // generationId as the project ID for convenience.
        let proj: ProjectState | null = null;
        const projRes = await fetch(`/api/projects/${generationId}`);
        if (projRes.ok) {
          const json = await projRes.json();
          proj = json.project;
        }
        // If no project exists, create one now using the image dimensions.
        if (!proj) {
          // Load the image to determine its intrinsic size
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = generation.imageUrl;
          await img.decode();
          const initialProject = {
            baseAssetUrl: generation.imageUrl,
            baseWidth: img.naturalWidth,
            baseHeight: img.naturalHeight,
            crop: {
              aspect: '1:1',
              x: 0,
              y: 0,
              scale: 1,
            },
            filters: {
              brightness: 100,
              contrast: 100,
              saturation: 100,
              hue: 0,
              vignette: 0,
              grain: 0,
              blur: 0,
            },
            layers: [] as TextLayer[],
          };
          const newProjRes = await fetch('/api/projects/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ generationId, project: initialProject }),
          });
          if (!newProjRes.ok) throw new Error('Failed to create project');
          const newProjJson = await newProjRes.json();
          proj = newProjJson.project;
        }
        // Load the base image for preview
        const img2 = new Image();
        img2.crossOrigin = 'anonymous';
        img2.src = proj.baseAssetUrl;
        await img2.decode();
        if (!cancelled) {
          setProject(proj as ProjectState);
          setImage(img2);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          alert('Failed to load project');
          router.push('/dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [generationId, router]);

  // Helper to update a specific layer. Accepts a partial update and merges
  // it into the layer with the given ID.
  function updateLayer(id: string, update: Partial<TextLayer>) {
    setProject((prev) => {
      if (!prev) return prev;
      const newLayers = prev.layers.map((layer) =>
        layer.id === id ? { ...layer, ...update } : layer,
      );
      return { ...prev, layers: newLayers };
    });
  }

  // Add a new text layer at the centre of the canvas. The new layer is
  // immediately selected for editing. A random ID is generated to avoid
  // collisions across multiple layers.
  function handleAddText() {
    if (!project) return;
    const id = Math.random().toString(36).substring(2, 9);
    const newLayer: TextLayer = {
      id,
      text: 'New Text',
      fontFamily: 'sans-serif',
      fontSize: 32,
      color: '#ffffff',
      scale: 1,
      rotation: 0,
      x: project.baseWidth / 2,
      y: project.baseHeight / 2,
      opacity: 1,
      uppercase: false,
    };
    setProject({ ...project, layers: [...project.layers, newLayer] });
    setSelectedLayerId(id);
  }

  // Delete the currently selected layer
  function handleDeleteSelected() {
    if (!project || !selectedLayerId) return;
    setProject({
      ...project,
      layers: project.layers.filter((l) => l.id !== selectedLayerId),
    });
    setSelectedLayerId(null);
  }

  // Persist the project to the server. Only the JSON fields are sent; the
  // server will update the timestamp automatically.
  async function handleSave() {
    if (!project) return;
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project }),
    });
    if (res.ok) {
      alert('Project saved');
    } else {
      alert('Failed to save project');
    }
  }

  // Export the current project as a ZIP archive containing flattened PNGs,
  // JPGs, an overlay SVG and the project JSON. This function renders
  // everything to offscreen canvases at the desired resolutions and
  // compresses the results with JSZip.
  async function handleExport() {
    if (!project || !image) return;
    // Dynamically import JSZip to reduce the initial bundle size
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    // Helper to render the project at a target resolution. Returns a blob
    // containing a PNG or JPG. For JPG exports a quality parameter can be
    // specified.
    async function renderToBlob(size: number, mime: 'image/png' | 'image/jpeg', quality?: number) {
      const aspect = project.crop?.aspect || '1:1';
      // Determine crop rectangle. For now, we assume a square crop covering
      // the entire image. Additional crop support can be added later.
      const srcW = project.baseWidth;
      const srcH = project.baseHeight;
      // Create offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      // Apply filters to drawing context
      ctx.filter = computeCssFilters(project.filters);
      // Draw base image scaled to fill the canvas
      ctx.drawImage(image, 0, 0, size, size);
      ctx.filter = 'none';
      // Draw each layer
      project.layers.forEach((layer) => {
        ctx.save();
        // Translate to centre of layer then apply rotation and scale
        const scaleX = size / srcW;
        const scaleY = size / srcH;
        const x = layer.x * scaleX;
        const y = layer.y * scaleY;
        ctx.translate(x, y);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.scale(layer.scale * scaleX, layer.scale * scaleY);
        ctx.globalAlpha = layer.opacity;
        ctx.fillStyle = layer.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;
        const text = layer.uppercase ? layer.text.toUpperCase() : layer.text;
        ctx.fillText(text, 0, 0);
        ctx.restore();
      });
      return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) throw new Error('Failed to render');
          resolve(blob);
        }, mime, quality);
      });
    }
    // Render different sizes
    const cover3000 = await renderToBlob(3000, 'image/png');
    const cover1400 = await renderToBlob(1400, 'image/jpeg', 0.92);
    const thumb600 = await renderToBlob(600, 'image/jpeg', 0.8);
    // Overlay SVG. We preserve vector text so it can be edited later
    const svgParts: string[] = [];
    svgParts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${project.baseWidth}" height="${project.baseHeight}" viewBox="0 0 ${project.baseWidth} ${project.baseHeight}">`,
    );
    project.layers.forEach((layer) => {
      const x = layer.x;
      const y = layer.y;
      const transform = `rotate(${layer.rotation} ${x} ${y}) scale(${layer.scale})`;
      const text = layer.uppercase ? layer.text.toUpperCase() : layer.text;
      svgParts.push(
        `<text x="${x}" y="${y}" fill="${layer.color}" font-family="${layer.fontFamily}" font-size="${layer.fontSize}" opacity="${layer.opacity}" transform="${transform}" text-anchor="middle" dominant-baseline="middle">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`,
      );
    });
    svgParts.push('</svg>');
    const overlaySvg = svgParts.join('');
    // Append files to zip
    zip.file('cover_3000.png', await cover3000.arrayBuffer());
    zip.file('cover_1400.jpg', await cover1400.arrayBuffer());
    zip.file('thumb_600.jpg', await thumb600.arrayBuffer());
    zip.file('overlay.svg', overlaySvg);
    zip.file('project.json', JSON.stringify(project, null, 2));
    // Generate zip and trigger download
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-${project.id}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Begin drag on a text layer. We compute the offset between the pointer
  // location and the layer centre so that the layer doesn't jump.
  function handlePointerDown(e: React.PointerEvent, layer: TextLayer) {
    e.stopPropagation();
    setSelectedLayerId(layer.id);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    dragInfo.current = { layerId: layer.id, offsetX, offsetY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  // Move the active layer while dragging
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragInfo.current || !project) return;
    const { layerId, offsetX, offsetY } = dragInfo.current;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const scaleX = project.baseWidth / containerRect.width;
    const scaleY = project.baseHeight / containerRect.height;
    const x = (e.clientX - containerRect.left - offsetX) * scaleX;
    const y = (e.clientY - containerRect.top - offsetY) * scaleY;
    updateLayer(layerId, { x, y });
  }

  // End dragging
  function handlePointerUp(e: React.PointerEvent) {
    if (dragInfo.current) {
      dragInfo.current = null;
    }
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  // Render the editing controls for the selected layer
  function renderLayerControls() {
    if (!project || !selectedLayerId) return null;
    const layer = project.layers.find((l) => l.id === selectedLayerId);
    if (!layer) return null;
    return (
      <div className="p-4 border rounded bg-gray-50 mt-4 space-y-2">
        <div>
          <label className="block text-sm font-medium">Text</label>
          <textarea
            value={layer.text}
            onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="block text-sm font-medium">Font size</label>
            <input
              type="number"
              min={8}
              max={200}
              value={layer.fontSize}
              onChange={(e) => updateLayer(layer.id, { fontSize: parseInt(e.target.value) })}
              className="w-full border rounded p-1"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium">Color</label>
            <input
              type="color"
              value={layer.color}
              onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
              className="w-full border rounded p-1"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="block text-sm font-medium">Scale</label>
            <input
              type="range"
              min={0.1}
              max={4}
              step={0.01}
              value={layer.scale}
              onChange={(e) => updateLayer(layer.id, { scale: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium">Rotation</label>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={layer.rotation}
              onChange={(e) => updateLayer(layer.id, { rotation: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="block text-sm font-medium">Opacity</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={layer.opacity}
              onChange={(e) => updateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={layer.uppercase}
              onChange={(e) => updateLayer(layer.id, { uppercase: e.target.checked })}
            />
            <label className="text-sm">Uppercase</label>
          </div>
        </div>
        <button
          onClick={handleDeleteSelected}
          className="text-red-600 text-sm underline"
        >
          Delete layer
        </button>
      </div>
    );
  }

  // Render filter controls for the project. Adjusting these controls
  // immediately updates the preview image.
  function renderFilterControls() {
    if (!project) return null;
    const { filters } = project;
    const updateFilters = (update: Partial<ProjectState['filters']>) => {
      setProject((prev) => prev && { ...prev, filters: { ...prev.filters, ...update } });
    };
    return (
      <div className="p-4 border rounded bg-gray-50 mt-4 space-y-2">
        <h3 className="font-semibold">Filters</h3>
        <div>
          <label className="block text-sm">Brightness</label>
          <input
            type="range"
            min={0}
            max={200}
            value={filters.brightness}
            onChange={(e) => updateFilters({ brightness: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Contrast</label>
          <input
            type="range"
            min={0}
            max={200}
            value={filters.contrast}
            onChange={(e) => updateFilters({ contrast: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Saturation</label>
          <input
            type="range"
            min={0}
            max={200}
            value={filters.saturation}
            onChange={(e) => updateFilters({ saturation: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Hue</label>
          <input
            type="range"
            min={-180}
            max={180}
            value={filters.hue}
            onChange={(e) => updateFilters({ hue: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm">Blur</label>
          <input
            type="range"
            min={0}
            max={20}
            value={filters.blur}
            onChange={(e) => updateFilters({ blur: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center">Loading editor…</div>;
  }
  if (!project || !image) {
    return <div className="p-8 text-center">Failed to load project</div>;
  }
  return (
    <div className="max-w-screen-lg mx-auto p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Simple Editor</h1>
        <Link href="/dashboard" className="text-blue-500 underline">← Back to dashboard</Link>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col">
          <div
            ref={containerRef}
            className="relative border overflow-hidden"
            style={{ aspectRatio: `${project.baseWidth} / ${project.baseHeight}` }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Base image with filters */}
            <img
              src={project.baseAssetUrl}
              alt="Base"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: computeCssFilters(project.filters) }}
            />
            {/* Text layers */}
            {project.layers.map((layer) => {
              const isSelected = layer.id === selectedLayerId;
              return (
                <div
                  key={layer.id}
                  onPointerDown={(e) => handlePointerDown(e, layer)}
                  className={`absolute whitespace-pre select-none ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: `${(layer.x / project.baseWidth) * 100}%`,
                    top: `${(layer.y / project.baseHeight) * 100}%`,
                    transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
                    fontFamily: layer.fontFamily,
                    fontSize: `${layer.fontSize}px`,
                    color: layer.color,
                    opacity: layer.opacity,
                    textTransform: layer.uppercase ? 'uppercase' : 'none',
                    textAlign: 'center',
                  }}
                >
                  {layer.text}
                </div>
              );
            })}
          </div>
          {/* Action buttons */}
          <div className="mt-4 flex space-x-2">
            <button
              onClick={handleAddText}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Add Text
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Save
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-purple-600 text-white rounded"
            >
              Export
            </button>
          </div>
          {/* Selected layer controls */}
          {renderLayerControls()}
          {/* Filter controls */}
          {renderFilterControls()}
        </div>
        <div className="md:col-span-1">
          {/* Reserved for future additional controls such as crop presets, font upload, etc. */}
          <p className="text-sm text-gray-600">
            Use the controls to add and edit text layers. Drag layers on the
            preview to reposition them. Adjust filters to change the overall look
            of your image.
          </p>
        </div>
      </div>
    </div>
  );
}