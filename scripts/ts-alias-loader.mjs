/**
 * Minimal ESM resolve hook so plain `node` can execute the TypeScript sources
 * directly (Node 24 strips types natively). It teaches the resolver two things
 * the bundler already knows:
 *
 *   "@/lib/x"   -> <root>/src/lib/x.ts
 *   "./engine"  -> ./engine.ts
 *
 * Used by `npm run seed`, which must run without a bundler in the loop.
 */
import { statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve as resolvePath } from 'node:path';

const ROOT = process.cwd();
const CANDIDATES = ['.ts', '.tsx', '/index.ts', '/index.tsx'];

const exists = (p) => {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
};

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const base = resolvePath(ROOT, 'src', specifier.slice(2));
    for (const ext of ['', ...CANDIDATES]) {
      if (exists(base + ext)) return { url: pathToFileURL(base + ext).href, shortCircuit: true };
    }
  }

  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    const base = new URL(specifier, context.parentURL);
    for (const ext of CANDIDATES) {
      const candidate = new URL(base.href + ext);
      if (exists(candidate)) return { url: candidate.href, shortCircuit: true };
    }
  }

  return nextResolve(specifier, context);
}
