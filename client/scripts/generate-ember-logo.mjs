#!/usr/bin/env node
/**
 * Generates EmberLogo.tsx from a dragon SVG.
 *
 * Usage: pnpm dragon:logo [number]
 * Example: pnpm dragon:logo 45
 *
 * Defaults to dragon-45 if no number given.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const num = (process.argv[2] || '45').padStart(2, '0');
const svgPath = join(__dirname, '..', 'public', 'images', 'dragons', `dragon-${num}.svg`);
const outPath = join(__dirname, '..', 'components', 'EmberLogo.tsx');

if (!existsSync(svgPath)) {
  console.error(`Dragon not found: ${svgPath}`);
  process.exit(1);
}

const svg = readFileSync(svgPath, 'utf-8');
const paths = [...svg.matchAll(/d="([^"]+)"/g)].map(m => m[1]);
const viewBox = (svg.match(/viewBox="([^"]+)"/) || ['', '0 0 864 864'])[1];

const component = `// Auto-generated from dragon-${num}.svg — run: pnpm dragon:logo ${parseInt(num)}

interface EmberLogoProps {
  className?: string;
  size?: number;
}

export const EmberLogo = ({ className = "", size = 32 }: EmberLogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="${viewBox}"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
${paths.map(d => `    <path d="${d}" />`).join('\n')}
  </svg>
);
`;

writeFileSync(outPath, component);
console.log(`Generated EmberLogo.tsx from dragon-${num}.svg (${paths.length} paths)`);
