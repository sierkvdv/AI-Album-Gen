export interface StylePreset {
  id: string;
  name: string;
  description: string;
  genre: string;
  mood: string;
  colour: string;
}

/**
 * A small collection of style presets that users can choose from when
 * generating album covers. Each preset defines a genre, mood and
 * predominant colour which will be appended to the user's prompt.
 */
export const stylePresets: StylePreset[] = [
  {
    id: 'rock-dark-red',
    name: 'Dark Rock',
    description: 'Intense rock vibes with dark tones and crimson highlights.',
    genre: 'rock',
    mood: 'dark',
    colour: 'red',
  },
  {
    id: 'pop-vibrant-pink',
    name: 'Vibrant Pop',
    description: 'Bright and cheerful pop aesthetics with lively pink colours.',
    genre: 'pop',
    mood: 'happy',
    colour: 'pink',
  },
  {
    id: 'jazz-moody-blue',
    name: 'Moody Jazz',
    description: 'Smooth jazz with melancholy blues and elegant cool tones.',
    genre: 'jazz',
    mood: 'melancholy',
    colour: 'blue',
  },
  {
    id: 'electronic-futuristic-cyan',
    name: 'Futuristic Electronic',
    description: 'Electronic beats with a futuristic atmosphere and cyan glows.',
    genre: 'electronic',
    mood: 'futuristic',
    colour: 'cyan',
  },
  {
    id: 'hiphop-urban-orange',
    name: 'Urban Hip‑Hop',
    description: 'Energetic hip‑hop with urban street vibes and orange splashes.',
    genre: 'hip-hop',
    mood: 'energetic',
    colour: 'orange',
  },
  {
    id: 'classical-ethereal-white',
    name: 'Ethereal Classical',
    description: 'Timeless classical compositions with ethereal white and gold.',
    genre: 'classical',
    mood: 'ethereal',
    colour: 'white and gold',
  },
];