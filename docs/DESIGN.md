# Drácula: Memórias de Sangue — Documento de Design

> Survivors-like em web. Protagonista: Drácula enfraquecido que recupera seus poderes
> ao subir de nível e ao concluir "memórias". Referências: **Castlevania (Netflix)** e
> **Drácula: A História Nunca Contada (2014)**. Chefe final: **Satã** (tom de *Lords of Shadow 2*).

- **Status:** design validado (brainstorming concluído). Pronto para plano de implementação.
- **Data:** 2026-09-03
- **Autor:** webpaes2012@gmail.com (dev solo) + facilitação de design (Claude)
- **Documento irmão:** [`PROMPTS_GEMINI.md`](PROMPTS_GEMINI.md) — biblioteca completa de prompts de arte.

---

## 1. Resumo do entendimento

- **O que é:** um *survivors-like* (estilo Vampire Survivors) em web, com o Drácula
  enfraquecido como protagonista, que recupera poderes ao subir de nível e ao concluir fases.
- **Por que existe:** jogo indie pequeno e **completo**, homenageando as duas referências,
  com identidade própria no gancho "relembrar poderes". Escopo terminável por um dev solo.
- **Para quem:** jogador solo de PC fã de survivors-likes e do universo Drácula/Castlevania.
- **Loop central:** hub (castelo em ruínas) → escolhe uma memória → sobrevive ~8–10 min a
  hordas crescentes escolhendo poderes temporários a cada nível → mata o chefe da memória →
  ganha **1 poder permanente roteirizado** + essência de sangue → gasta essência no hub
  (atributos base + ampliar sorteio de poderes) → próxima memória.
- **Arco:** Drácula desperta fraco séculos depois; alguém profanou seu descanso. As memórias
  (misturando os dois cânones) o reconstroem até o confronto final contra **Satã**, alvo da vingança.
- **Arte:** pixel art HD (~48–64px/personagem), estilo "SotN moderno" — silhueta do filme
  (armadura, capa esfarrapada), cor e drama da série, destaque **vermelho-sangue**.

## 2. Suposições assumidas

1. Stack: **Phaser 3 + TypeScript**, build web estática (deploy itch.io / GitHub Pages).
2. **5 fases:** 4 memórias jogáveis + a descida final (Satã).
3. 60 FPS com ~250–350 entidades na tela; desktop; **sem mobile**; sem online; sem backend.
4. Save só de meta-progressão em `localStorage`, com versão de formato e migração.
5. Textos do jogo em **português**, com estrutura pronta para i18n (inglês depois).
6. Sem dependências de runtime além do Phaser; código simples, tipado e comentado.
7. **Ataque automático** (estilo VS); único poder manual é o dash (Forma de Névoa).
8. Arte gerada por **Gemini**, a partir da biblioteca de prompts deste projeto.

## 3. Não-goals (fora de escopo nesta versão)

- Multiplayer, ranking online, contas, nuvem.
- Mobile/touch (o layout não pode quebrar, mas não é alvo).
- Editor de fases, modding, Steam Workshop.
- Dublagem; narrativa é por texto + ilustrações estáticas.
- Mais de 5 memórias, modo endless, NG+ (podem vir depois, o design não impede).

## 4. Requisitos não-funcionais

| Área | Requisito |
|---|---|
| Performance | 60 FPS com teto rígido de **350** inimigos + ~1000 projéteis; sem crescimento de array em runtime (pools). |
| Navegadores | Últimas versões de Chrome, Firefox, Edge (desktop). Fallback Canvas se não houver WebGL. |
| Save | `localStorage`, chave `dracula.save.v1`; escrita com debounce + flush em `visibilitychange`; nunca corromper (backup do cru em falha). |
| Escala | 1 jogador, offline, sem servidor. |
| Acessibilidade | Toggles: screen shake, números de dano, flashes; volume separado música/SFX. |
| Manutenção | Dev solo; `tsc --noEmit` + `vitest` + `vite build` no CI a cada push. |
| Build/Deploy | Vite → site estático; assets versionados por hash. |
| Idioma | pt-BR embutido; strings isoladas em `data/i18n/pt.ts`. |

---

## 5. Design final

### 5.1 Arquitetura de alto nível

**Cenas Phaser:**

