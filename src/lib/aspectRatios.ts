export interface AspectRatio {
  id: string;
  name: string;
  ratio: string;
  width: number;
  height: number;
  description: string;
}

export const aspectRatios: AspectRatio[] = [
  {
    id: 'square',
    name: 'Square',
    ratio: '1:1',
    width: 1024,
    height: 1024,
    description: 'Perfect for social media posts'
  },
  {
    id: 'portrait',
    name: 'Portrait',
    ratio: '3:4',
    width: 768,
    height: 1024,
    description: 'Great for mobile wallpapers'
  },
  {
    id: 'landscape',
    name: 'Landscape',
    ratio: '4:3',
    width: 1024,
    height: 768,
    description: 'Ideal for desktop wallpapers'
  },
  {
    id: 'wide',
    name: 'Wide',
    ratio: '16:9',
    width: 1920,
    height: 1080,
    description: 'Perfect for presentations'
  },
  {
    id: 'tall',
    name: 'Tall',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    description: 'Great for mobile stories'
  }
];
