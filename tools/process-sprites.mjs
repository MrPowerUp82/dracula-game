// Processa os sprites brutos do Gemini (sprites/*.jpg) em spritesheets prontos
// para o Phaser (public/sprites/*.png + .json).
//
// O Gemini ignora "fundo transparente" e pinta um xadrez cinza no lugar. Este
// script remove esse xadrez por chroma-key (pixels quase-neutros dentro da
// faixa de luminância do xadrez viram alfa 0), recorta a área útil comum a
// todos os frames, redimensiona para a altura-alvo e monta uma tira horizontal.
//
// Uso: node tools/process-sprites.mjs

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'sprites');
const OUT = resolve(ROOT, 'public/sprites');

/**
 * @type {{src:string,name:string,cols:number,rows:number,targetH:number,
 *         take?:number,frames?:number[]}[]}
 * `frames` = índices de célula (linha-a-linha) a incluir, nesta ordem.
 * `take` = pega as N primeiras células. Sem nenhum dos dois, usa todas.
 */
const JOBS = [
  { src: 'dracula_idle.jpg', name: 'dracula-idle', cols: 4, rows: 1, targetH: 64 },
  // Ciclo de caminhada limpo de 6 frames, recortado com centros precisos e alinhamento de piso consistente.
  {
    src: 'dracula_walk.jpg',
    name: 'dracula-walk',
    targetH: 64,
    customCenters: [122.5, 346.5, 568.5, 793.0, 1020.0, 1243.5],
    cropW: 216,
    cropH: 320,
    top: 55,
  },
  { src: 'dracula_dash.jpg', name: 'dracula-dash', cols: 4, rows: 1, targetH: 64 },
  { src: 'dracula_hurt.jpg', name: 'dracula-hurt', cols: 2, rows: 1, targetH: 64 },
  { src: 'dracula_cast.jpg', name: 'dracula-cast', cols: 4, rows: 1, targetH: 64 },
  { src: 'dracula_death.jpg', name: 'dracula-death', cols: 6, rows: 1, targetH: 64 },
  { src: 'dracula_levelup.jpg', name: 'dracula-levelup', cols: 4, rows: 1, targetH: 64 },

  // Grade 7x3 do Gemini; a 1a linha é um ciclo de andar limpo.
  { src: 'm1_cursed_villager.jpg', name: 'crawler-walk', cols: 7, rows: 3, take: 7, targetH: 56 },
  
  // Outros monstros de M1
  { src: 'm1_crypt_skeleton.jpg', name: 'crypt-skeleton', cols: 7, rows: 3, take: 17, targetH: 64 },
  { src: 'm1_elite_profaned_sentinel.jpg', name: 'elite-profaned-sentinel', cols: 7, rows: 3, take: 19, targetH: 96 },
  { src: 'm1_grave_crow.jpg', name: 'grave-crow', cols: 7, rows: 3, take: 17, targetH: 64 },
  { src: 'm1_risen_servant.jpg', name: 'risen-servant', cols: 7, rows: 3, take: 17, targetH: 64 },

  // Grade 10x5; a 4a linha (células 30-37) é um ciclo de investida legível.
  { src: 'boss_m1_profaner_knight.jpg', name: 'boss-m1', cols: 10, rows: 5, frames: [30, 31, 32, 33, 34, 35, 36, 37], targetH: 96 },

  // Monstros de M2
  { src: 'm2_torch_peasant.jpg', name: 'torch-peasant', cols: 6, rows: 3, take: 17, targetH: 64 },
  { src: 'm2_witch_hound.jpg', name: 'witch-hound', cols: 5, rows: 3, take: 15, targetH: 64 },
  { src: 'm2_inquisitor_gunner.jpg', name: 'inquisitor-gunner', cols: 5, rows: 4, take: 17, targetH: 64 },
  { src: 'm2_flagellant_bomber.jpg', name: 'flagellant-bomber', cols: 6, rows: 3, take: 17, targetH: 64 },
  { src: 'm2_zealot_preacher.jpg', name: 'zealot-preacher', cols: 6, rows: 4, take: 17, targetH: 64 },
  { src: 'm2_elite_pyre_warden.jpg', name: 'elite-pyre-warden', cols: 6, rows: 4, take: 19, targetH: 96 },
  
  // Chefe de M2
  { src: 'boss_m2_grand_inquisitor.jpg', name: 'boss-m2', cols: 8, rows: 6, take: 39, targetH: 128 },

  // VFX
  { src: 'fx_bat_swarm.jpg', name: 'fx-bat-swarm', cols: 7, rows: 3, take: 10, targetH: 48 },
  { src: 'fx_claw_scratch.jpg', name: 'fx-claw-scratch', cols: 7, rows: 3, take: 9, targetH: 48 }
];

