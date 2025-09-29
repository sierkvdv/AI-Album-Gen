// Popular Google Fonts for image editing
export const googleFonts = [
  // Sans-serif fonts
  { name: 'Inter', family: 'Inter, sans-serif', category: 'Sans-serif' },
  { name: 'Roboto', family: 'Roboto, sans-serif', category: 'Sans-serif' },
  { name: 'Open Sans', family: 'Open Sans, sans-serif', category: 'Sans-serif' },
  { name: 'Lato', family: 'Lato, sans-serif', category: 'Sans-serif' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', category: 'Sans-serif' },
  { name: 'Source Sans Pro', family: 'Source Sans Pro, sans-serif', category: 'Sans-serif' },
  { name: 'Poppins', family: 'Poppins, sans-serif', category: 'Sans-serif' },
  { name: 'Nunito', family: 'Nunito, sans-serif', category: 'Sans-serif' },
  
  // Serif fonts
  { name: 'Playfair Display', family: 'Playfair Display, serif', category: 'Serif' },
  { name: 'Merriweather', family: 'Merriweather, serif', category: 'Serif' },
  { name: 'Lora', family: 'Lora, serif', category: 'Serif' },
  { name: 'Crimson Text', family: 'Crimson Text, serif', category: 'Serif' },
  { name: 'Libre Baskerville', family: 'Libre Baskerville, serif', category: 'Serif' },
  
  // Display fonts
  { name: 'Oswald', family: 'Oswald, sans-serif', category: 'Display' },
  { name: 'Bebas Neue', family: 'Bebas Neue, sans-serif', category: 'Display' },
  { name: 'Anton', family: 'Anton, sans-serif', category: 'Display' },
  { name: 'Righteous', family: 'Righteous, sans-serif', category: 'Display' },
  { name: 'Fredoka One', family: 'Fredoka One, sans-serif', category: 'Display' },
  
  // Handwriting fonts
  { name: 'Dancing Script', family: 'Dancing Script, cursive', category: 'Handwriting' },
  { name: 'Pacifico', family: 'Pacifico, cursive', category: 'Handwriting' },
  { name: 'Caveat', family: 'Caveat, cursive', category: 'Handwriting' },
  { name: 'Kalam', family: 'Kalam, cursive', category: 'Handwriting' },
  { name: 'Comfortaa', family: 'Comfortaa, cursive', category: 'Handwriting' },
  
  // Monospace fonts
  { name: 'Fira Code', family: 'Fira Code, monospace', category: 'Monospace' },
  { name: 'Source Code Pro', family: 'Source Code Pro, monospace', category: 'Monospace' },
  { name: 'JetBrains Mono', family: 'JetBrains Mono, monospace', category: 'Monospace' },
  
  // System fonts (fallbacks)
  { name: 'System Sans', family: 'system-ui, -apple-system, sans-serif', category: 'System' },
  { name: 'System Serif', family: 'Georgia, serif', category: 'System' },
  { name: 'System Mono', family: 'Monaco, monospace', category: 'System' },
];

// Generate Google Fonts CSS import URL
export function getGoogleFontsUrl(): string {
  const fontNames = googleFonts
    .filter(font => !font.category.includes('System'))
    .map(font => font.name.replace(/\s+/g, '+'))
    .join('|');
  
  return `https://fonts.googleapis.com/css2?family=${fontNames}&display=swap`;
}

// Get font family by name
export function getFontFamily(fontName: string): string {
  const font = googleFonts.find(f => f.name === fontName);
  return font ? font.family : 'sans-serif';
}
