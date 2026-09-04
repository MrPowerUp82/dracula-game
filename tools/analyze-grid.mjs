import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const spritesDir = 'c:/Users/webpa/OneDrive/Documentos/projetos/meu-game/sprites';
const files = readdirSync(spritesDir).filter(f => f.endsWith('.jpg') && !f.startsWith('art_') && !f.startsWith('env_') && f !== 'dracula_reference.jpg');

async function analyze() {
  for (const f of files) {
    const p = resolve(spritesDir, f);
    const meta = await sharp(p).metadata();
    const ratio = meta.width / meta.height;
    
    // try to guess cols and rows (assuming roughly square cells)
    let bestMatch = { cols: 1, rows: 1, diff: 999 };
    for (let rows = 1; rows <= 10; rows++) {
      for (let cols = 1; cols <= 15; cols++) {
        const r = cols / rows;
        const diff = Math.abs(r - ratio);
        if (diff < bestMatch.diff) {
          bestMatch = { cols, rows, diff };
        }
      }
    }
    
    console.log(`${f.padEnd(30)}: ${meta.width}x${meta.height} (W/H=${ratio.toFixed(2)}) => Guessed: ${bestMatch.cols}x${bestMatch.rows} (cells ~${Math.round(meta.width/bestMatch.cols)}x${Math.round(meta.height/bestMatch.rows)})`);
  }
}

analyze();
