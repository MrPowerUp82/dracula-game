# Drácula: Memórias de Sangue — Biblioteca de Prompts (Gemini)

Prompts prontos para gerar **todos os sprites e cenas** do jogo.
Documento de design: [`DESIGN.md`](DESIGN.md).

- **~90 prompts**, agrupados: `00` âncora · `10` Drácula · `20` inimigos · `30` chefes ·
  `40` poderes/VFX · `50` coletáveis/UI · `60` cenários · `70` ilustrações narrativas.
- Os prompts estão **em inglês** (modelos de imagem respondem melhor). As notas de contexto
  estão em português.

---

## Como usar

### Ordem de geração (importante para consistência)

1. **`00` — Bloco-âncora de estilo.** Não gera nada; é o texto fixo que você **cola no início
   de todo prompt de sprite/personagem** (seções 10–50). Cenários (60) e ilustrações (70) usam
   uma variação, indicada em cada um.
2. **`10.1` — Folha de referência do Drácula.** Gere primeiro. Escolha a melhor imagem e
   **guarde**. A partir daqui, sempre que possível anexe essa imagem ao prompt e escreva:
   *"Match the exact rendering style, palette, proportions and pixel scale of the attached
   reference image."*
3. Depois: resto do Drácula (10.2–10.8) → inimigos (20) → chefes (30) → poderes (40) →
   coletáveis/UI (50) → cenários (60) → ilustrações (70).

### Regras de consistência

- **1 prompt = 1 entidade = 1 spritesheet** (uma folha por animação, se o modelo não segurar
  a folha completa).
- Se o Gemini bagunçar a grade da folha, **gere frame a frame** (troque
  *"as a horizontal sprite strip of N frames"* por *"a single frame:"* e descreva a pose) e
  monte o atlas depois (TexturePacker, `free-tex-packer`, etc.).
- Depois de gerar, passe tudo por um passo de **indexação de paleta** (ex.: aseprite/script)
  para travar nas ~32 cores mestras — isso conserta 80% da variação entre imagens.
- Sempre exija: `transparent background (PNG RGBA)`, `no text`, `no UI`, `no watermark`,
  `no drop shadow`, `clean anti-aliased alpha edges`.

### Especificação técnica dos sheets

| Tipo | Altura do personagem | Célula sugerida | Animações (frames) |
|---|---|---|---|
| Drácula | 48 px | 64×64 | idle(4), walk(8), dash(4), hurt(2), cast(4), death(6), levelup(4) |
| Inimigo comum | 40–48 px | 64×64 | walk(6), attack(4), hurt(2), death(5) |
| Elite | 64 px | 96×96 | walk(6), attack(5), hurt(2), death(6) |
| Chefe | 96–160 px | 128×128 | intro(6), move(6), atkA(6), atkB(6), enraged(4), stagger(3), death(8) |
| Satã fase 3 | 320 px | 384×384 | peça única + 3–4 poses-chave |
| Projétil/VFX | — | 32×32 ou 48×48 | loop(4–6) + impact(4) |
| Coletável | 16–24 px | 32×32 | loop(4–6) |

Paleta mestra (cite sempre): **purple-blacks, cold desaturated grays, pale corpse skin,
vivid blood red `#B31217` as the single accent, ember amber for fire, moonlit steel-blue
rim light**. ~32 cores no total.

---

## 00 — BLOCO-ÂNCORA DE ESTILO  (cole no início de TODO prompt das seções 10–50)

```
STYLE ANCHOR — read carefully and apply to everything below:
HD pixel art, in the style of a modern "Castlevania: Symphony of the Night" remaster.
Hand-crafted chunky pixels, crisp readable silhouette, limited palette of about 32 colors:
purple-blacks, cold desaturated grays, pale corpse-white skin, and ONE strong accent color
— vivid blood red (#B31217). Ember amber only where fire is present. Cool moonlit
steel-blue rim light from the top, heavy dramatic contrast, deep shadows.
Character design language: gothic dark-fantasy. Dracula-Untold-style blackened plate armor
and a tattered high-collar cape, combined with the saturated color and expressive drama of
the Netflix Castlevania animation.
View: 3/4 top-down game view (as in Vampire Survivors / Brotato) — the character is seen
slightly from above and faces toward the camera/screen.
Output rules: transparent background (PNG RGBA), single subject centered, full body in frame,
consistent scale and vertical position across all frames, no text, no UI, no logos,
no watermark, no cast/drop shadow on the ground, clean anti-aliased alpha edges.
```

---

## 10 — DRÁCULA (protagonista)

> Ele começa **enfraquecido** (visual esfarrapado, pálido, curvado) e o design "cheio de poder"
> só aparece em ilustrações de vitória (seção 70). Nos sprites de gameplay: versão enfraquecida.

### 10.1 — Folha de referência do Drácula  `dracula_reference.png`
```
[ANCHOR]
A single hero reference illustration of DRACULA, weakened form, for use as the master style
reference. Tall gaunt man, long black hair streaked with gray, pale corpse skin, sunken red
eyes, thin cruel face. Wearing battered blackened plate armor with the paint flaking off,
a torn ankle-length cape with a tall stiff collar, frayed hem, dried blood on the fabric.
Slightly hunched, one hand clawed. Blood-red accent on the cape lining and eyes only.
Full body, standing idle pose, facing the screen, 3/4 top-down game view.
Render at roughly 48 px tall character on a 64x64 canvas, then shown large. Nothing else in frame.
```

### 10.2 — Idle  `dracula_idle.png`  (4 frames)
```
[ANCHOR]
DRACULA (weakened form, matching the reference). Horizontal sprite strip of 4 frames:
a subtle idle breathing loop — cape drifting slightly, head barely bobbing, clawed hand
flexing. Character faces the screen. Uniform 64x64 cells, identical position and scale each frame.
```

### 10.3 — Walk  `dracula_walk.png`  (8 frames)
```
[ANCHOR]
DRACULA (weakened form, matching the reference). Horizontal sprite strip of 8 frames:
a full walk cycle seen in 3/4 top-down view, moving toward the screen-right, cape trailing,
armor plates shifting, a tired but predatory gait. Uniform 64x64 cells, consistent scale.
(Left-facing version will be produced by horizontal flip in engine.)
```