| Cena | Papel |
|---|---|
| `BootScene` | Config, detecção de save, atlas base. |
| `PreloadScene` | Carrega spritesheets/áudio com barra de progresso; tela de erro com retry. |
| `HubScene` | Castelo em ruínas: tela **interativa** — anda com o Drácula até o mapa (memórias), o caixão (revive) e a árvore de poder (meta-upgrades). |
| `RunScene` | A partida (memória selecionada). Instancia e roda os sistemas. |
| `HUDScene` | Sobreposta à `RunScene`, em resolução nativa: vida, XP, timer, ícones de poder. |
| `UpgradeScene` | Overlay modal no level up: 3 cartas de poder; pausa a `RunScene`; fila para level ups em cadeia. |
| `GameOverScene` / `VictoryScene` | Resultado, essência ganha, retorno ao hub. |

**Sistemas na `RunScene`** (classes simples; ordem fixa por frame):
`SpawnDirector → InputSystem → MovementSystem → PowerSystem → CombatSystem → PickupSystem → StatSystem → EnemyAISystem → CameraSystem → CleanupSystem`.

**Comunicação:** `EventBus` interno da run (`enemy:died`, `player:levelup`, `stats:dirty`, `boss:phase`, …). Sistemas nunca se referenciam diretamente → cada um é testável isolado.

**Estrutura de pastas:**
```
src/
  main.ts            // config Phaser, registro de cenas
  scenes/
  systems/
  entities/          // Player, Enemy, Boss, Projectile, Pickup — todos Phaser.Sprite
  data/              // powers.ts, enemies.ts, memories.ts, meta.ts, i18n/
  core/              // Pool, EventBus, SaveManager, RNG (com seed)
  ui/                // HUD, cartas de upgrade, menus
```

### 5.2 Modelo de entidades

Todo ator visível é `Phaser.Physics.Arcade.Sprite` com spritesheet animado — **sem placeholders geométricos**.

| Entidade | Instâncias | Notas |
|---|---|---|
| `Player` (Drácula) | 1 | guarda `stats` e `activePowers` (máx. 6 + evoluções). |
| `Enemy` | pool ~500 | `hp, speed, contactDamage, xpValue, defId`; comportamento vem de `defId` (dados), não de subclasse. |
| `Boss` | 1 por memória | classe própria; máquina de estados `intro → phase1 → phase2 → enraged → death`. |
| `Projectile` | pool ~1000 | `ownerPower, damage, pierce, speed, lifespan`. |
| `Pickup` | pool ~800 | `xpGem`, `bloodEssence`, `heart`, `relic`. |

### 5.3 Atributos base (`StatSystem`)

`maxHp, hpRegen, moveSpeed, might (dano %), area %, projectileSpeed %, cooldown %, amount (+projéteis), pickupRadius, armor, luck, xpGain %, revives`.

Valor final = `base` (meta-progressão) × modificadores da run (poderes, relíquias).
Recalcula só no evento `stats:dirty`. Clamps (ex.: `cooldown` nunca abaixo de 10%).
Ordem de aplicação: **aditivos antes de multiplicativos**.

### 5.4 Poderes orientados a dados (`PowerSystem`)

Definição em `data/powers.ts`:
```ts
{
  id: 'bat-swarm',
  name: 'Enxame de Morcegos',
  maxLevel: 8,
  tags: ['invocação', 'físico'],
  behavior: 'orbit' | 'projectile' | 'aura' | 'summon' | 'onHit' | 'passive',
  levelStats: [ { damage, amount, cooldown, area }, /* ... por nível */ ],
  onEquip?(ctx), onLevelUp?(ctx)
}
```
O `PowerSystem` só lê a tabela, cria/atualiza efeitos e dispara projéteis/auras via pools.
**Sinergias/evoluções** são regras declarativas
(ex.: `tem 'mist-form' + 'bat-swarm' nível ≥ 5 → evolução 'Nosferatu'`).
Adicionar poder = 1 objeto no array + seus sprites. Zero mudança de arquitetura.

### 5.5 Progressão — números

**Level up (dentro da partida):**
- XP por gema: comum **1**, elite **5**, mini-horda **10**.
- Curva: `xpParaProximo = 5 + nivel*4 + floor(nivel/10)*20` (ajustável em playtest).
- A cada nível: 3 cartas do **pool ativo** (poder novo se < 6 poderes, ou +1 nível de existente).
  `luck` aumenta chance de rara/evolução.
