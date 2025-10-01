// Implementation of the enhanced editor page for AI‑Album‑Gen. This page
// extends the original simple editor with a fully fledged layer system
// including text and image layers, masking, advanced typography controls,
// font uploads and comprehensive layer management.  All work is performed
// client‑side – nothing here requires server changes.  See README for
// Force rebuild to fix chunk loading error
// details.

"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { googleFonts, getFontFamily } from '@/lib/googleFonts';

/**
 * Base layer shared by both text and image layers. Every layer has a
 * persistent identifier, a human‑friendly name, a transform (position,
 * scale and rotation), opacity, visibility and locked state.  A mask can
 * optionally be attached to clip the content.
 */
export interface LayerBase {
  id: string;
  /** Friendly name shown in the layer panel. */
  name: string;
  /** The type of the layer – determines which properties apply. */
  type: 'text' | 'image';
  /** X coordinate of the layer centre in project pixels. */
  x: number;
  /** Y coordinate of the layer centre in project pixels. */
  y: number;
  /** Uniform scale factor. 1.0 = original size. */
  scale: number;
  /** Rotation in degrees. */
  rotation: number;
  /** Opacity between 0 and 1. */
  opacity: number;
  /** Whether the layer is currently visible. Hidden layers are skipped at
   * render time and shown faded in the layer panel. */
  visible: boolean;
  /** Whether the layer is locked. Locked layers cannot be moved on the
   * canvas but can still be selected via the layer list. */
  locked: boolean;
  /** Z-index for layer stacking order. Higher values appear on top. */
  zIndex: number;
  /** Optional mask stored as a data URL. When present, the layer’s content
   * is clipped against this mask. White (opaque) regions of the mask show
   * the content; black (transparent) regions hide it. */
  mask?: string;
}

/**
 * A text layer extends the base layer with textual content and rich
 * typography options.  Additional readability helpers such as drop shadows,
 * outlines, blur‑behind and auto contrast are also provided.
 */
export interface TextLayer extends LayerBase {
  type: 'text';
  /** The actual text content. Newlines are respected. */
  text: string;
  /** CSS font family. Both Google fonts and uploaded fonts are supported. */
  fontFamily: string;
  /** Font size in pixels. */
  fontSize: number;
  /** Font weight (100–900). Default 400. */
  fontWeight: number;
  /** Italic toggle. */
  italic: boolean;
  /** Text colour as a CSS hex string. */
  color: string;
  /** Convert text to uppercase when true. */
  uppercase: boolean;
  /** Additional letter spacing in pixels. Negative values condense letters. */
  letterSpacing: number;
  /** Line height multiplier. 1 = normal line height. */
  lineHeight: number;
  /** Optional text shadow. */
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  /** Optional outline. */
  outline?: {
    width: number;
    color: string;
  };
  /** Blur effect behind the text to improve legibility. */
  blurBehind?: {
    enabled: boolean;
    intensity: number; // 0-20px blur
    spread: number; // 0-50px spread around text
    fade: number; // 0-100% fade intensity
  } | undefined;
  /** When enabled the colour is automatically adjusted to maximise contrast
   * with the underlying image. */
  autoContrast: boolean;
}

/**
 * An image layer displays a bitmap on top of the base asset. Users can
 * upload arbitrary images or duplicate the base asset to create collage
 * effects. Masking is fully supported.
 */
export interface ImageLayer extends LayerBase {
  type: 'image';
  /** Data URL or absolute URL to the image. */
  src: string;
}

/** Union of all supported layer types. */
export type Layer = TextLayer | ImageLayer;

/**
 * Project state persisted in the database. Fields that were present in
 * earlier versions of the editor (baseAssetUrl, crop, filters, etc.)
 * remain untouched for backwards compatibility. New fields are appended
 * with sensible defaults when loading legacy projects.
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
  layers: Layer[];
}

/**
 * Convert filters into a CSS filter string for preview purposes. Not all
 * filters can be expressed in CSS (vignette and grain require canvas
 * compositing) so they are omitted here and handled separately in the UI.
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
 * Determine a legible text colour (black or white) by sampling the underlying
 * base image at the layer centre. This function is used to provide the
 * auto contrast feature. It returns the original colour if the image has
 * not yet loaded or sampling fails.
 */
function pickAutoContrastColor(
  img: HTMLImageElement | null,
  layer: TextLayer,
  project: ProjectState,
): string {
  try {
    if (!img) return layer.color;
    const off = document.createElement('canvas');
    off.width = project.baseWidth;
    off.height = project.baseHeight;
    const ctx = off.getContext('2d');
    if (!ctx) return layer.color;
    // draw the base image only once
    ctx.drawImage(img, 0, 0);
    const x = Math.floor(layer.x);
    const y = Math.floor(layer.y);
    const size = 40; // sample a square around the centre
    const sx = Math.max(0, x - size / 2);
    const sy = Math.max(0, y - size / 2);
    const sw = Math.min(project.baseWidth - sx, size);
    const sh = Math.min(project.baseHeight - sy, size);
    const data = ctx.getImageData(sx, sy, sw, sh).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      // luminance approximation
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      sum += 0.299 * r + 0.587 * g + 0.114 * b;
    }
    const avg = sum / (data.length / 4);
    // return white on dark backgrounds and black on light
    return avg < 128 ? '#ffffff' : '#000000';
  } catch {
    return layer.color;
  }
}