### 10.4 — Dash / Forma de Névoa  `dracula_dash.png`  (4 frames)
```
[ANCHOR]
DRACULA (weakened form, matching the reference). Horizontal sprite strip of 4 frames:
the character dissolving forward into a streak of dark violet mist and a few bats, body
half-transparent, trailing wisps, then re-forming. Blood-red eyes glowing brighter mid-dash.
Uniform 64x64 cells.
```

### 10.5 — Hurt  `dracula_hurt.png`  (2 frames)
```
[ANCHOR]
DRACULA (weakened form, matching the reference). Horizontal sprite strip of 2 frames:
recoil from a hit — head snapped back, cape flaring, a brief white-hot flash silhouette on
frame 1, back toward neutral on frame 2. Uniform 64x64 cells.
```

### 10.6 — Cast  `dracula_cast.png`  (4 frames)
```
[ANCHOR]
DRACULA (weakened form, matching the reference). Horizontal sprite strip of 4 frames:
raising one clawed hand, dark-red energy and swirling mist gathering in the palm, cape lifting
as if in a sudden wind, red eyes flaring. Uniform 64x64 cells.
```

### 10.7 — Death  `dracula_death.png`  (6 frames)
```
[ANCHOR]
DRACULA (weakened form, matching the reference). Horizontal sprite strip of 6 frames:
he drops to one knee, then his body crumbles into ash and a scatter of bats that fly apart,
leaving only the empty cape collapsing to the ground on the final frame. Uniform 64x64 cells.
```

### 10.8 — Level-up aura  `dracula_levelup.png`  (4 frames)
```
[ANCHOR]
DRACULA (weakened form, matching the reference). Horizontal sprite strip of 4 frames:
a burst of blood-red light rising around him from the ground, cape billowing upward, eyes
blazing, a ring of red runes flashing outward. Character pose otherwise neutral standing.
Uniform 64x64 cells.
```

---

## 20 — INIMIGOS

> Cada inimigo = 1 sheet com as animações **walk(6), attack(4), hurt(2), death(5)** (elites:
> walk(6), attack(5), hurt(2), death(6)). Onde não faz sentido "attack", use "special".
> Sempre com `[ANCHOR]` no topo.

### Memória 1 — O Despertar (pátio do castelo em ruínas)

#### 20.1 — Aldeão Amaldiçoado · *crawler* · `m1_cursed_villager.png`
```
[ANCHOR]
Enemy: CURSED VILLAGER. A peasant in torn medieval clothes, gray rotting skin, milky white
eyes, mouth hanging open, arms reaching forward. Slow shambling menace. ~44 px tall.
Horizontal sprite strip: walk(6), attack(4 — a lunging grab), hurt(2), death(5 — collapses
into dust). Uniform 64x64 cells, consistent scale and baseline.
```

#### 20.2 — Corvo Sepulcral · *flyer* · `m1_grave_crow.png`
```
[ANCHOR]
Enemy: GRAVE CROW. An oversized ragged black crow with red pinpoint eyes, a few bones tangled
in its feathers, seen from 3/4 top-down as it flies low. ~28 px.
Horizontal sprite strip: fly-loop(6), attack(4 — a diving peck), hurt(2), death(5 — puff of
black feathers). Uniform 64x64 cells.
```

#### 20.3 — Servo Erguido · *runner* · `m1_risen_servant.png`
```
[ANCHOR]
Enemy: RISEN SERVANT. A gaunt undead household servant in a tattered livery coat, moving fast
in a jerky sprint, one arm dragging. Pale blue-gray skin. ~46 px tall.
Horizontal sprite strip: run(6), attack(4 — a wild swipe), hurt(2), death(5 — falls apart at
the joints). Uniform 64x64 cells.
```

#### 20.4 — Esqueleto de Cripta · *blindado leve* · `m1_crypt_skeleton.png`
```
[ANCHOR]
Enemy: CRYPT SKELETON. A yellowed skeleton wearing a rusted breastplate and a dented helm,
carrying a broken shield, hunched and heavy-footed. ~48 px tall.
Horizontal sprite strip: walk(6), attack(4 — a shield bash), hurt(2 — bones rattle),
death(5 — clatters into a pile). Uniform 64x64 cells.
```

#### 20.5 — ELITE: Sentinela Profanado · `m1_elite_profaned_sentinel.png`
```
[ANCHOR]
ELITE enemy: PROFANED SENTINEL. A towering animated suit of castle-guard armor, empty inside
except for a red ember glow, oversized halberd, a broken crown welded to the helm. ~64 px tall,
bulkier silhouette. Drops a treasure chest on death.
Horizontal sprite strip: walk(6), attack(5 — an overhead halberd slam with a shockwave frame),
hurt(2), death(6 — armor blows apart plate by plate, ember gutters out). Uniform 96x96 cells.
```

### Memória 2 — A Fogueira (vila em chamas)

#### 20.6 — Camponês com Tocha · *crawler* · `m2_torch_peasant.png`
```
[ANCHOR]
Enemy: TORCH PEASANT. An angry villager in rough clothes holding a burning torch high, face
lit orange from below, twisted with hate. Ember amber light on the torch only. ~44 px tall.
Horizontal sprite strip: walk(6), attack(4 — thrusts the torch), hurt(2), death(5 — falls,
torch rolls away and sputters). Uniform 64x64 cells.
```

#### 20.7 — Cão de Caça · *runner* · `m2_witch_hound.png`
```
[ANCHOR]
Enemy: WITCH-HUNT HOUND. A lean scarred mastiff with a spiked collar and a branded flank,
snarling, sprinting low to the ground. ~30 px tall.
Horizontal sprite strip: run(6), attack(4 — a leaping bite), hurt(2), death(5 — tumbles and
lies still). Uniform 64x64 cells.
```

#### 20.8 — Inquisidor · *atirador* · `m2_inquisitor_gunner.png`
```
[ANCHOR]
Enemy: INQUISITOR. A stern churchman in a black cassock and wide hat, holding an ornate
hand-crossbow with a silver bolt, standing to aim. Small silver cross on the chest. ~46 px tall.
Horizontal sprite strip: walk(6), attack(4 — raises and fires the crossbow), hurt(2),
death(5 — drops the weapon, crumples). Uniform 64x64 cells.
```

