import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(projectRoot, 'dist');
const sharedOutput = path.join(projectRoot, 'functions', 'shared');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(projectRoot, 'public'), output, { recursive: true });
await mkdir(sharedOutput, { recursive: true });
await cp(path.join(projectRoot, 'public', 'shared'), sharedOutput, { recursive: true });
console.log('Build concluído: dist/ e functions/shared/');
