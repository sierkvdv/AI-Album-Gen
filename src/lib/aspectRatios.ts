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
    id: 'square_standard',
    name: 'Square (Standard)',
    ratio: '1:1',
    width: 1024,
    height: 1024,
    description: 'Standard quality - $0.040'
  },
  {
    id: 'square_hd',
    name: 'Square (HD)',
    ratio: '1:1',
    width: 1024,
    height: 1024,
    description: 'HD quality - $0.080'
  },
  {
    id: 'portrait_standard',
    name: 'Portrait (Standard)',
    ratio: '9:16',
    width: 1024,
    height: 1792,
    description: 'Standard quality - $0.080'
  },
  {
    id: 'portrait_hd',
    name: 'Portrait (HD)',
    ratio: '9:16',
    width: 1024,
    height: 1792,
    description: 'HD quality - $0.120'
  },
  {
    id: 'landscape_standard',
    name: 'Landscape (Standard)',
    ratio: '16:9',
    width: 1792,
    height: 1024,
    description: 'Standard quality - $0.080'
  },
  {
    id: 'landscape_hd',
    name: 'Landscape (HD)',
    ratio: '16:9',
    width: 1792,
    height: 1024,
    description: 'HD quality - $0.120'
  }
];