#### 20.9 — Flagelante · *bombista* · `m2_flagellant_bomber.png`
```
[ANCHOR]
Enemy: FLAGELLANT. A bare-chested zealot wrapped in bloody bandages, swinging a censer that
leaks holy fire, running with wild eyes. ~46 px tall.
Horizontal sprite strip: run(6), special(4 — stops, raises the censer, swells with white-gold
light about to explode), hurt(2), death(5 — bursts into a ring of pale holy fire).
Uniform 64x64 cells.
```

#### 20.10 — Pregador Fanático · *invocador* · `m2_zealot_preacher.png`
```
[ANCHOR]
Enemy: ZEALOT PREACHER. A gaunt preacher on a small wooden dais fragment, arms spread, mouth
open mid-sermon, holding a heavy bible with a chain. Stays at the back. ~48 px tall.
Horizontal sprite strip: idle-chant(6), special(4 — slams the bible down, summoning circle of
light spawning torch peasants), hurt(2), death(5 — the dais splinters, he falls).
Uniform 64x64 cells.
```

#### 20.11 — ELITE: Guardião da Pira · `m2_elite_pyre_warden.png`
```
[ANCHOR]
ELITE enemy: PYRE WARDEN. A huge executioner in a scorched leather hood and apron, dragging a
massive burning cross like a weapon, embers dripping from it. ~64 px tall, heavy silhouette.
Drops a treasure chest on death.
Horizontal sprite strip: walk(6), attack(5 — sweeps the burning cross low, trailing a wall of
fire on one frame), hurt(2), death(6 — drops the cross, the fire consumes him, collapses to
charred bone). Uniform 96x96 cells.
```

### Memória 3 — O Cerco (muralha sob ataque otomano)

#### 20.12 — Levy Otomano · *crawler* · `m3_ottoman_levy.png`
```
[ANCHOR]
Enemy: OTTOMAN LEVY. A conscript soldier in a padded coat and simple turban-helm, carrying a
short spear and a small round shield, advancing steadily. ~46 px tall.
Horizontal sprite strip: walk(6), attack(4 — a spear jab), hurt(2), death(5 — drops shield,
falls back). Uniform 64x64 cells.
```

#### 20.13 — Escudeiro Janízaro · *blindado* · `m3_janissary_shield.png`
```
[ANCHOR]
Enemy: JANISSARY SHIELDBEARER. An elite soldier in a long white cap, mail and lamellar armor,
bracing a tall rectangular tower shield, pushing forward slowly. ~50 px tall, wide silhouette.
Horizontal sprite strip: walk(6 — shield forward), attack(4 — a shield shove), hurt(2 — shield
rings), death(5 — shield drops flat, body slumps over it). Uniform 64x64 cells.
```

#### 20.14 — Arqueiro Otomano · *atirador* · `m3_ottoman_archer.png`
```
[ANCHOR]
Enemy: OTTOMAN ARCHER. A light archer in a short coat, quiver on the hip, drawing a
recurve bow with a fire-tipped arrow (ember amber on the arrowhead only). Stops to shoot.
~46 px tall.
Horizontal sprite strip: walk(6), attack(4 — draws and looses the flaming arrow), hurt(2),
death(5 — bow snaps, falls). Uniform 64x64 cells.
```

#### 20.15 — Sapador · *bombista* · `m3_sapper.png`
```
[ANCHOR]
Enemy: SAPPER. A soot-covered engineer in a leather coat, hugging a round black powder bomb
with a lit fuse, running in a reckless crouch toward the target. ~44 px tall.
Horizontal sprite strip: run(6), special(4 — skids to a stop, the fuse burns down, the bomb
glows), hurt(2), death(5 — the bomb detonates in a black-and-amber blast). Uniform 64x64 cells.
```

#### 20.16 — Cavaleiro Akinji · *corredor* · `m3_akinji_rider.png`
```
[ANCHOR]
Enemy: AKINJI RAIDER (on foot). A fast light raider in flowing cloth armor and a curved saber,
charging in long bounding strides, saber trailing. ~48 px tall.
Horizontal sprite strip: run(6), attack(4 — a running saber slash), hurt(2), death(5 — trips
mid-run, sprawls). Uniform 64x64 cells.
```

#### 20.17 — ELITE: Capitão de Bombarda · `m3_elite_bombard_captain.png`
```
[ANCHOR]
ELITE enemy: BOMBARD CAPTAIN. A broad officer in gilded lamellar armor, dragging a small
wheeled hand-cannon, plumed helm, a scarred face. ~64 px tall. Drops a treasure chest on death.
Horizontal sprite strip: walk(6), attack(5 — plants the cannon, it fires a slow heavy shot
with a muzzle-flash frame), hurt(2), death(6 — the cannon tips over, he falls against it).
Uniform 96x96 cells.
```

### Memória 4 — O Trono Partido (salão do trono rachado)

#### 20.18 — Armadura Viva · *blindado* · `m4_living_armor.png`
```
[ANCHOR]
Enemy: LIVING ARMOR. An ornate empty castle armor animated by red light in the visor slit,
long straight sword held point-down, moving with heavy deliberate steps. ~50 px tall.
Horizontal sprite strip: walk(6), attack(4 — a two-handed downward chop), hurt(2 — sparks),
death(5 — the red light dies, armor collapses hollow). Uniform 64x64 cells.
```

#### 20.19 — Morcego Gigante · *voador* · `m4_giant_bat.png`
```
[ANCHOR]
Enemy: GIANT BAT. A dog-sized bat with leathery wings, red eyes, fangs bared, seen 3/4
top-down weaving through the air. ~34 px.
Horizontal sprite strip: fly-loop(6), attack(4 — a swooping bite), hurt(2), death(5 —
crumples and drops). Uniform 64x64 cells.
```

#### 20.20 — Servo Vampiro Traidor · *corredor* · `m4_traitor_servant.png`
```
[ANCHOR]
Enemy: TRAITOR VAMPIRE SERVANT. A pale noble's attendant in fine but bloodstained clothes,
fanged, moving in fast unnatural darts, clawed hands. A small inverted sigil on the lapel
(mark of Satan's service). ~46 px tall.
Horizontal sprite strip: dash-run(6), attack(4 — a raking double claw), hurt(2), death(5 —
dissolves into black smoke). Uniform 64x64 cells.
```

#### 20.21 — Gárgula Invocadora · *invocador* · `m4_gargoyle_summoner.png`
```
[ANCHOR]
Enemy: GARGOYLE. A hunched stone gargoyle perched on a broken pillar fragment, wings folded,
mouth open. It stays put and calls bats. Cracks glow faint red. ~48 px tall.
Horizontal sprite strip: perch-idle(6), special(4 — rears back and shrieks, red sound-rings,
spawning giant bats), hurt(2 — chips of stone fly), death(5 — shatters into rubble).
Uniform 64x64 cells.
```