- **Reroll:** 1 grátis por memória + compráveis por essência.
- Máx. **6 poderes ativos** + evoluções. Baú de elite = upgrade garantido.

**Poder permanente da memória (roteirizado):** vencer concede 1 poder fixo (nível 1) que passa
a **começar equipado** em toda run futura.

| Memória | Cenário | Poder recuperado |
|---|---|---|
| 1 – O Despertar | pátio do castelo em ruínas, névoa, luar | **Forma de Névoa** — dash curto que atravessa inimigos + i-frames |
| 2 – A Fogueira | vila queimando à noite, forcas | **Chuva de Sangue** — aura de dano que cura % do dano causado |
| 3 – O Cerco | muralha sob ataque otomano | **Convocar a Alcateia** — 3 lobos que perseguem alvos |
| 4 – O Trono Partido | salão do trono rachado ao meio | **Domínio da Noite** — escurece a tela, lentidão global, +área nos seus poderes |
| 5 – A Descida | escadaria infinita ao Inferno | *(sem poder — confronto final)* |

**Meta-progressão (hub, gasta Essência de Sangue):**
- **Atributos base:** 10 trilhas (vida, dano, cooldown, velocidade, regen, raio de coleta,
  sorte, ganho de XP, armadura, +1 projétil), 5 níveis cada, custo crescente.
- **Ampliar o sorteio:** cada poder do pool temporário começa **bloqueado**; desbloqueia por
  essência ou achando sua **relíquia** numa run ("relembrar quais poderes existem").
- **Caixão:** +1 revive permanente (caro).

**Economia:** memória completa ≈ **100–180** essência; morrer paga ~**40%** do acumulado da run.
Zerar todas as trilhas ≈ **12–16** runs.

### 5.6 As 5 memórias — conteúdo

| # | Cenário | Inimigos (arquétipos) | Chefe |
|---|---|---|---|
| 1 | Pátio em ruínas, névoa, luar azulado | aldeão amaldiçoado, corvo, servo erguido, esqueleto de cripta | **Cavaleiro Profanador** — o saqueador que violou a cripta; investidas rápidas |
| 2 | Vila em chamas, forcas, brasa laranja | camponês com tocha, cão de caça, inquisidor (atirador), flagelante (bombista), pregador (invocador) | **Inquisidor-Mor** — círculos de fogo sagrado, área negada |
| 3 | Muralha sob cerco otomano, aríetes, flechas incendiárias | levy otomano, escudeiro janízaro (blindado), arqueiro, sapador (bombista), akinji (corredor) | **Comandante Janízaro** montado — carga em linha reta, invoca ondas de infantaria |
| 4 | Salão do trono rachado ao meio, vitrais estilhaçados | armadura viva, morcego gigante, servo vampiro traidor, gárgula invocadora, espectro de espelho (enxame) | **O Primeiro Traído** — vampiro nobre a serviço do Satã; reflete seus poderes |
| 5 | Escadaria infinita ao Inferno, obsidiana e fogo, geometria impossível | demônio menor, quimera infernal, servo do Lorde das Sombras (blindado), bombista de enxofre, ceifador de almas, verme dos danados (enxame); **Lordes das Sombras** como mini-chefes | **SATÃ** — 3 fases (anjo caído → titã de fogo → forma verdadeira gigante); arena com plataforma vertical |

### 5.7 Roster de inimigos — arquétipos

| Arquétipo | Papel | Comportamento |
|---|---|---|
| Rastejante | carne de canhão | anda reto até o Drácula |
| Corredor | pressão | rápido, HP baixo, em ondas |
| Blindado | tanque | lento, muito HP, empurra |
| Atirador | zona | para à distância, projétil lento |
| Bombista | anti-turtle | corre e explode em área |
| Voador | ignora terreno | trajetória senoide |
| Invocador | prioridade | fica atrás e cospe Rastejantes |
| Elite | mini-evento | 5–10× HP, dropa baú (upgrade garantido) |
| Enxame | trash farm | grupos de 20–40, 1 HP, muito XP |