/** Helper to create a new text layer at the centre of the project. */
function createDefaultTextLayer(project: ProjectState): TextLayer {
  const id = Math.random().toString(36).substring(2, 9);
  return {
    id,
    name: `Text ${project.layers.filter((l) => l.type === 'text').length + 1}`,
    type: 'text',
    text: 'New Text',
    fontFamily: 'sans-serif',
    fontSize: 32,
    fontWeight: 400,
    italic: false,
    color: '#ffffff',
    uppercase: false,
    letterSpacing: 0,
    lineHeight: 1.2,
    shadow: undefined,
    outline: undefined,
    blurBehind: undefined,
    autoContrast: false,
    x: project.baseWidth / 2,
    y: project.baseHeight / 2,
    scale: 1,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 1,
  };
}

/** Helper to create a new image layer. Accepts a data URL or absolute URL. */
function createImageLayer(project: ProjectState, src: string): ImageLayer {
  const id = Math.random().toString(36).substring(2, 9);
  return {
    id,
    name: `Image ${project.layers.filter((l) => l.type === 'image').length + 1}`,
    type: 'image',
    src,
    x: project.baseWidth / 2,
    y: project.baseHeight / 2,
    scale: 1,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 1,
  };
}

/**
 * Apply vignette and grain to a finished canvas. Both effects are drawn on
 * top of existing content using radial gradients and noise textures. The
 * intensity ranges from 0 to 100.
 */
function applyVignetteAndGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  vignette: number,
  grain: number,
) {
  // vignette: draw a radial gradient from transparent in the centre to
  // semi‑transparent black at the edges. 0 means no effect; 100 is fully
  // opaque black at the edges.
  if (vignette > 0) {
    const g = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) / 2,
    );
    const alpha = vignette / 100;
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${alpha})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
  // grain: overlay random monochrome noise with adjustable opacity. The
  // strength parameter controls the opacity of the grain rather than the
  // brightness of individual pixels.
  if (grain > 0) {
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = width;
    noiseCanvas.height = height;
    const nctx = noiseCanvas.getContext('2d')!;
    const imageData = nctx.createImageData(width, height);
    const opacity = (grain / 100) * 0.3; // max 0.3 opacity
    for (let i = 0; i < imageData.data.length; i += 4) {
      const value = Math.random() * 255;
      imageData.data[i] = value;
      imageData.data[i + 1] = value;
      imageData.data[i + 2] = value;
      imageData.data[i + 3] = opacity * 255;
    }
    nctx.putImageData(imageData, 0, 0);
    ctx.drawImage(noiseCanvas, 0, 0);
  }
}

/**
 * Draw text with optional letter spacing and outline. Canvas does not
 * support letterSpacing natively so characters are rendered one by one.
 * Outline is drawn underneath the fill by stroking each character before
 * filling it.
 */
function drawTextLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fillColor: string,
  outline: TextLayer['outline'],
  letterSpacing: number,
) {
  if (!text) return;
  let currentX = x;
  for (const char of text) {
    if (outline) {
      ctx.strokeStyle = outline.color;
      ctx.lineWidth = outline.width;
      ctx.strokeText(char, currentX, y);
    }
    ctx.fillStyle = fillColor;
    ctx.fillText(char, currentX, y);
    const metrics = ctx.measureText(char);
    currentX += metrics.width + letterSpacing;
  }
}

/**
 * The main editor page. It loads an existing project or creates a new one
 * for a generation. Users can add text or image layers, reorder and rename
 * them, adjust filters, draw masks, upload fonts and export the final
 * artwork. All actions happen client‑side.
 */