#### 20.22 — Espectro de Espelho · *enxame* · `m4_mirror_wraith.png`
```
[ANCHOR]
Enemy: MIRROR WRAITH. A thin translucent humanoid made of jagged shards of broken mirror and
stained glass, barely holding shape, 1-HP swarm unit. ~40 px tall.
Horizontal sprite strip: drift(4), attack(3 — lashes forward), death(3 — bursts into a spray
of glass shards). Uniform 64x64 cells. (Fewer frames on purpose — cheap swarm.)
```

#### 20.23 — ELITE: Cavaleiro Traído · `m4_elite_betrayed_knight.png`
```
[ANCHOR]
ELITE enemy: BETRAYED KNIGHT. A vampire knight in Dracula's own house colors, armor cracked,
half his face skeletal, wielding a longsword wreathed in cold blue flame. Bitter, fast for his
size. ~64 px tall. Drops a treasure chest on death.
Horizontal sprite strip: walk(6), attack(5 — a spinning blue-fire slash arc), hurt(2),
death(6 — the blue flame gutters, he kneels, crumbles to ash). Uniform 96x96 cells.
```

### Memória 5 — A Descida (escadaria ao Inferno)

#### 20.24 — Demônio Menor · *crawler* · `m5_lesser_demon.png`
```
[ANCHOR]
Enemy: LESSER DEMON. A squat red-black imp with stubby horns, clawed hands, a whipping tail,
skin like cooling lava with faint amber cracks. ~42 px tall.
Horizontal sprite strip: walk(6), attack(4 — a clawing pounce), hurt(2), death(5 — crumbles
to embers and ash). Uniform 64x64 cells.
```

#### 20.25 — Quimera Infernal · *voador* · `m5_hell_chimera.png`
```
[ANCHOR]
Enemy: HELL CHIMERA. A malformed flying beast — bat wings, a lion-ish head, a serpent tail —
charred hide with amber cracks, seen 3/4 top-down. ~40 px.
Horizontal sprite strip: fly-loop(6), attack(4 — a raking dive), hurt(2), death(5 — folds up,
burns out falling). Uniform 64x64 cells.
```

#### 20.26 — Servo do Lorde das Sombras · *blindado* · `m5_shadowlord_minion.png`
```
[ANCHOR]
Enemy: SHADOW LORD MINION. A heavy warrior of solid black shadow-stuff bound in glowing chains,
faceless but for two amber eyes, carrying a jagged obsidian greatsword. ~52 px tall.
Horizontal sprite strip: walk(6), attack(4 — a heavy horizontal cleave), hurt(2 — chains
flare), death(5 — the chains snap and it disperses into smoke). Uniform 64x64 cells.
```

#### 20.27 — Bombista de Enxofre · *bombista* · `m5_brimstone_bomber.png`
```
[ANCHOR]
Enemy: BRIMSTONE BOMBER. A bloated demon with a glowing molten core visible through its
stretched skin, waddling fast, arms out. ~46 px tall.
Horizontal sprite strip: waddle-run(6), special(4 — swells, core blindingly bright), hurt(2),
death(5 — erupts in a sulfur-yellow and amber blast). Uniform 64x64 cells.
```

#### 20.28 — Ceifador de Almas · *invocador* · `m5_soul_harvester.png`
```
[ANCHOR]
Enemy: SOUL HARVESTER. A tall robed reaper-like demon with a hooked scythe, hovering just off
the floor, a swirl of pale wailing faces around its hood. Stays at range. ~54 px tall.
Horizontal sprite strip: hover-idle(6), special(4 — sweeps the scythe, releasing pale ghost
figures that become lesser demons), hurt(2), death(5 — the robe collapses empty).
Uniform 64x64 cells.
```

#### 20.29 — Verme dos Danados · *enxame* · `m5_damned_swarmling.png`
```
[ANCHOR]
Enemy: DAMNED SWARMLING. A small crawling mass of grasping burnt hands and a single screaming
face, 1-HP swarm unit. ~34 px.
Horizontal sprite strip: crawl(4), attack(3 — grabs upward), death(3 — bursts into ash and
falling embers). Uniform 64x64 cells.
```

#### 20.30 — MINI-CHEFE: Lorde das Sombras — Senhor Daemon · `m5_miniboss_daemon_lord.png`
```
[ANCHOR]
MINI-BOSS: DAEMON LORD (a Lord of Shadow). A 3-meter winged demon of black rock and fire,
broad horns curling forward, an amber furnace glow in the chest, fists like anvils. ~110 px tall.
Horizontal sprite strip: intro(5 — unfurls wings, roars), move(6), attackA(5 — a two-fist
ground slam with a shockwave frame), attackB(5 — breathes a cone of amber fire), hurt(2),
death(6 — the chest furnace cracks and detonates, body crumbles to lava rubble).
Uniform 128x128 cells.
```

#### 20.31 — MINI-CHEFE: Lorde das Sombras — O Necromante · `m5_miniboss_necromancer.png`
```
[ANCHOR]
MINI-BOSS: THE NECROMANCER (a Lord of Shadow). A gaunt sorcerer floating in ragged black
robes, a bone crown, six skeletal spectral arms fanned behind him, a staff topped with a
red-lit skull. ~100 px tall.
Horizontal sprite strip: intro(5 — rises, arms spread), float-move(6), attackA(5 — hurls a
volley of red skull-bolts), attackB(5 — plants the staff, raising a circle of skeleton hands),
hurt(2), death(6 — the arms wither, robes fall empty, skull crown drops). Uniform 128x128 cells.
```

---

## 30 — CHEFES

> Cada chefe = 1 sheet grande. Animações: **intro(6), move(6), atkA(6), atkB(6), enraged(4),
> stagger(3), death(8)**. Célula 128×128 (Satã f2/f3 maiores — ver nota).