Cada memória mapeia arquétipo → sprite (reskin). Ver [`PROMPTS_GEMINI.md`](PROMPTS_GEMINI.md) §20.

### 5.8 Spawn Director

Timeline de dados por memória (`memories.ts`):
```ts
{ tMin: 0, budget: 3,  pool:['crawler'] }
{ tMin: 2, budget: 6,  pool:['crawler','runner'], elite: 1 }
{ tMin: 4, budget: 10, pool:['crawler','runner','shooter'], swarmEvent:'a cada 45s' }
{ tMin: 7, budget: 16, pool:['crawler','runner','shooter','bomber','flyer'], elite: 2 }
{ tMin: 9, budget: 0,  bossCue: true }
```
- `budget` = custo de inimigos vivos que ele tenta manter (cada arquétipo tem custo).
- Spawn em anel fora da tela; **teto rígido 350**.
- Eventos: **maré** (parede de um lado), **caçada** (2–3 elites juntos), **eclipse** (30s sem spawn).
- **RNG com seed** por run, registrada no resultado → bug reproduzível + base para "seed do dia".

### 5.9 Controles, câmera, game feel

**Controles (desktop):**
- Movimento: **WASD / setas** (única entrada direta).
- Ataques **automáticos**; cada poder tem cooldown e mira própria (mais próximo / direção / aleatório).
- **Espaço:** dash (Forma de Névoa), quando desbloqueado — único poder manual.
- **P / Esc:** pausa · **Tab:** stats detalhados · **R:** reroll na `UpgradeScene`.
- **Gamepad** via API do navegador (analógico esq. + botão sul = dash) — *nice-to-have*, não bloqueia entrega.

**Câmera:**
- Segue o Drácula com lerp ~0.1 + *lookahead* na direção do movimento.
- Mundo lógico ~**480×270**, escala **inteira** para a janela; HUD em resolução nativa.
- Screen shake curto: dano recebido, morte de elite, impacto de chefe (com toggle).

**Game feel (barato, alto impacto):**
- Hit stop 40–60 ms em elite/chefe.
- Flash branco de 1 frame no alvo + número de dano flutuante (toggle).
- Knockback leve em não-blindados.
- Gemas de XP com atração magnética ao entrar no `pickupRadius`.
- Level up: congela 0,5 s, clarão vermelho, som grave, abre as cartas.
- Morte do Drácula: `timeScale` 0,3, ele se desfaz em pó/morcegos.

### 5.10 Save, erros e casos de borda

**Save (`localStorage`, `dracula.save.v1`):**
```jsonc
{
  "version": 1,
  "essence": 0,
  "baseStats": { "maxHp": 0, "might": 0, "cooldown": 0, "moveSpeed": 0, "hpRegen": 0,
                 "pickupRadius": 0, "luck": 0, "xpGain": 0, "armor": 0, "amount": 0 },
  "unlockedPowers": ["bat-swarm"],
  "memoriesCleared": [],
  "permanentPowers": [],
  "coffinRevives": 0,
  "settings": { "screenShake": true, "damageNumbers": true, "lang": "pt",
                "volume": { "music": 0.7, "sfx": 0.8 } },
  "stats": { "runs": 0, "kills": 0, "bestTimeByMemory": {} }
}
```

**Erros:**
- `SaveManager` lê em `try/catch`. Save corrompido/ausente → **novo jogo**, backup do cru em
  `dracula.save.corrupt`, aviso discreto no hub.
- **Migração** `migrate(save)` por passos `v1→v2→…`; nunca ler campo sem default.
- Escrita: debounce 500 ms + flush ao sair de run/hub e no `visibilitychange`.
  `localStorage` indisponível (modo privado/quota) → banner "progresso não será salvo", jogo segue.
- Falha de asset no preload → tela de erro + "tentar de novo" (não trava em preto).
- Sem WebGL → renderer Canvas do Phaser automaticamente.

**Casos de borda:**
- Aba em segundo plano: `rAF` congela; ao voltar, clamp do delta em 100 ms. Pausa automática opcional.
- Level ups em cadeia: fila de `UpgradeScene`, uma carta por vez.
- Morte com revive disponível / durante animação de chefe: processa o revive antes do game over.
- Pool esgotado: não spawna (array nunca cresce); `budget` previne, o teto é rígido.
- Redimensionar janela: `Scale.RESIZE` no HUD; escala inteira no mundo; nunca meio-pixel.
- Carta de poder no nível máximo: filtrada; pool esgotado → oferece cura/essência.

