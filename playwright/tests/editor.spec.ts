import { test, expect } from '@playwright/test';
import { createOverlaySvg } from '../../src/lib/exportHelpers';

// Minimal project state type used for testing. We duplicate the shape here
// rather than importing from the client file to avoid pulling React into
// the test environment.
interface TestLayer {
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
interface TestProject {
  id: string;
  baseAssetUrl: string;
  baseWidth: number;
  baseHeight: number;
  crop: any;
  filters: any;
  layers: TestLayer[];
}

test('overlay svg contains all text layers', async () => {
  const project: TestProject = {
    id: 'test',
    baseAssetUrl: '',
    baseWidth: 1000,
    baseHeight: 1000,
    crop: {},
    filters: {},
    layers: [
      {
        id: '1',
        text: 'Hello',
        fontFamily: 'sans-serif',
        fontSize: 32,
        color: '#000000',
        scale: 1,
        rotation: 0,
        x: 500,
        y: 500,
        opacity: 1,
        uppercase: false,
      },
      {
        id: '2',
        text: 'World',
        fontFamily: 'serif',
        fontSize: 24,
        color: '#ff0000',
        scale: 1,
        rotation: 0,
        x: 300,
        y: 700,
        opacity: 0.8,
        uppercase: true,
      },
    ],
  };
  const svg = createOverlaySvg(project as any);
  expect(svg).toContain('<text');
  expect(svg).toContain('Hello');
  expect(svg).toContain('WORLD');
});