### 30.1 — Chefe M1: Cavaleiro Profanador · `boss_m1_profaner_knight.png`
```
[ANCHOR]
BOSS: THE PROFANER KNIGHT — a living human tomb-raider in mismatched looted armor, a lantern
on his belt, a crowbar-turned-warpick in one hand and a curved sword in the other, Dracula's
stolen signet ring glinting. Agile, arrogant. ~96 px tall.
Horizontal sprite strip: intro(6 — kicks open a crypt lid, brandishes the ring), move(6),
attackA(6 — a fast three-hit sword combo), attackB(6 — hurls the lantern, a small fire pool),
enraged(4 — drops the sword, wild two-weapon frenzy stance), stagger(3), death(8 — armor
pieces fall off, he drops the ring, collapses). Uniform 128x128 cells, consistent baseline.
```

### 30.2 — Chefe M2: Inquisidor-Mor · `boss_m2_grand_inquisitor.png`
```
[ANCHOR]
BOSS: THE GRAND INQUISITOR — a towering churchman in ornate black-and-gold vestments, a
silver mitre, an enormous censer on a chain in each hand, eyes white with fervor. Holy fire
is pale gold-white. ~104 px tall.
Horizontal sprite strip: intro(6 — raises both censers, ground lights with a cross of fire),
move(6 — slow gliding walk), attackA(6 — swings a censer in a wide arc leaving a burning
crescent), attackB(6 — slams both down, expanding rings of holy fire), enraged(4 — vestments
alight, becomes a pillar of pale fire), stagger(3), death(8 — the fire turns red, consumes
him, mitre clatters down). Uniform 128x128 cells.
```

### 30.3 — Chefe M3: Comandante Janízaro (montado) · `boss_m3_janissary_commander.png`
```
[ANCHOR]
BOSS: THE JANISSARY COMMANDER — an armored officer on a barded warhorse, tall white plume,
a long lance and a horsetail standard on his back, a heavy scimitar at the hip. The horse is
armored and wild-eyed. Combined silhouette ~120 px tall.
Horizontal sprite strip: intro(6 — the horse rears, standard unfurls), move(6 — trotting),
attackA(6 — a straight-line lance charge, motion-blur frames), attackB(6 — rears and the
horse stomps, then he raises the standard to call an infantry wave), enraged(4 — the horse is
bloodied, he discards the lance for the scimitar), stagger(3 — horse buckles), death(8 — the
horse falls, he rolls clear, staggers, drops to his knees). Uniform 160x160 cells.
```

### 30.4 — Chefe M4: O Primeiro Traído · `boss_m4_the_first_betrayed.png`
```
[ANCHOR]
BOSS: THE FIRST BETRAYED — a regal vampire lord, clearly once a peer of Dracula: tall, silver
hair, a torn royal mantle over black armor, an inverted sigil branded over his heart, long
claws, a rapier of cold blue flame. Elegant, hateful, mirror-themed. ~100 px tall.
Horizontal sprite strip: intro(6 — steps out of a tall broken mirror, two of him for a frame),
move(6 — a gliding fencer's advance), attackA(6 — a flurry of blue-fire rapier thrusts),
attackB(6 — raises a hand and casts a mirrored copy of the player's last attack back outward),
enraged(4 — the mantle burns away, claws lengthen, drops the rapier), stagger(3), death(8 —
he cracks like glass along old fracture lines and shatters, the sigil-brand glowing last).
Uniform 128x128 cells.
```

### 30.5 — Chefe Final M5 — Fase 1: Satã, o Anjo Caído · `boss_satan_p1_fallen_angel.png`
```
[ANCHOR]
FINAL BOSS phase 1: SATAN as a FALLEN ANGEL — a beautiful androgynous figure in scorched
white-gold raiment, six wings with the feathers burning at the tips, a cracked halo tilted
askew, a serene contemptuous smile, a slender sword of white light. Restrained, graceful.
~110 px tall.
Horizontal sprite strip: intro(6 — descends slowly, wings spread, halo flickers), move(6 —
hovering glide), attackA(6 — sweeping arcs of white light-blades), attackB(6 — a rain of
falling feathers that become light spears), enraged(4 — the halo breaks, two wings burn off,
smile becomes a snarl), stagger(3), death(8 — the raiment chars black, the figure buckles
forward — transition pose into phase 2). Uniform 160x160 cells.
```

### 30.6 — Chefe Final M5 — Fase 2: Satã, o Titã de Fogo · `boss_satan_p2_fire_titan.png`
```
[ANCHOR]
FINAL BOSS phase 2: SATAN as a FIRE TITAN — a hulking obsidian giant, molten amber magma
coursing through deep body cracks, jagged shoulders, ram horns, hands wreathed in flame,
the broken halo now a ring of fire orbiting one horn. Heavy, seismic. ~150 px tall.
Horizontal sprite strip: intro(6 — rises out of a lava fissure), move(6 — ground-cracking
steps), attackA(6 — a two-fist slam sending a wall of fire), attackB(6 — grabs a slab of
burning rock and hurls it), enraged(4 — the whole body flares white-amber, magma overflows
the cracks), stagger(3 — drops to one knee, crust flaking), death(8 — the crust blows apart,
a small dark true-form silhouette curls up inside the collapsing shell — transition into
phase 3). Uniform 192x192 cells.
```

### 30.7 — Chefe Final M5 — Fase 3: Satã, Forma Verdadeira · `boss_satan_p3_true_form.png`
```
[ANCHOR]
FINAL BOSS phase 3: SATAN'S TRUE FORM — a colossal deep-shadow entity, only partially lit:
vast ragged wings filling the frame, countless faint faces shifting in the dark of its body,
a crown of broken halos, eyes like distant red suns, one enormous clawed hand reaching toward
the viewer. Awe and dread. Character ~320 px, drawn as a single large piece on a 384x384
canvas, plus 3 alternate key poses on the same sheet: idle-loom, arm-sweep attack, death
(the wings fold in and the whole form implodes to a single red point).
Transparent background, no text, no UI, no watermark.
```

---

## 40 — PODERES / VFX

> Cada poder = 1 sheet com **loop(4–6)** + **impact(4)** na mesma folha (duas linhas). Célula
> 48×48, salvo indicado. Cite a paleta; VFX de sangue usa o vermelho `#B31217`.

### 40.1 — Garra (ataque básico) · `fx_claw_scratch.png`
```
[ANCHOR]
VFX only, no character. A quick three-slash claw mark in vivid blood red, slightly ragged
edges, a faint motion smear. Horizontal strip: swipe(5 frames, the slashes appear then fade) +
impact(4 — small red sparks). Uniform 48x48 cells, transparent.
```