### 5.11 Estratégia de testes

**Ferramenta:** **Vitest** (TS puro, sem navegador). Testa a lógica, não o Phaser.

- **Unidade:** `StatSystem` (ordem aditivo→multiplicativo, clamps, `stats:dirty`);
  `PowerSystem` (level up aplica `levelStats[n]`, evoluções só com pré-requisito, nível máximo trava);
  curva de XP e fila de level ups; `SaveManager` (round-trip, `migrate`, corrompido→novo+backup,
  default de campo ausente); economia (custos monótonos, morte paga ~40%);
  `RNG` com seed (mesma seed → mesma sequência); `SpawnDirector` (budget/pool esperado por `t`, teto 350).
- **Integração (headless):** `RunScene` "fake" sem render, N frames com input roteirizado —
  "10 min sem tomar dano → chega no chefe", "parado no canto → morre de contato",
  "spam de um poder → evolução". **Orçamento de performance:** 350 inimigos + 800 projéteis por
  2000 frames; nenhum array de pool cresce; média de `update` sob limite.
- **Manual (checklist):** feel, shake, áudio, resize, gamepad, os 5 chefes até a morte,
  fluxo hub↔run↔game over.
- **CI:** GitHub Actions — `tsc --noEmit` + `vitest` + `vite build` a cada push.

### 5.12 Pipeline de arte (resumo)

Detalhes e prompts em [`PROMPTS_GEMINI.md`](PROMPTS_GEMINI.md).

- Pixel art HD. Comum ≈ **48px** alt.; elite ≈ **64px**; chefe ≈ **96–160px**; Satã f3 ≈ **320px**.
- Spritesheet: grade fixa por entidade, frames na horizontal, 1 animação por linha, **PNG RGBA**
  (fundo transparente). Célula padrão 64×64 (comuns), 128×128 (chefes). Pivô centro-base.
  `frames.json` por sheet.
- **Paleta travada** ~32 cores: pretos-arroxeados, cinzas frios, pele pálida,
  **vermelho-sangue `#B31217`** como destaque, âmbar de fogo (M2/M5). Todo prompt cita a paleta.
- Consistência no Gemini: **bloco-âncora de estilo** fixo em todo prompt; gerar a folha do
  Drácula primeiro e reusar como imagem de referência; 1 prompt = 1 entidade/1 sheet;
  cenários em camadas de parallax separadas.
- Inventário ≈ **90 prompts**, agrupados: `00 Âncora`, `10 Drácula`, `20 Inimigos`,
  `30 Chefes`, `40 Poderes/VFX`, `50 Coletáveis/UI`, `60 Cenários`, `70 Ilustrações narrativas`.

---

## 6. Decision Log

