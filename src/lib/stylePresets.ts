export interface StylePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  styleDescriptor: string;
}

/**
 * An extensive collection of style presets for AI image generation.
 * Each preset defines a visual style that will be applied to the user's prompt.
 * Users can also choose "No Style" to generate images without any style modifications.
 */
export const stylePresets: StylePreset[] = [
  // No Style Option
  {
    id: 'none',
    name: 'No Style',
    description: 'Generate images without any style modifications - pure prompt interpretation.',
    category: 'None',
    styleDescriptor: '',
  },

  // Artistic Styles
  {
    id: 'realistic',
    name: 'Photorealistic',
    description: 'Ultra-realistic, high-detail photographic style.',
    category: 'Artistic',
    styleDescriptor: 'photorealistic, ultra-detailed, high resolution, professional photography',
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    description: 'Classic oil painting with rich textures and brushstrokes.',
    category: 'Artistic',
    styleDescriptor: 'oil painting, classical art, rich textures, visible brushstrokes, traditional painting',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft, flowing watercolor with gentle color transitions.',
    category: 'Artistic',
    styleDescriptor: 'watercolor painting, soft edges, flowing colors, artistic, delicate',
  },
  {
    id: 'digital-art',
    name: 'Digital Art',
    description: 'Modern digital illustration with clean lines and vibrant colors.',
    category: 'Artistic',
    styleDescriptor: 'digital art, modern illustration, clean lines, vibrant colors, contemporary',
  },
  {
    id: 'sketch',
    name: 'Pencil Sketch',
    description: 'Hand-drawn pencil sketch with shading and detail.',
    category: 'Artistic',
    styleDescriptor: 'pencil sketch, hand-drawn, detailed shading, artistic drawing, monochrome',
  },
  {
    id: 'abstract',
    name: 'Abstract',
    description: 'Non-representational abstract art with bold shapes and colors.',
    category: 'Artistic',
    styleDescriptor: 'abstract art, non-representational, bold shapes, artistic expression, modern',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, simple design with minimal elements and maximum impact.',
    category: 'Artistic',
    styleDescriptor: 'minimalist, clean design, simple composition, modern, elegant',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Retro, aged aesthetic with nostalgic charm.',
    category: 'Artistic',
    styleDescriptor: 'vintage style, retro, aged, nostalgic, classic, timeless',
  },

  // Color Palettes
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Black and white or single-color palette.',
    category: 'Color',
    styleDescriptor: 'monochrome, black and white, single color palette, dramatic contrast',
  },
  {
    id: 'warm-tones',
    name: 'Warm Tones',
    description: 'Rich reds, oranges, and yellows for a cozy feel.',
    category: 'Color',
    styleDescriptor: 'warm color palette, reds, oranges, yellows, cozy, inviting',
  },
  {
    id: 'cool-tones',
    name: 'Cool Tones',
    description: 'Blues, greens, and purples for a calm atmosphere.',
    category: 'Color',
    styleDescriptor: 'cool color palette, blues, greens, purples, calm, serene',
  },
  {
    id: 'pastel',
    name: 'Pastel',
    description: 'Soft, muted colors for a gentle, dreamy look.',
    category: 'Color',
    styleDescriptor: 'pastel colors, soft, muted, gentle, dreamy, delicate',
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Bright, electric colors with glowing effects.',
    category: 'Color',
    styleDescriptor: 'neon colors, bright, electric, glowing, vibrant, cyberpunk',
  },
  {
    id: 'earth-tones',
    name: 'Earth Tones',
    description: 'Natural browns, greens, and tans for organic feel.',
    category: 'Color',
    styleDescriptor: 'earth tones, natural colors, browns, greens, organic, rustic',
  },

  // Moods & Atmospheres
  {
    id: 'dramatic',
    name: 'Dramatic',
    description: 'High contrast, intense lighting for powerful impact.',
    category: 'Mood',
    styleDescriptor: 'dramatic lighting, high contrast, intense, powerful, cinematic',
  },
  {
    id: 'serene',
    name: 'Serene',
    description: 'Peaceful, calm atmosphere with soft lighting.',
    category: 'Mood',
    styleDescriptor: 'serene, peaceful, calm, soft lighting, tranquil, meditative',
  },
  {
    id: 'mysterious',
    name: 'Mysterious',
    description: 'Dark, enigmatic atmosphere with hidden details.',
    category: 'Mood',
    styleDescriptor: 'mysterious, dark, enigmatic, shadowy, intriguing, atmospheric',
  },
  {
    id: 'playful',
    name: 'Playful',
    description: 'Fun, energetic vibe with bright, cheerful elements.',
    category: 'Mood',
    styleDescriptor: 'playful, fun, energetic, bright, cheerful, whimsical',
  },
  {
    id: 'melancholic',
    name: 'Melancholic',
    description: 'Sad, contemplative mood with muted tones.',
    category: 'Mood',
    styleDescriptor: 'melancholic, sad, contemplative, muted tones, introspective, emotional',
  },
  {
    id: 'ethereal',
    name: 'Ethereal',
    description: 'Otherworldly, dreamlike quality with soft glows.',
    category: 'Mood',
    styleDescriptor: 'ethereal, otherworldly, dreamlike, soft glow, mystical, transcendent',
  },

  // Special Effects
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Futuristic, neon-lit urban aesthetic.',
    category: 'Effects',
    styleDescriptor: 'cyberpunk, futuristic, neon lights, urban, high-tech, dystopian',
  },
  {
    id: 'steampunk',
    name: 'Steampunk',
    description: 'Victorian-era technology with brass and gears.',
    category: 'Effects',
    styleDescriptor: 'steampunk, Victorian era, brass, gears, mechanical, retro-futuristic',
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    description: 'Magical, mystical elements with enchanting atmosphere.',
    category: 'Effects',
    styleDescriptor: 'fantasy, magical, mystical, enchanting, otherworldly, magical realism',
  },
  {
    id: 'sci-fi',
    name: 'Sci-Fi',
    description: 'Futuristic technology and space-age aesthetics.',
    category: 'Effects',
    styleDescriptor: 'sci-fi, futuristic, space-age, technological, advanced, space',
  },
  {
    id: 'gothic',
    name: 'Gothic',
    description: 'Dark, ornate style with dramatic architecture.',
    category: 'Effects',
    styleDescriptor: 'gothic, dark, ornate, dramatic architecture, medieval, mysterious',
  },
  {
    id: 'surreal',
    name: 'Surreal',
    description: 'Dreamlike, impossible combinations and perspectives.',
    category: 'Effects',
    styleDescriptor: 'surreal, dreamlike, impossible, bizarre, imaginative, Salvador Dali style',
  },

  // Textures & Materials
  {
    id: 'metallic',
    name: 'Metallic',
    description: 'Shiny, reflective metal surfaces and textures.',
    category: 'Texture',
    styleDescriptor: 'metallic, shiny, reflective, chrome, steel, industrial',
  },
  {
    id: 'wooden',
    name: 'Wooden',
    description: 'Natural wood grain and warm wooden textures.',
    category: 'Texture',
    styleDescriptor: 'wooden, wood grain, natural wood, warm, organic, rustic',
  },
  {
    id: 'glass',
    name: 'Glass',
    description: 'Transparent, crystalline surfaces with light refraction.',
    category: 'Texture',
    styleDescriptor: 'glass, transparent, crystalline, light refraction, clear, fragile',
  },
  {
    id: 'fabric',
    name: 'Fabric',
    description: 'Soft, textured fabric materials and drapery.',
    category: 'Texture',
    styleDescriptor: 'fabric, soft, textured, drapery, cloth, material',
  },
  {
    id: 'stone',
    name: 'Stone',
    description: 'Rough, weathered stone textures and surfaces.',
    category: 'Texture',
    styleDescriptor: 'stone, rough, weathered, rocky, natural, ancient',
  },
];