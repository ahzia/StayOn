const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');
const extOnly = process.argv.includes('--ext');
const webviewOnly = process.argv.includes('--webview');

const base = {
  logLevel: 'info',
  minify: production,
  sourcemap: !production,
};

async function buildExt() {
  await esbuild.build({
    ...base,
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    platform: 'node',
    format: 'cjs',
    external: ['vscode'],
    target: 'node18',
  });
}

async function buildWebview() {
  await esbuild.build({
    ...base,
    entryPoints: ['media/panel/main.ts'],
    bundle: true,
    outfile: 'media/panel/main.js',
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
  });
  copyCodicons();
}

function copyCodicons() {
  const srcDir = path.join(__dirname, 'node_modules', '@vscode', 'codicons', 'dist');
  const destDir = path.join(__dirname, 'media', 'codicons');
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of ['codicon.css', 'codicon.ttf']) {
    const src = path.join(srcDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(destDir, file));
    }
  }
}

async function main() {
  const runExt = !webviewOnly;
  const runWebview = !extOnly;

  if (watch) {
    const contexts = [];
    if (runExt) {
      contexts.push(
        await esbuild.context({
          ...base,
          entryPoints: ['src/extension.ts'],
          bundle: true,
          outfile: 'dist/extension.js',
          platform: 'node',
          format: 'cjs',
          external: ['vscode'],
          target: 'node18',
        })
      );
    }
    if (runWebview) {
      contexts.push(
        await esbuild.context({
          ...base,
          entryPoints: ['media/panel/main.ts'],
          bundle: true,
          outfile: 'media/panel/main.js',
          platform: 'browser',
          format: 'iife',
          target: 'es2020',
        })
      );
    }
    for (const ctx of contexts) {
      await ctx.watch();
    }
    console.log('[esbuild] watching...');
    return;
  }

  if (runExt) {
    await buildExt();
  }
  if (runWebview) {
    await buildWebview();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