### 40.2 — Enxame de Morcegos (orbit) · `fx_bat_swarm.png`
```
[ANCHOR]
VFX only. A small cluster of 4–5 black bats with tiny red eyes, flapping, meant to orbit the
player. Horizontal strip: flight-loop(6) + impact(4 — one bat bites, a red spark and a puff).
Uniform 48x48 cells, transparent.
```

### 40.3 — EVOLUÇÃO Nosferatu (do Enxame) · `fx_nosferatu_swarm.png`
```
[ANCHOR]
VFX only. A dense whirling vortex of dozens of black bats forming a loose humanoid shadow,
red eyes scattered through it. Horizontal strip: swirl-loop(6) + impact(4 — the shadow lunges,
a wide red bite arc). Uniform 64x64 cells, transparent.
```

### 40.4 — Forma de Névoa (rastro do dash) · `fx_mist_trail.png`
```
[ANCHOR]
VFX only. A trailing wisp of dark violet mist with a few dissolving bat shapes, for the
player's dash trail. Horizontal strip: trail-loop(6, dense to thin) + dissipate(4).
Uniform 48x48 cells, transparent.
```

### 40.5 — Chuva de Sangue (aura) · `fx_blood_rain.png`
```
[ANCHOR]
VFX only. A circular ground aura of falling fine red droplets and a faint red mist ring at the
edge, centered on the player. Horizontal strip: aura-loop(6) + tick-pulse(4 — the ring flashes
brighter as it deals damage). Uniform 96x96 cells, transparent.
```

### 40.6 — Convocar a Alcateia (lobos) · `fx_wolf_pack.png`
```
[ANCHOR]
Creature VFX: a spectral WOLF made of dark mist with red eyes and a faint red outline, seen
3/4 top-down. Horizontal strip: run-loop(6) + lunge-attack(5 — leaps and bites, red spark) +
fade-out(3 — dissolves to mist). Uniform 64x64 cells, transparent. (Engine spawns 3 of these.)
```

### 40.7 — Domínio da Noite (efeito de tela) · `fx_dominion_of_night.png`
```
[ANCHOR]
Full-screen overlay VFX, 480x270 canvas. A radial darkening vignette in deep purple-black with
drifting mist at the edges and a scatter of slow red motes, and a faint red rune ring pulsing
once at the center. Horizontal strip of 6 frames: fade-in(3) → hold(1) → pulse(2).
Mostly transparent center so gameplay stays visible. No text.
```

### 40.8 — Lança de Sangue (projétil) · `fx_blood_spear.png`
```
[ANCHOR]
VFX only. A crystallized spear of dark red blood, wet highlights, a small trailing ribbon.
Horizontal strip: travel-loop(4) + impact(5 — shatters into red droplets). Uniform 48x48 cells,
transparent.
```

### 40.9 — Correntes Carmesim (chicote/correntes) · `fx_crimson_chains.png`
```
[ANCHOR]
VFX only. A length of barbed iron chain slick with blood, whipping outward in an arc.
Horizontal strip: whip-arc(6) + impact(4 — a red burst where it bites). Uniform 64x64 cells,
transparent.
```

### 40.10 — Nova do Caixão (explosão) · `fx_coffin_nova.png`
```
[ANCHOR]
VFX only. A coffin lid slams shut at the center and a ring of red energy and bats bursts
outward. Horizontal strip: charge(3) + burst(5, expanding ring) + fade(2). Uniform 96x96 cells,
transparent.
```

### 40.11 — Guarda de Fogo-do-Inferno (chamas orbitais) · `fx_hellfire_ward.png`
```
[ANCHOR]
VFX only. Three small clawing flames of amber fire edged with black smoke, meant to orbit the
player. Horizontal strip: flame-loop(6) + impact(4 — flares and spits sparks). Uniform 48x48
cells, transparent.
```

### 40.12 — Muralha de Ossos (defensivo) · `fx_bone_wall.png`
```
[ANCHOR]
VFX only. A short arc of jagged bone and rib spikes erupting from the ground as a shield.
Horizontal strip: rise(4) + hold(2) + crumble(4). Uniform 64x64 cells, transparent.
```

### 40.13 — Pesadelo (aura de medo) · `fx_nightmare_aura.png`
```
[ANCHOR]
VFX only. A soft expanding ring of ghostly pale faces and shadow tendrils, centered on the
player, non-damaging fear aura. Horizontal strip: pulse-loop(6) + burst(4). Uniform 96x96
cells, transparent.
```

### 40.14 — Familiar Sanguíneo (gárgula invocada) · `fx_sanguine_familiar.png`
```
[ANCHOR]
Creature VFX: a small floating gargoyle carved from dark red crystal, bat wings, glowing
faintly. Horizontal strip: hover-loop(6) + spit-attack(5 — fires a small red bolt) +
fade-out(3). Uniform 48x48 cells, transparent.
```

---

## 50 — COLETÁVEIS E UI

### 50.1 — Gema de Sangue / XP · `pickup_blood_gem.png`  (3 tamanhos)
```
[ANCHOR]
Pickup item, no character. A faceted crystal gem of vivid blood red with a bright inner glint,
floating and slowly spinning. Horizontal strip: spin-loop(6). Provide THREE rows on one sheet:
small (~14 px), medium (~18 px), large (~24 px). Uniform 32x32 cells, transparent.
```

### 50.2 — Fragmento de Essência de Sangue · `pickup_blood_essence.png`
```
[ANCHOR]
Pickup item. A jagged shard of dark crystallized blood wrapped in a thin wisp of red vapor,
more sinister than the XP gem, faint pulsing glow. Horizontal strip: pulse-loop(6).
Uniform 32x32 cells, transparent.
```

### 50.3 — Coração (cura) · `pickup_heart.png`
```
[ANCHOR]
Pickup item. A small stylized anatomical heart, deep red, still faintly beating, a drip at the
bottom. Horizontal strip: beat-loop(6). Uniform 32x32 cells, transparent.
```

### 50.4 — Baú de Relíquia · `pickup_relic_chest.png`
```
[ANCHOR]
Pickup object. A small ornate iron-bound coffin-shaped chest with a red gem lock. Horizontal
strip on one sheet: closed-idle(4, gem pulsing) + open(5, lid swings up, red light and bats
pour out). Uniform 48x48 cells, transparent.
```