const SAT_MAX = 0.22; // acima disso, o pixel tem cor -> é personagem
const LUMA_PAD = 20; // folga na faixa de luminância do xadrez

const sat = (r, g, b) => {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  return mx === 0 ? 0 : (mx - mn) / mx;
};
const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Deriva a faixa de luminância do xadrez amostrando os quatro cantos. */
function checkerLumaRange(data, w, h) {
  const lo = { v: 255 };
  const hi = { v: 0 };
  const S = 24;
  const corners = [
    [0, 0],
    [w - S, 0],
    [0, h - S],
    [w - S, h - S],
  ];
  for (const [cx, cy] of corners) {
    for (let y = cy; y < cy + S; y++) {
      for (let x = cx; x < cx + S; x++) {
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (sat(r, g, b) >= SAT_MAX) continue;
        const L = luma(r, g, b);
        if (L < lo.v) lo.v = L;
        if (L > hi.v) hi.v = L;
      }
    }
  }
  return [lo.v - LUMA_PAD, hi.v + LUMA_PAD];
}

/**
 * Remove o xadrez por preenchimento a partir das bordas: só se propaga por
 * pixels "xadrez" (quase-neutros na faixa de luminância dele), então placas de
 * armadura cinza no interior do personagem — que não têm caminho de xadrez até
 * a borda — são preservadas. Depois, 1px de erosão para tirar a franja.
 */
function keyOutChecker(data, w, h) {
  const [loL, hiL] = checkerLumaRange(data, w, h);
  const isChecker = (i) => {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (sat(r, g, b) >= SAT_MAX) return false;
    const L = luma(r, g, b);
    return L >= loL && L <= hiL;
  };

  const bg = new Uint8Array(w * h);
  const stack = [];
  const pushIf = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (bg[p]) return;
    if (!isChecker(p * 4)) return;
    bg[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < w; x++) {
    pushIf(x, 0);
    pushIf(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushIf(0, y);
    pushIf(w - 1, y);
  }
  while (stack.length) {
    const p = stack.pop();
    const x = p % w;
    const y = (p - x) / w;
    pushIf(x + 1, y);
    pushIf(x - 1, y);
    pushIf(x, y + 1);
    pushIf(x, y - 1);
  }

  // erosão: qualquer opaco encostando no fundo também vira fundo
  const erode = Uint8Array.from(bg);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (bg[p]) continue;
      if (
        (x > 0 && bg[p - 1]) ||
        (x < w - 1 && bg[p + 1]) ||
        (y > 0 && bg[p - w]) ||
        (y < h - 1 && bg[p + w])
      ) {
        erode[p] = 1;
      }
    }
  }
  for (let p = 0; p < w * h; p++) {
    if (erode[p]) data[p * 4 + 3] = 0;
  }
  return data;
}