export default function EditorPage({ params }: { params: { generationId: string } }) {
  const router = useRouter();
  const generationId = params.generationId;
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectState | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [customFonts, setCustomFonts] = useState<{ name: string; family: string; category: string }[]>([]);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  // Drag info for moving layers
  const containerRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{ layerId: string; offsetX: number; offsetY: number } | null>(null);
  // Mask editing state
  const [maskEditingLayerId, setMaskEditingLayerId] = useState<string | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [maskMode, setMaskMode] = useState<'erase' | 'restore'>('erase');
  const [maskBrushSize, setMaskBrushSize] = useState<number>(40);

  // Load generation and project on mount. Unchanged from original except
  // conversion of legacy layers and filter defaults.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // 1. Haal de gegenereerde afbeelding op
        const genRes = await fetch(`/api/generation/${generationId}`);
        if (!genRes.ok) throw new Error('Failed to load generation');
        const generation = await genRes.json();

        // 2. Haal het bestaande project op, of creëer een nieuw project
        let proj: ProjectState | null = null;
        const projRes = await fetch(`/api/projects/${generationId}`);
        if (projRes.ok) {
          const json = await projRes.json();
          proj = json.project;
        }
        if (!proj) {
          // Geen project gevonden: maak een nieuw project
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = generation.imageUrl;
          await img.decode();
          proj = {
            id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`,
            baseAssetUrl: generation.imageUrl,
            baseWidth: img.naturalWidth,
            baseHeight: img.naturalHeight,
            crop: { aspect: '1:1', x: 0, y: 0, scale: 1 },
            filters: { brightness: 100, contrast: 100, saturation: 100, hue: 0, vignette: 0, grain: 0, blur: 0 },
            layers: [],
          };
          const newProjRes = await fetch('/api/projects/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ generationId, project: proj }),
          });
          
          if (!newProjRes.ok) {
            const errorData = await newProjRes.json();
            console.error('Project creation failed:', errorData);
            throw new Error(`Failed to create project: ${errorData.error || 'Unknown error'}`);
          }
          
          const responseData = await newProjRes.json();
          console.log('Project creation response:', responseData);
          
          if (!responseData.success) {
            throw new Error('Project creation returned success: false');
          }
          
          proj = responseData.project;
        }

        // 3. Vanaf hier weet je zeker dat proj niet null is
        if (!proj) {
          throw new Error('Project is null after creation attempt');
        }
        const resolvedProj: ProjectState = proj;

        // Laad de basisafbeelding van resolvedProj
        const baseImg = new Image();
        baseImg.crossOrigin = 'anonymous';
        baseImg.src = resolvedProj.baseAssetUrl;
        await baseImg.decode();

        if (!cancelled) {
          setProject(resolvedProj);
          setImage(baseImg);
        }
      } catch (err) {
        console.error('Editor loading error:', err);
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          alert(`Failed to load project: ${errorMessage}`);
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

  // Helper to update a layer
  function updateLayer(id: string, update: Partial<Layer>) {
    setProject((prev) => {
      if (!prev) return prev;
      const newLayers = prev.layers.map((layer) =>
        layer.id === id ? { ...layer, ...update } as Layer : layer,
      );
      return { ...prev, layers: newLayers };
    });
  }

  // Add new layers
  function handleAddText() {
    if (!project) return;
    const newLayer = createDefaultTextLayer(project);
    setProject({ ...project, layers: [...project.layers, newLayer] });
    setSelectedLayerId(newLayer.id);
  }
  function handleAddImage() {
    if (!project) return;
    // Use the base image as the default new image; in practice you'd
    // implement an upload input here
    const src = project.baseAssetUrl;
    const newLayer = createImageLayer(project, src);
    setProject({ ...project, layers: [...project.layers, newLayer] });
    setSelectedLayerId(newLayer.id);
  }

  // Delete selected layer
  function handleDeleteSelected() {
    if (!project || !selectedLayerId) return;
    setProject({
      ...project,
      layers: project.layers.filter((l) => l.id !== selectedLayerId),
    });
    setSelectedLayerId(null);
  }

  // Persist project
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

  // Export project to ZIP with images, overlay.svg and project.json
  async function handleExport() {
    if (!project || !image) return;
    const currentProject = project; // Capture project to avoid null issues in nested function
    const currentImage = image; // Capture image to avoid null issues in nested function
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    async function renderToBlob(size: number, mime: 'image/png' | 'image/jpeg', quality?: number) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.filter = computeCssFilters(currentProject.filters);
      ctx.drawImage(currentImage, 0, 0, size, size);
      ctx.filter = 'none';
      for (const layer of currentProject.layers) {
        if (!layer.visible) continue;
        ctx.save();
        const scaleX = size / currentProject.baseWidth;
        const scaleY = size / currentProject.baseHeight;
        const x = layer.x * scaleX;
        const y = layer.y * scaleY;
        ctx.translate(x, y);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.scale(layer.scale * scaleX, layer.scale * scaleY);
        ctx.globalAlpha = layer.opacity;

        // Apply mask if present
        if (layer.mask) {
          const maskImg = new Image();
          maskImg.src = layer.mask;
          await maskImg.decode();
          ctx.save();
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = maskImg.width;
          maskCanvas.height = maskImg.height;
          const mCtx = maskCanvas.getContext('2d')!;
          mCtx.drawImage(maskImg, 0, 0);
          const maskPattern = ctx.createPattern(maskCanvas, 'no-repeat')!;
          ctx.globalCompositeOperation = 'destination-in';
          ctx.fillStyle = maskPattern;
          ctx.fillRect(-currentProject.baseWidth / 2, -currentProject.baseHeight / 2, currentProject.baseWidth, currentProject.baseHeight);
          ctx.globalCompositeOperation = 'source-over';
        }

        if (layer.type === 'image') {
          const imgLayer = layer as ImageLayer;
          const imgObj = new Image();
          imgObj.src = imgLayer.src;
          await imgObj.decode();
          ctx.drawImage(imgObj, -imgObj.width / 2, -imgObj.height / 2);
        } else {
          const textLayer = layer as TextLayer;
          // Determine fill colour with auto contrast
          const fillColor = textLayer.autoContrast ? pickAutoContrastColor(currentImage, textLayer, currentProject) : textLayer.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
          ctx.font = `${textLayer.italic ? 'italic ' : ''}${textLayer.fontWeight} ${textLayer.fontSize}px ${textLayer.fontFamily}`;
          // Blur behind: draw blurred backdrop before text
          if (textLayer.blurBehind?.enabled) {
            ctx.save();
            ctx.filter = `blur(${textLayer.blurBehind.intensity}px)`;
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(-size, -size, size * 2, size * 2);
            ctx.restore();
          }
          // Split text into lines
          const lines = textLayer.text.split('\n');
          const totalHeight = lines.length * textLayer.fontSize * textLayer.lineHeight;
          let startY = -totalHeight / 2 + (textLayer.fontSize * textLayer.lineHeight) / 2;
          for (const line of lines) {
            const content = textLayer.uppercase ? line.toUpperCase() : line;
            if (textLayer.outline) {
              ctx.lineJoin = 'round';
              ctx.lineWidth = textLayer.outline.width;
              ctx.strokeStyle = textLayer.outline.color;
              drawTextLine(ctx, content, 0, startY, fillColor, textLayer.outline, textLayer.letterSpacing);
            }
            ctx.fillStyle = fillColor;
            drawTextLine(ctx, content, 0, startY, fillColor, undefined, textLayer.letterSpacing);
            startY += textLayer.fontSize * textLayer.lineHeight;
          }
          if (textLayer.shadow) {
            ctx.save();
            ctx.shadowOffsetX = textLayer.shadow.offsetX;
            ctx.shadowOffsetY = textLayer.shadow.offsetY;
            ctx.shadowBlur = textLayer.shadow.blur;
            ctx.shadowColor = textLayer.shadow.color;
            // teken de tekst nogmaals (alleen vulkleur, zonder outline) om de schaduw te genereren
            const lines = textLayer.text.split('\n');
            let yPos = -totalHeight / 2 + (textLayer.fontSize * textLayer.lineHeight) / 2;
            for (const line of lines) {
              const content = textLayer.uppercase ? line.toUpperCase() : line;
              drawTextLine(ctx, content, 0, yPos, fillColor, undefined, textLayer.letterSpacing);
              yPos += textLayer.fontSize * textLayer.lineHeight;
            }
            ctx.restore();
          }
        }
        ctx.restore();
      }
      // After drawing all layers, apply vignette and grain
      applyVignetteAndGrain(ctx, size, size, currentProject.filters.vignette, currentProject.filters.grain);
      return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) throw new Error('Failed to render');
          resolve(blob);
        }, mime, quality);
      });
    }
    const cover3000 = await renderToBlob(3000, 'image/png');
    const cover1400 = await renderToBlob(1400, 'image/jpeg', 0.92);
    const thumb600 = await renderToBlob(600, 'image/jpeg', 0.8);
    // overlay.svg
    const { createOverlaySvg } = await import('@/lib/exportHelpers');
    const overlaySvg = createOverlaySvg(currentProject);
    zip.file('cover_3000.png', await cover3000.arrayBuffer());
    zip.file('cover_1400.jpg', await cover1400.arrayBuffer());
    zip.file('thumb_600.jpg', await thumb600.arrayBuffer());
    zip.file('overlay.svg', overlaySvg);
    zip.file('project.json', JSON.stringify(currentProject, null, 2));
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-${currentProject.id}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Layer panel helpers
  function moveLayer(id: string, delta: number) {
    setProject((prev) => {
      if (!prev) return prev;
      const idx = prev.layers.findIndex((l) => l.id === id);
      if (idx < 0) return prev;
      const newIdx = Math.min(Math.max(0, idx + delta), prev.layers.length - 1);
      const newLayers = [...prev.layers];
      const [item] = newLayers.splice(idx, 1);
      newLayers.splice(newIdx, 0, item);
      return { ...prev, layers: newLayers };
    });
  }

  // Mask editing: start, erase/restore, finish
  function startMaskEditing(layerId: string) {
    setMaskEditingLayerId(layerId);
    setTimeout(() => {
      const canvas = maskCanvasRef.current;
      if (!canvas || !project) return;
      
      // Set canvas dimensions to match project dimensions for 1:1 correspondence
      canvas.width = project.baseWidth;
      canvas.height = project.baseHeight;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Start with transparent canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const layer = project.layers.find((l) => l.id === layerId) as Layer | undefined;
      if (layer?.mask) {
        const img = new Image();
        img.src = layer.mask;
        img.onload = () => {
          // Draw existing mask at full resolution
          ctx.drawImage(img, 0, 0);
          maskCtxRef.current = ctx;
        };
      } else {
        maskCtxRef.current = ctx;
      }
    }, 0);
  }
  function finishMaskEditing() {
    if (!maskEditingLayerId) return;
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    
    // Canvas already has correct dimensions, just save the mask
    const dataUrl = canvas.toDataURL('image/png');
    
    console.log('Saving mask for layer:', maskEditingLayerId);
    console.log('Mask data URL length:', dataUrl.length);
    
    updateLayer(maskEditingLayerId, { mask: dataUrl });
    setMaskEditingLayerId(null);
  }
  function handleMaskDraw(e: React.PointerEvent) {
    if (!maskEditingLayerId) return;
    const canvas = maskCanvasRef.current;
    const ctx = maskCtxRef.current;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!canvas || !ctx || !containerRect || !project) return;
    
    // Only draw on pointer down or when dragging
    if (e.type === 'pointermove' && e.buttons === 0) return;
    
    // Map container coordinates to canvas coordinates (1:1 correspondence)
    const x = ((e.clientX - containerRect.left) * project.baseWidth) / containerRect.width;
    const y = ((e.clientY - containerRect.top) * project.baseHeight) / containerRect.height;
    
    // Draw black or white on the mask canvas
    ctx.fillStyle = maskMode === 'erase' ? 'black' : 'white';
    ctx.globalCompositeOperation = 'source-over';
    
    const radius = maskBrushSize / 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Save mask in real-time
    updateLayer(maskEditingLayerId, { mask: canvas.toDataURL('image/png') });
  }
  function resetMask() {
    const ctx = maskCtxRef.current;
    const canvas = maskCanvasRef.current;
    if (!ctx || !canvas || !maskEditingLayerId) return;
    
    // Clear canvas (transparent = fully visible)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update mask in real-time after reset
    updateLayer(maskEditingLayerId, { mask: canvas.toDataURL('image/png') });
  }
  function invertMask() {
    const ctx = maskCtxRef.current;
    const canvas = maskCanvasRef.current;
    if (!ctx || !canvas || !maskEditingLayerId) return;
    
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < data.data.length; i += 4) {
      // Invert only RGB channels, keep alpha unchanged
      data.data[i] = 255 - data.data[i];     // Red
      data.data[i + 1] = 255 - data.data[i + 1]; // Green
      data.data[i + 2] = 255 - data.data[i + 2]; // Blue
      // data.data[i + 3] remains unchanged (alpha)
    }
    ctx.putImageData(data, 0, 0);
    
    // Update mask in real-time after inversion
    updateLayer(maskEditingLayerId, { mask: canvas.toDataURL('image/png') });
  }


  // UI rendering helpers for layer controls, filters, mask controls, etc.
  function renderLayerControls() {
    if (!project || !selectedLayerId) return null;
    const layer = project.layers.find((l) => l.id === selectedLayerId);
    if (!layer) return null;
    if (layer.type === 'text') {
      const tl = layer as TextLayer;
    return (
      <div className="p-4 border rounded bg-gray-50 mt-4 space-y-2">
        <div>
          <label className="block text-sm font-medium">Text</label>
          <textarea
              value={tl.text}
              onChange={(e) => updateLayer(tl.id, { text: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>
          <div>
            <label className="block text-sm font-medium">Font Family</label>
            <select
              value={tl.fontFamily}
              onChange={(e) => updateLayer(tl.id, { fontFamily: e.target.value })}
              className="w-full border rounded p-2"
              style={{ fontFamily: getFontFamily(tl.fontFamily) }}
            >
              {googleFonts.concat(customFonts).map((font) => (
                <option key={font.name} value={font.family} style={{ fontFamily: font.family }}>
                  {font.name}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept=".woff2"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const fontName = file.name.replace(/\.[^/.]+$/, '');
                  const fontFamily = `"${fontName}"`;
                  const fontData = reader.result as string;
                  const style = document.createElement('style');
                  style.innerHTML = `
                    @font-face {
                      font-family: ${fontFamily};
                      src: url(${fontData}) format('woff2');
                    }
                  `;
                  document.head.appendChild(style);
                  setCustomFonts([...customFonts, { name: fontName, family: fontFamily, category: 'Custom' }]);
                  updateLayer(tl.id, { fontFamily: fontFamily });
                };
                reader.readAsDataURL(file);
              }}
              className="mt-2"
            />
          </div>
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="block text-sm font-medium">Font size</label>
            <input
              type="number"
              min={8}
              max={200}
                value={tl.fontSize}
                onChange={(e) => updateLayer(tl.id, { fontSize: parseInt(e.target.value) })}
                className="w-full border rounded p-1"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Weight</label>
              <input
                type="number"
                min={100}
                max={900}
                step={100}
                value={tl.fontWeight}
                onChange={(e) => updateLayer(tl.id, { fontWeight: parseInt(e.target.value) })}
              className="w-full border rounded p-1"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium">Color</label>
            <input
              type="color"
                value={tl.color}
                onChange={(e) => updateLayer(tl.id, { color: e.target.value })}
              className="w-full border rounded p-1"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="flex-1">
              <label className="block text-sm font-medium">Letter spacing</label>
            <input
                type="number"
                min={-5}
                max={20}
                step={0.1}
                value={tl.letterSpacing}
                onChange={(e) => updateLayer(tl.id, { letterSpacing: parseFloat(e.target.value) })}
                className="w-full border rounded p-1"
            />
          </div>
          <div className="flex-1">
              <label className="block text-sm font-medium">Line height</label>
            <input
                type="number"
                min={0.5}
                max={3}
                step={0.1}
                value={tl.lineHeight}
                onChange={(e) => updateLayer(tl.id, { lineHeight: parseFloat(e.target.value) })}
                className="w-full border rounded p-1"
            />
          </div>
        </div>
          <div className="flex space-x-2 items-center">
            <input
              type="checkbox"
              checked={tl.italic}
              onChange={(e) => updateLayer(tl.id, { italic: e.target.checked })}
            />
            <label className="text-sm">Italic</label>
            <input
              type="checkbox"
              checked={tl.uppercase}
              onChange={(e) => updateLayer(tl.id, { uppercase: e.target.checked })}
              className="ml-4"
            />
            <label className="text-sm">Uppercase</label>
            <input
              type="checkbox"
              checked={tl.autoContrast}
              onChange={(e) => updateLayer(tl.id, { autoContrast: e.target.checked })}
              className="ml-4"
            />
            <label className="text-sm">Auto contrast</label>
          </div>
          <div className="flex space-x-2 items-center">
            <input
              type="checkbox"
              checked={!!tl.shadow}
              onChange={(e) => {
                if (e.target.checked) {
                  updateLayer(tl.id, {
                    shadow: {
                      offsetX: 2,
                      offsetY: 2,
                      blur: 4,
                      color: '#000000',
                    },
                  });
                } else {
                  updateLayer(tl.id, { shadow: undefined });
                }
              }}
            />
            <label className="text-sm">Shadow</label>
            <input
              type="checkbox"
              checked={!!tl.outline}
              onChange={(e) => {
                if (e.target.checked) {
                  updateLayer(tl.id, {
                    outline: {
                      width: 2,
                      color: '#000000',
                    },
                  });
                } else {
                  updateLayer(tl.id, { outline: undefined });
                }
              }}
              className="ml-4"
            />
            <label className="text-sm">Outline</label>
            <input
              type="checkbox"
              checked={!!tl.blurBehind?.enabled}
              onChange={(e) => {
                if (e.target.checked) {
                  updateLayer(tl.id, {
                    blurBehind: {
                      enabled: true,
                      intensity: 8,
                      spread: 20,
                      fade: 30,
                    },
                  });
                } else {
                  updateLayer(tl.id, { blurBehind: undefined });
                }
              }}
              className="ml-4"
            />
            <label className="text-sm">Blur behind</label>
        </div>
        
        {/* Blur behind controls */}
        {tl.blurBehind?.enabled && (
          <div className="mt-2 p-2 bg-gray-100 rounded space-y-2">
            <div>
              <label className="block text-sm font-medium">Blur Intensity</label>
              <input
                type="range"
                min="1"
                max="20"
                value={tl.blurBehind.intensity}
                onChange={(e) => updateLayer(tl.id, { 
                  blurBehind: tl.blurBehind ? { ...tl.blurBehind, intensity: parseInt(e.target.value) } : undefined
                })}
                className="w-full"
              />
              <span className="text-xs text-gray-600">{tl.blurBehind.intensity}px</span>
            </div>
            <div>
              <label className="block text-sm font-medium">Spread</label>
              <input
                type="range"
                min="5"
                max="50"
                value={tl.blurBehind.spread}
                onChange={(e) => updateLayer(tl.id, { 
                  blurBehind: tl.blurBehind ? { ...tl.blurBehind, spread: parseInt(e.target.value) } : undefined
                })}
                className="w-full"
              />
              <span className="text-xs text-gray-600">{tl.blurBehind.spread}px</span>
            </div>
            <div>
              <label className="block text-sm font-medium">Fade</label>
              <input
                type="range"
                min="0"
                max="100"
                value={tl.blurBehind.fade}
                onChange={(e) => updateLayer(tl.id, { 
                  blurBehind: tl.blurBehind ? { ...tl.blurBehind, fade: parseInt(e.target.value) } : undefined
                })}
                className="w-full"
              />
              <span className="text-xs text-gray-600">{tl.blurBehind.fade}%</span>
            </div>
          </div>
        )}
        
        {/* Outline controls */}
        {tl.outline && (
          <div className="mt-2 p-2 bg-gray-100 rounded space-y-2">
            <div>
              <label className="block text-sm font-medium">Outline Width</label>
              <input
                type="range"
                min="1"
                max="10"
                value={tl.outline.width}
                onChange={(e) => updateLayer(tl.id, { 
                  outline: tl.outline ? { ...tl.outline, width: parseInt(e.target.value) } : undefined
                })}
                className="w-full"
              />
              <span className="text-xs text-gray-600">{tl.outline.width}px</span>
            </div>
            <div>
              <label className="block text-sm font-medium">Outline Color</label>
              <input
                type="color"
                value={tl.outline.color}
                onChange={(e) => updateLayer(tl.id, { 
                  outline: tl.outline ? { ...tl.outline, color: e.target.value } : undefined
                })}
                className="w-full h-8 border rounded"
              />
            </div>
          </div>
        )}
        
        {/* Shadow controls */}
        {tl.shadow && (
          <div className="mt-2 p-2 bg-gray-100 rounded space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium">Offset X</label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={tl.shadow.offsetX}
                  onChange={(e) => updateLayer(tl.id, { 
                    shadow: tl.shadow ? { ...tl.shadow, offsetX: parseInt(e.target.value) } : undefined
                  })}
                  className="w-full"
                />
                <span className="text-xs text-gray-600">{tl.shadow.offsetX}px</span>
              </div>
              <div>
                <label className="block text-sm font-medium">Offset Y</label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  value={tl.shadow.offsetY}
                  onChange={(e) => updateLayer(tl.id, { 
                    shadow: tl.shadow ? { ...tl.shadow, offsetY: parseInt(e.target.value) } : undefined
                  })}
                  className="w-full"
                />
                <span className="text-xs text-gray-600">{tl.shadow.offsetY}px</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Blur</label>
              <input
                type="range"
                min="0"
                max="20"
                value={tl.shadow.blur}
                onChange={(e) => updateLayer(tl.id, { 
                  shadow: tl.shadow ? { ...tl.shadow, blur: parseInt(e.target.value) } : undefined
                })}
                className="w-full"
              />
              <span className="text-xs text-gray-600">{tl.shadow.blur}px</span>
            </div>
            <div>
              <label className="block text-sm font-medium">Shadow Color</label>
              <input
                type="color"
                value={tl.shadow.color}
                onChange={(e) => updateLayer(tl.id, { 
                  shadow: tl.shadow ? { ...tl.shadow, color: e.target.value } : undefined
                })}
                className="w-full h-8 border rounded"
              />
            </div>
          </div>
        )}
        
          <button onClick={handleDeleteSelected} className="text-red-600 text-sm underline">
            Delete layer
          </button>
        </div>
      );
    } else {
      return (
        <div className="p-4 border rounded bg-gray-50 mt-4 space-y-2">
          <p>Image layer: position, scale, rotation and masking can be edited from the layer panel.</p>
          <button onClick={handleDeleteSelected} className="text-red-600 text-sm underline">
          Delete layer
        </button>
      </div>
    );
    }
  }

  function renderFilterControls() {
    if (!project) return null;
    const { filters } = project;
    const updateFilters = (update: Partial<ProjectState['filters']>) => {
      setProject((prev) => prev && { ...prev, filters: { ...prev.filters, ...update } });
    };
    return (
      <div className="p-4 border rounded bg-gray-50 mt-4 space-y-2">
        <h3 className="font-semibold">Filters</h3>
        {[
          { label: 'Brightness', key: 'brightness', min: 0, max: 200 },
          { label: 'Contrast', key: 'contrast', min: 0, max: 200 },
          { label: 'Saturation', key: 'saturation', min: 0, max: 200 },
          { label: 'Hue', key: 'hue', min: -180, max: 180 },
          { label: 'Blur', key: 'blur', min: 0, max: 20 },
          { label: 'Vignette', key: 'vignette', min: 0, max: 100 },
          { label: 'Grain', key: 'grain', min: 0, max: 100 },
        ].map(({ label, key, min, max }) => (
          <div key={key}>
            <label className="block text-sm">{label}</label>
          <input
            type="range"
              min={min}
              max={max}
              value={(filters as any)[key]}
              onChange={(e) => updateFilters({ [key]: parseInt(e.target.value) } as any)}
            className="w-full"
          />
        </div>
        ))}
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center">Loading editor…</div>;
  }
  if (!project || !image) {
    return <div className="p-8 text-center">Failed to load project</div>;
  }

  // Render component
  return (
    <div className="max-w-screen-lg mx-auto p-4">
      {/* Load all Google Fonts at once for preview; could be optimised */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Nunito:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Lora:wght@400;700&family=Crimson+Text:wght@400;600&family=Libre+Baskerville:wght@400;700&family=Oswald:wght@400;500;600;700&family=Bebas+Neue&family=Anton&family=Righteous&family=Fredoka+One&family=Dancing+Script:wght@400;700&family=Pacifico&family=Caveat:wght@400;700&family=Kalam:wght@400;700&family=Comfortaa:wght@400;700&family=Fira+Code:wght@400;500&family=Source+Code+Pro:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Enhanced Editor</h1>
        <Link href="/dashboard" className="text-blue-500 underline">
          ← Back to dashboard
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col">
          <div
            ref={containerRef}
            className="relative border overflow-hidden"
            style={{ aspectRatio: `${project.baseWidth} / ${project.baseHeight}` }}
            onPointerMove={handleMaskDraw}
            onPointerUp={() => {
              dragInfo.current = null;
            }}
          >
            {/* Base image with filters */}
            <img
              src={project.baseAssetUrl}
              alt="Base"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: computeCssFilters(project.filters) }}
            />
            {/* Image & text layers */}
            {project.layers.map((layer) => {
              if (!layer.visible) return null;
              const isSelected = layer.id === selectedLayerId;
              const style = {
                left: `${(layer.x / project.baseWidth) * 100}%`,
                top: `${(layer.y / project.baseHeight) * 100}%`,
                transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
                opacity: layer.opacity,
                zIndex: layer.zIndex,
                position: 'absolute' as const,
                pointerEvents: isSelected ? 'auto' : 'none',
              };
              if (layer.type === 'text') {
                const tl = layer as TextLayer;
                return (
                <div
                  key={layer.id}
                    onPointerDown={(e) => {
                      if (tl.locked) return;
                      setSelectedLayerId(layer.id);
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      const offsetX = e.clientX - rect.left - rect.width / 2;
                      const offsetY = e.clientY - rect.top - rect.height / 2;
                      dragInfo.current = { layerId: layer.id, offsetX, offsetY };
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      if (!dragInfo.current || dragInfo.current.layerId !== layer.id || tl.locked) return;
                      const containerRect = containerRef.current?.getBoundingClientRect();
                      if (!containerRect) return;
                      const scaleX = project.baseWidth / containerRect.width;
                      const scaleY = project.baseHeight / containerRect.height;
                      const x = (e.clientX - containerRect.left - dragInfo.current.offsetX) * scaleX;
                      const y = (e.clientY - containerRect.top - dragInfo.current.offsetY) * scaleY;
                      updateLayer(layer.id, { x, y });
                    }}
                  className={`absolute whitespace-pre select-none ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                      // bestaande stijl:
                      ...style,
                      fontFamily: tl.fontFamily,
                      fontSize: `${tl.fontSize}px`,
                      fontWeight: tl.fontWeight,
                      fontStyle: tl.italic ? 'italic' : 'normal',
                      color: tl.autoContrast ? pickAutoContrastColor(image, tl, project) : tl.color,
                      textTransform: tl.uppercase ? 'uppercase' : 'none',
                    textAlign: 'center',
                      letterSpacing: `${tl.letterSpacing}px`,
                      lineHeight: tl.lineHeight,
                      // nieuwe eigenschappen:
                      textShadow: tl.shadow
                        ? `${tl.shadow.offsetX}px ${tl.shadow.offsetY}px ${tl.shadow.blur}px ${tl.shadow.color}`
                        : undefined,
                      WebkitTextStrokeWidth: tl.outline ? `${tl.outline.width}px` : undefined,
                      WebkitTextStrokeColor: tl.outline ? tl.outline.color : undefined,
                      // Improved blur behind with gradient mask
                      ...(tl.blurBehind?.enabled && {
                        backdropFilter: `blur(${tl.blurBehind.intensity}px)`,
                        WebkitBackdropFilter: `blur(${tl.blurBehind.intensity}px)`,
                        // Create a gradient mask for smooth fade
                        mask: `radial-gradient(ellipse ${tl.blurBehind.spread}px ${tl.blurBehind.spread}px at center, black ${100 - tl.blurBehind.fade}%, transparent 100%)`,
                        WebkitMask: `radial-gradient(ellipse ${tl.blurBehind.spread}px ${tl.blurBehind.spread}px at center, black ${100 - tl.blurBehind.fade}%, transparent 100%)`,
                        // Add padding to extend the blur area
                        padding: `${tl.blurBehind.spread}px`,
                        margin: `-${tl.blurBehind.spread}px`,
                      }),
                      // CSS mask for text masking
                      maskImage: tl.mask ? `url(${tl.mask})` : undefined,
                      WebkitMaskImage: tl.mask ? `url(${tl.mask})` : undefined,
                      maskSize: '100% 100%',
                      WebkitMaskSize: '100% 100%',
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                    }}
                  >
                    {tl.text}
                </div>
              );
              } else {
                const il = layer as ImageLayer;
                return (
                  <img
                    key={il.id}
                    src={il.src}
                    className={`absolute select-none ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                    style={style}
                    onPointerDown={(e) => {
                      if (il.locked) return;
                      setSelectedLayerId(il.id);
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      const offsetX = e.clientX - rect.left - rect.width / 2;
                      const offsetY = e.clientY - rect.top - rect.height / 2;
                      dragInfo.current = { layerId: il.id, offsetX, offsetY };
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      if (!dragInfo.current || dragInfo.current.layerId !== il.id || il.locked) return;
                      const containerRect = containerRef.current?.getBoundingClientRect();
                      if (!containerRect) return;
                      const scaleX = project.baseWidth / containerRect.width;
                      const scaleY = project.baseHeight / containerRect.height;
                      const x = (e.clientX - containerRect.left - dragInfo.current.offsetX) * scaleX;
                      const y = (e.clientY - containerRect.top - dragInfo.current.offsetY) * scaleY;
                      updateLayer(il.id, { x, y });
                    }}
                  />
                );
              }
            })}
            {/* Mask editing overlay */}
            {maskEditingLayerId && (
              <div className="absolute inset-0 z-10">
                {/* Show current mask as overlay */}
                <div 
                  className="absolute inset-0 bg-red-500 bg-opacity-20"
                  style={{
                    background: 'linear-gradient(45deg, rgba(255,0,0,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,0,0,0.1) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,0,0,0.1) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,0,0,0.1) 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                  }}
                />
                {/* Drawing canvas */}
                <canvas
                  ref={maskCanvasRef}
                  className="absolute inset-0 touch-none cursor-crosshair"
                  style={{ 
                    background: 'transparent',
                    pointerEvents: 'auto'
                  }}
                  onPointerDown={handleMaskDraw}
                  onPointerMove={handleMaskDraw}
                />
                {/* Instructions */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-sm">
                  <div>Mask Mode: {maskMode === 'erase' ? 'Verbergen (zwart)' : 'Tonen (wit)'}</div>
                  <div>Brush Size: {maskBrushSize}px</div>
                  <div>Zwart = verborgen, Wit = zichtbaar</div>
                </div>
              </div>
            )}
          </div>
          {/* Action buttons */}
          <div className="mt-4 flex space-x-2">
            <button onClick={handleAddText} className="px-3 py-1 bg-blue-600 text-white rounded">
              Add Text
            </button>
            <button onClick={handleAddImage} className="px-3 py-1 bg-blue-600 text-white rounded">
              Add Image
            </button>
            <button onClick={handleSave} className="px-3 py-1 bg-green-600 text-white rounded">
              Save
            </button>
            <button onClick={handleExport} className="px-3 py-1 bg-purple-600 text-white rounded">
              Export
            </button>
          </div>
          {/* Selected layer controls */}
          {renderLayerControls()}
          {/* Filter controls */}
          {renderFilterControls()}
          {/* Mask controls if editing */}
          {maskEditingLayerId && (
            <div className="p-4 border rounded bg-gray-50 mt-4 space-y-2">
              <h3 className="font-semibold">Masking</h3>
              <p className="text-sm text-gray-600">
                Zwart = verborgen, Wit = zichtbaar. Sleep om te maskeren.
              </p>
              <p className="text-xs text-gray-500">
                Masking layer: {maskEditingLayerId}
              </p>
              <div className="flex items-center space-x-2">
                <label>Mode</label>
                <select value={maskMode} onChange={(e) => setMaskMode(e.target.value as any)}>
                  <option value="erase">Verbergen (zwart)</option>
                  <option value="restore">Tonen (wit)</option>
                </select>
                <label>Brush size</label>
                <input
                  type="range"
                  min={5}
                  max={200}
                  value={maskBrushSize}
                  onChange={(e) => setMaskBrushSize(parseInt(e.target.value))}
                />
                <span className="text-sm">{maskBrushSize}px</span>
              </div>
              <div className="flex space-x-2">
                <button onClick={resetMask} className="px-2 py-1 bg-gray-200 rounded">
                  Reset
                </button>
                <button onClick={invertMask} className="px-2 py-1 bg-gray-200 rounded">
                  Invert
                </button>
                <button onClick={() => finishMaskEditing()} className="px-2 py-1 bg-blue-600 text-white rounded">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="md:col-span-1">
          {/* Layer panel */}
          <div className="p-4 border rounded bg-gray-50 space-y-2">
            <h3 className="font-semibold">Layers</h3>
            {project.layers.map((layer) => (
              <div
                key={layer.id}
                className={`flex items-center justify-between p-1 rounded cursor-pointer ${selectedLayerId === layer.id ? 'bg-blue-100' : ''
                  }`}
                onClick={() => setSelectedLayerId(layer.id)}
              >
                <div className="flex-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={(e) => updateLayer(layer.id, { visible: e.target.checked })}
                    className="mr-2"
                  />
                  {editingNameId === layer.id ? (
                    <input
                      className="flex-1 border rounded p-1 text-sm"
                      value={layer.name}
                      onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                      onBlur={() => setEditingNameId(null)}
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 text-sm truncate" onDoubleClick={() => setEditingNameId(layer.id)}>
                      {layer.name}
                    </span>
                  )}
                  <button onClick={() => startMaskEditing(layer.id)} className="ml-2 text-xs px-1 bg-gray-200 rounded">
                    Mask
                  </button>
                </div>
                <div className="flex items-center">
                  <button onClick={() => moveLayer(layer.id, -1)} className="px-1 text-xs">
                    ▲
                  </button>
                  <button onClick={() => moveLayer(layer.id, 1)} className="px-1 text-xs">
                    ▼
                  </button>
                  <button
                    onClick={() => updateLayer(layer.id, { locked: !layer.locked })}
                    className="ml-1 px-1 text-xs"
                  >
                    {layer.locked ? '🔒' : '🔓'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Helper text */}
          <p className="mt-4 text-sm text-gray-600">
            Gebruik het lagenpaneel om lagen te selecteren, hernoemen, verbergen, vergrendelen of te maskeren. Sleep
            lagen omhoog of omlaag om de stapelvolgorde te wijzigen.
          </p>
        </div>
      </div>
    </div>
  );
}