### 50.5 — Molduras de Carta de Poder (UI) · `ui_power_card_frames.png`
```
Dark gothic UI card frames for an upgrade screen, NOT pixel art constraint — clean vector-ish
gothic ornament, but same palette: purple-black, cold gray, blood red accent, gold hairline.
Provide THREE frames side by side on a transparent sheet: Common (plain iron border),
Rare (silver filigree, faint red glow), Evolution (blood-red border, bats in the corners,
strong glow). Each frame ~300x420, empty center (art goes in later). No text.
```

### 50.6 — Ícones de HUD · `ui_hud_icons.png`
```
[ANCHOR]
A set of small crisp HUD icons on one transparent sheet, each ~24x24, evenly spaced:
(1) heart / health, (2) hourglass / timer, (3) five-point star / level,
(4) blood-essence shard / currency, (5) speed boot, (6) skull / kills,
(7) up-arrow chevron / level-up. Blood red accent, otherwise gray. No text.
```

### 50.7 — Retículo de mira (opcional) · `ui_target_reticle.png`
```
[ANCHOR]
A subtle targeting reticle: a thin broken red ring with four short ticks, faint. Horizontal
strip: idle(4) + lock-on(3, snaps tighter). Uniform 32x32 cells, transparent. No text.
```

---

## 60 — CENÁRIOS

> Cada fase tem **3 camadas de parallax** (far, mid, near) que fazem *tiling* horizontal.
> Use este bloco-âncora **de cenário** no lugar do de personagem:

```
STYLE ANCHOR (ENVIRONMENT):
HD pixel art background in the style of a modern "Castlevania: Symphony of the Night"
remaster. ~32 color palette: purple-blacks, cold desaturated grays, moonlit steel-blue,
blood-red accents, ember amber only where fire is present. Heavy mood, dramatic lighting,
strong silhouette reading. Painted for a 3/4 top-down survivors game seen slightly from above.
The image must TILE seamlessly left-to-right (left and right edges match). No characters,
no creatures, no text, no UI, no watermark. 960x270 pixels.
```

### 60.0 — Hub: Salão do Castelo em Ruínas · `env_hub_ruined_castle.png`
```
[ENVIRONMENT ANCHOR — but do NOT tile; single wide scene, 960x540]
Interior of a ruined vampire castle great hall at night: a cracked stone floor, a shattered
throne on a dais to one side, a stone coffin on a bier to the other, a withered black tree of
thorns growing through the floor in the center (the "power tree"), a huge broken window with
cold moonlight and a distant map table lit by red candles. Dust, cobwebs, fallen banners in
Dracula's colors. Composed with three clear interaction spots (throne-map / coffin / thorn
tree). Atmospheric, still, lonely.
```

### Memória 1 — Pátio em ruínas

#### 60.1 — M1 far · `env_m1_courtyard_far.png`
```
[ENVIRONMENT ANCHOR]
Far layer: a jagged mountaintop skyline, the black towers of a broken castle against a huge
pale moon, low drifting fog, a few bats as distant specks. Very low contrast, mostly
silhouette. Seamless horizontal tile, 960x270.
```
#### 60.2 — M1 mid · `env_m1_courtyard_mid.png`
```
[ENVIRONMENT ANCHOR]
Mid layer: a ruined courtyard wall with collapsed arches, dead ivy, a leaning iron gate,
tombstones and an opened crypt, thin ground mist. Medium contrast. Seamless horizontal tile,
960x270, lower ~40% left transparent for the play field.
```
#### 60.3 — M1 near · `env_m1_courtyard_near.png`
```
[ENVIRONMENT ANCHOR]
Near/foreground layer: cracked flagstones, scattered bones, a broken statue arm, wisps of mist
crossing the bottom, a few dark grass tufts. High contrast, sharp. Mostly transparent except a
foreground strip along the bottom. Seamless horizontal tile, 960x270.
```

### Memória 2 — Vila em chamas

#### 60.4 — M2 far · `env_m2_village_far.png`
```
[ENVIRONMENT ANCHOR]
Far layer: a night sky glowing orange-red on the horizon from fires, black hills, a distant
church spire, columns of smoke. Ember amber glow low, deep blue-black above. Seamless tile,
960x270.
```
#### 60.5 — M2 mid · `env_m2_village_mid.png`
```
[ENVIRONMENT ANCHOR]
Mid layer: burning timber-framed village houses, a row of gallows with empty nooses, a well,
broken carts, firelight flickering (bake the light in). Strong amber/black contrast. Seamless
tile, 960x270, lower ~40% clear for the play field.
```
#### 60.6 — M2 near · `env_m2_village_near.png`
```
[ENVIRONMENT ANCHOR]
Near layer: scorched mud and cobbles, burning debris, a dropped torch, a torn church banner,
drifting embers along the bottom. Mostly transparent, foreground strip only. Seamless tile,
960x270.
```

### Memória 3 — Muralha sob cerco

#### 60.7 — M3 far · `env_m3_siege_far.png`
```
[ENVIRONMENT ANCHOR]
Far layer: a vast night battlefield seen from a high wall — hundreds of tiny campfires, siege
tents, a huge blood-orange moon low on the horizon, arrows as faint streaks. Seamless tile,
960x270.
```
#### 60.8 — M3 mid · `env_m3_siege_mid.png`
```
[ENVIRONMENT ANCHOR]
Mid layer: the top of a battered fortress wall — crenellations, a broken ballista, siege
ladders hooked over the edge, a battering ram's shadow, scorch marks. Seamless tile, 960x270,
lower ~40% clear for the play field.
```
#### 60.9 — M3 near · `env_m3_siege_near.png`
```
[ENVIRONMENT ANCHOR]
Near layer: cracked rampart stone, spent arrows stuck in the ground, a fallen banner (Ottoman
horsetail standard), a shattered shield, drifting smoke along the bottom. Foreground strip,
mostly transparent. Seamless tile, 960x270.
```

### Memória 4 — Salão do trono partido