/** Caixa que contém todo pixel opaco. */
function contentBox(data, w, h) {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

async function run() {
  mkdirSync(OUT, { recursive: true });
  const manifest = {};

  for (const job of JOBS) {
    const srcPath = resolve(SRC, job.src);
    const input = readFileSync(srcPath);
    const meta = await sharp(input).metadata();
    const W = meta.width;
    const H = meta.height;

    if (job.customCenters) {
      const frameCount = job.customCenters.length;
      const cropW = job.cropW;
      const cropH = job.cropH;
      const top = job.top;
      const targetH = job.targetH;
      const frameW = Math.round(cropW * (targetH / cropH));
      const frameH = targetH;
      const rawRgb = new Uint8Array(await sharp(input).raw().toBuffer());
      const frames = [];

      for (let i = 0; i < frameCount; i++) {
        const cx = Math.round(job.customCenters[i]);
        const left = cx - Math.floor(cropW / 2);
        const cellBuf = new Uint8Array(cropW * cropH * 4);
        for (let y = 0; y < cropH; y++) {
          for (let x = 0; x < cropW; x++) {
            const srcX = left + x;
            const srcY = top + y;
            const srcIdx = (srcY * W + srcX) * 3;
            const dstIdx = (y * cropW + x) * 4;
            const r = rawRgb[srcIdx];
            const g = rawRgb[srcIdx + 1];
            const b = rawRgb[srcIdx + 2];
            const diff = Math.abs(r - 124) + Math.abs(g - 124) + Math.abs(b - 124);
            if (diff < 70) {
              cellBuf[dstIdx + 3] = 0;
            } else {
              cellBuf[dstIdx] = r;
              cellBuf[dstIdx + 1] = g;
              cellBuf[dstIdx + 2] = b;
              cellBuf[dstIdx + 3] = 255;
            }
          }
        }
        const png = await sharp(cellBuf, { raw: { width: cropW, height: cropH, channels: 4 } })
          .resize(frameW, frameH, { fit: 'fill', kernel: 'nearest' })
          .png()
          .toBuffer();
        frames.push(png);
      }

      const sheet = sharp({
        create: {
          width: frameW * frameCount,
          height: frameH,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      });
      const composites = frames.map((f, i) => ({ input: f, left: i * frameW, top: 0 }));
      await sheet.composite(composites).png().toFile(resolve(OUT, `${job.name}.png`));
      manifest[job.name] = { frameWidth: frameW, frameHeight: frameH, frameCount };
      console.log(`${job.name}: ${frameCount} frames @ ${frameW}x${frameH}`);
      continue;
    }

    const raw = new Uint8Array(await sharp(input).ensureAlpha().raw().toBuffer());
    keyOutChecker(raw, W, H);

    const cellW = Math.floor(W / job.cols);
    const cellH = Math.floor(H / job.rows);
    const totalCells = job.cols * job.rows;
    const indices = job.frames ?? Array.from({ length: job.take ?? totalCells }, (_, k) => k);
    const frameCount = indices.length;

    // 1) recorta cada célula do buffer com chroma-key aplicado
    /** @type {{buf:Uint8Array}[]} */
    const cells = [];
    for (const cellIdx of indices) {
      const cx = (cellIdx % job.cols) * cellW;
      const cy = Math.floor(cellIdx / job.cols) * cellH;
      const buf = new Uint8Array(cellW * cellH * 4);
      for (let y = 0; y < cellH; y++) {
        const srcRow = ((cy + y) * W + cx) * 4;
        buf.set(raw.subarray(srcRow, srcRow + cellW * 4), y * cellW * 4);
      }
      cells.push({ buf });
    }

    // 2) caixa de conteúdo comum a todos os frames (pivô consistente)
    let box = { minX: cellW, minY: cellH, maxX: -1, maxY: -1 };
    for (const c of cells) {
      const b = contentBox(c.buf, cellW, cellH);
      if (b.maxX < 0) continue;
      box.minX = Math.min(box.minX, b.minX);
      box.minY = Math.min(box.minY, b.minY);
      box.maxX = Math.max(box.maxX, b.maxX);
      box.maxY = Math.max(box.maxY, b.maxY);
    }
    const pad = 4;
    box.minX = Math.max(0, box.minX - pad);
    box.minY = Math.max(0, box.minY - pad);
    box.maxX = Math.min(cellW - 1, box.maxX + pad);
    box.maxY = Math.min(cellH - 1, box.maxY + pad);
    const cropW = box.maxX - box.minX + 1;
    const cropH = box.maxY - box.minY + 1;

    const scale = job.targetH / cropH;
    const frameH = job.targetH;
    const frameW = Math.round(cropW * scale);

    // 3) redimensiona cada frame e cola numa tira horizontal
    const sheet = sharp({
      create: {
        width: frameW * frameCount,
        height: frameH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });
    const composites = [];
    for (let idx = 0; idx < cells.length; idx++) {
      const cropped = new Uint8Array(cropW * cropH * 4);
      for (let y = 0; y < cropH; y++) {
        const srcRow = ((box.minY + y) * cellW + box.minX) * 4;
        cropped.set(cells[idx].buf.subarray(srcRow, srcRow + cropW * 4), y * cropW * 4);
      }
      const png = await sharp(cropped, { raw: { width: cropW, height: cropH, channels: 4 } })
        .resize(frameW, frameH, { fit: 'fill', kernel: 'nearest' })
        .png()
        .toBuffer();
      composites.push({ input: png, left: idx * frameW, top: 0 });
    }

    await sheet.composite(composites).png().toFile(resolve(OUT, `${job.name}.png`));
    manifest[job.name] = { frameWidth: frameW, frameHeight: frameH, frameCount };
    console.log(`${job.name}: ${frameCount} frames @ ${frameW}x${frameH}`);
  }

  writeFileSync(resolve(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('manifest.json escrito');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