| # | Decisão | Alternativas consideradas | Por quê |
|---|---|---|---|
| 1 | Escopo: jogo completo pequeno (5 fases, meta-progressão) | protótipo curto; projeto de aprendizado; base comercial | Ambição terminável para dev solo; entrega um jogo "de verdade" sem virar projeto infinito. |
| 2 | Stack: Phaser 3 + TypeScript, web estática | Canvas/JS puro; Godot 4; Unity/LÖVE | Engine resolve pooling/colisão/render de centenas de entidades; TS segura a complexidade; web = compartilhável por link e publicável de graça. Decisão delegada ao facilitador. |
| 3 | Progressão híbrida: sorteio temporário na run + meta essência + poder permanente roteirizado por memória | só na run (VS puro); só meta; só narrativo por fase | Combina build-craft de cada partida com sensação de crescimento permanente e com a fantasia narrativa de "relembrar" poderes. |
| 4 | Fases cronometradas de ~8–10 min, chefe no fim | sobrevivência longa 15–20 min; por objetivo; misto | Ritmo intenso, "jogo de bolso", sessões curtas; chefe fecha a memória. |
| 5 | Arte: pixel art HD "SotN moderno" | 2D pintado (série); vetor flat; pintado realista (pôster do filme) | Consistência viável no Gemini, fácil de animar e barato para performance; funde silhueta do filme com cor/drama da série. |
| 6 | Narrativa original: Drácula desperta fraco no castelo em ruínas; memórias fundem os dois cânones | seguir só o filme; seguir só a série; usar cânones como conteúdo de uma moldura | Liberdade criativa + homenageia as duas referências sem ficar preso a um roteiro alheio. |
| 7 | Motivação: vingança; chefe final = **Satã** (tom *Lords of Shadow 2*) | vingança contra um Belmont/igreja; reerguer-se sem inimigo; redenção sombria | Antagonista com peso mitológico e ligação direta ao cânone Castlevania; dá clímax de 3 fases. |
| 8 | Arquitetura híbrida: Phaser (pools/colisão/render) + sistemas data-driven para poderes/atributos | OOP puro (tudo estende Sprite); ECS-lite completo | Performance onde importa sem a infra de um ECS; evita a teia de herança do OOP puro no sistema de builds. YAGNI. |
| 9 | Todo ator visível é sprite Phaser animado (inclui jogador, inimigos, chefes) | formas geométricas/placeholder para prototipar | Requisito explícito do dev; o data-driven governa só lógica, nunca o visual. |
| 10 | 5 fases = 4 memórias jogáveis + descida final | 3 fases; 5–6 memórias + endless | Cobre um arco completo (despertar → traição → vingança) dentro do escopo de bolso. |
| 11 | Save: `localStorage` versionado, só meta-progressão | save da run no meio; IndexedDB; sem save | Simples, offline, suficiente; partida curta não precisa de save intermediário. |
| 12 | Testes: Vitest na lógica pura + integração headless + checklist manual | testes E2E no navegador (Playwright); sem testes | Barato e rápido para dev solo; o valor está na lógica de stats/poderes/save/economia. |
| 13 | Arte gerada por Gemini via biblioteca de prompts com bloco-âncora + reuso de imagem de referência | contratar artista; asset packs prontos; gerar sem padronização | Custo zero, controle do dev; o bloco-âncora e o reuso de referência mitigam a variância entre gerações. |

## 7. Riscos conhecidos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Gemini gera sprites inconsistentes entre si (paleta, escala, estilo) | alto — quebra a coesão visual | Bloco-âncora fixo; gerar Drácula primeiro e reusar como referência; pós-processar paleta (indexar às ~32 cores) num passo de pipeline; revisar sheet a sheet. |
| Spritesheets do Gemini sem grade/tamanho de frame consistente | médio — trabalho manual de recorte | Pedir frames isolados quando necessário e montar o atlas com ferramenta (TexturePacker/free); `frames.json` como fonte da verdade. |
| Queda de FPS com 350 inimigos + milhares de projéteis | alto | Pools com teto rígido; Arcade Physics (não Matter); culling fora da tela; teste de orçamento de performance no CI. |
| Escopo de 5 memórias + ~90 assets estoura o tempo do dev solo | médio | Arquétipos reskináveis; poderes data-driven; cortar M4 ou reduzir VFX se necessário — o design permite. |
| Balanceamento (curva de XP, economia de essência) sai errado | médio | Números centralizados em `data/`; seed de RNG para repro; playtests com telemetria local. |
| Direitos: "Castlevania", "Belmont", "Drácula Untold" são marcas | baixo/médio (projeto pessoal) | Usar nomes próprios do projeto ("Memórias de Sangue", "O Primeiro Traído"); referências como inspiração de estilo, não cópia de assets; não usar logos/nomes de marca no título nem na loja. |

## 8. Próximos passos

1. **Gerar a arte:** seguir [`PROMPTS_GEMINI.md`](PROMPTS_GEMINI.md) na ordem (âncora → Drácula → resto).
2. **Plano de implementação:** quebrar o design em milestones (esqueleto de cenas → 1 memória
   jogável ponta a ponta → sistemas de poder → meta-progressão → 5 memórias → chefe final → polish).
3. **Setup do repo:** Vite + Phaser 3 + TS + Vitest + GitHub Actions.

> Como o design é de médio impacto e baixo risco (projeto pessoal, sem dados sensíveis, sem
> requisito de alta confiança), **não** foi acionado o handoff obrigatório para
> `multi-agent-brainstorming`. Se quiser uma revisão adversarial mesmo assim, é opcional.