#### 60.10 — M4 far · `env_m4_throne_far.png`
```
[ENVIRONMENT ANCHOR]
Far layer: the vast dark interior height of a cathedral-like throne hall, tall stained-glass
windows (one huge one cracked down the middle), moonlight beams, hanging chandeliers, bats.
Deep blue-black, jewel-tone glass. Seamless tile, 960x270.
```
#### 60.11 — M4 mid · `env_m4_throne_mid.png`
```
[ENVIRONMENT ANCHOR]
Mid layer: a colossal black throne split in two by a jagged fissure that runs across the
floor, toppled pillars, torn royal banners, a long red carpet ripped in half, standing
candelabra with red flames. Seamless tile, 960x270, lower ~40% clear for the play field.
```
#### 60.12 — M4 near · `env_m4_throne_near.png`
```
[ENVIRONMENT ANCHOR]
Near layer: polished-then-cracked black marble floor with a deep fissure, shards of stained
glass, a fallen crown, dried blood pooled in the cracks, a broken mirror leaning at the edge.
Foreground strip, mostly transparent. Seamless tile, 960x270.
```

### Memória 5 — A descida ao Inferno

#### 60.13 — M5 far · `env_m5_descent_far.png`
```
[ENVIRONMENT ANCHOR]
Far layer: an impossible abyss — inverted cathedrals and staircases hanging in a red-black
void, a distant lake of fire far below, drifting cinders, faint screaming faces in the smoke.
Amber and blood red over black. Seamless tile, 960x270.
```
#### 60.14 — M5 mid · `env_m5_descent_mid.png`
```
[ENVIRONMENT ANCHOR]
Mid layer: a colossal spiral staircase of black obsidian descending, broken railings, chained
archways, veins of glowing amber magma in the rock, hanging censers with red fire. Seamless
tile, 960x270, lower ~40% clear for the play field.
```
#### 60.15 — M5 near · `env_m5_descent_near.png`
```
[ENVIRONMENT ANCHOR]
Near layer: obsidian steps with glowing magma cracks, grasping stone hands emerging from the
edge, chains crossing the bottom, rising heat shimmer and sparks. Foreground strip, mostly
transparent. Seamless tile, 960x270.
```

---

## 70 — ILUSTRAÇÕES NARRATIVAS

> Telas estáticas (título, abertura de cada memória, final). Estilo mais **pintado/ilustrado**,
> próximo dos pôsteres — aqui a consistência entre frames não importa. 16:9, 1920x1080.

### 70.1 — Arte de título · `art_title_key_art.png`
```
Dark gothic dark-fantasy key art, painterly, cinematic, 1920x1080. A weakened DRACULA (gaunt,
pale, long graying black hair, cracked blackened plate armor, tattered high-collar cape,
sunken glowing red eyes) rising from a stone coffin in a ruined castle hall, moonlight from a
broken window behind him, a swirl of bats, dried blood on the floor forming a faint sigil.
Mood: reawakening, menace, grief. Palette: purple-black, cold gray, moonlit blue, one strong
blood-red accent. Leave clear negative space at the top for a logo. No text, no watermark.
```

### 70.2 — Abertura Memória 1 · `art_memory1_the_awakening.png`
```
Painterly gothic dark-fantasy illustration, 1920x1080. Grave robbers with lanterns fleeing a
cracked-open crypt in a fog-bound castle courtyard under a huge moon; behind them, two red
eyes opening in the dark of the crypt. Cold blue fog, lantern amber, blood-red eyes.
Mood: violation, awakening. No text, no watermark.
```

### 70.3 — Abertura Memória 2 · `art_memory2_the_pyre.png`
```
Painterly gothic dark-fantasy illustration, 1920x1080. A burning medieval village at night
seen from a rise: gallows silhouettes, a mob with torches, a church spire against fire-lit
smoke; in the foreground, Dracula's clawed hand clenching, firelight on his face, grief and
rage. Ember amber and deep blue-black, blood-red accent. No text, no watermark.
```

### 70.4 — Abertura Memória 3 · `art_memory3_the_siege.png`
```
Painterly gothic dark-fantasy illustration, 1920x1080. The top of a fortress wall during a
night siege — Ottoman campfires stretching to the horizon, siege ladders, a blood-orange moon;
Dracula stands alone on the rampart, cape snapping in the wind, facing an army. Epic,
outnumbered, defiant. No text, no watermark.
```

### 70.5 — Abertura Memória 4 · `art_memory4_the_broken_throne.png`
```
Painterly gothic dark-fantasy illustration, 1920x1080. A vast throne hall with a colossal
black throne split in half by a fissure, shattered stained glass raining down, a torn royal
mantle on the steps; a silver-haired vampire lord with an inverted sigil brand stands where
Dracula should, smiling. Betrayal, ruined majesty. Jewel-tone glass, blood-red accent.
No text, no watermark.
```

### 70.6 — Abertura Memória 5 · `art_memory5_the_descent.png`
```
Painterly gothic dark-fantasy illustration, 1920x1080. An impossible obsidian staircase
spiraling down into a red-black abyss toward a lake of fire, inverted cathedrals hanging in
the void; Dracula, now stronger — armor mended, cape whole, eyes blazing — descends alone
toward a vast shadowed winged silhouette waiting below. Amber and blood red over black.
Dread, resolve. No text, no watermark.
```

### 70.7 — Ilustração de final · `art_ending_the_reclaimed_night.png`
```
Painterly gothic dark-fantasy illustration, 1920x1080. Dracula, fully restored to power,
seated on the repaired black throne in the castle hall at night, Satan's broken halo at his
feet, bats filling the moonlit window, the withered thorn tree now in dark red bloom.
Cold, triumphant, hollow — a victory that changed nothing inside him. Palette: purple-black,
moonlit blue, deep blood-red bloom. No text, no watermark.
```

---

## Checklist de geração

- [ ] `00` âncora salva num arquivo de texto para colar sempre
- [ ] `10.1` referência do Drácula gerada e escolhida
- [ ] `10.2`–`10.8` Drácula (7 sheets)
- [ ] `20.1`–`20.5` inimigos M1 (5)
- [ ] `20.6`–`20.11` inimigos M2 (6)
- [ ] `20.12`–`20.17` inimigos M3 (6)
- [ ] `20.18`–`20.23` inimigos M4 (6)
- [ ] `20.24`–`20.31` inimigos + mini-chefes M5 (8)
- [ ] `30.1`–`30.7` chefes (7)
- [ ] `40.1`–`40.14` poderes/VFX (14)
- [ ] `50.1`–`50.7` coletáveis/UI (7)
- [ ] `60.0`–`60.15` cenários (16)
- [ ] `70.1`–`70.7` ilustrações (7)
- [ ] passo de indexação de paleta em todos os sprites
- [ ] montagem dos atlas + `frames.json`
