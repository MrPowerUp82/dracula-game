# Status de implementação — 2026-09-04

## Concluído nesta iteração

### Chefes

- `BossSystem` permanece integrado à ordem fixa da `RunScene`, mas a materialização dos golpes foi extraída para `systems/bosses/BossAttackExecutor.ts`.
- Fases declarativas agora possuem nome, estratégia de movimento, distância preferida, janela de transição e lista de ataques.
- Todos os cinco chefes têm repertórios identificáveis em vez de apenas variações de HP.
- Ataques disponíveis: anel, rajada direcionada, investida, nova, meteoros de área e invocação.
- Ataques fortes criam telegraph de círculo ou linha e não movem/não causam dano antes do aviso terminar.
- Trocas de fase limpam projéteis do padrão anterior e concedem uma janela curta de invulnerabilidade.
- A arena é limpa de inimigos comuns e projéteis hostis ao iniciar o chefe.
- Poderes de projétil do jogador agora elegem o chefe como alvo quando não há inimigos mais próximos.

### Satã — três fases funcionais

1. **Anjo Caído:** orbita à distância e alterna rajadas direcionadas com anéis de projéteis.
2. **Titã de Fogo:** aproxima-se, usa investidas, crateras/meteoros e invoca blindados.
3. **Forma Verdadeira:** ancora-se na arena e combina anéis densos, meteoros, nova ampla e enxames.

As transições têm pausa legível, invulnerabilidade, flash no sprite, screen shake leve e identificação no HUD. A morte emite `boss:died` e mantém a vitória/progressão existentes.

### HUD e game feel

- Barra de chefe corrigida e centralizada.
- HUD mostra nome do chefe, número/nome da fase e estado de transformação.
- Telegraphs pulsantes são desenhados por um único `Graphics`, sem criar objetos Phaser por frame.
- Screen shake leve em dano, mudança de fase e morte do chefe, respeitando a configuração do save.
- Bombistas também avisam a explosão antes de ativar a hitbox.

### Inimigos e dificuldade

- Os nove arquétipos continuam ativos.
- Runner alterna corrida e recuperação; brute tem passo pesado com preparação/avanço; elite persegue em arco; swarm usa ondulação curta própria; flyer mantém trajetória aérea ampla.
- Atirador continua fazendo kite/disparo, bombista aproxima/telegrapha/explode e invocador controla espaço por lacaios.
- Timelines foram corrigidas: as ondas finais agora acontecem antes do chefe.
- Scaling combina budget, composição, cadência, chance de elite, vida, dano e velocidade com multiplicadores modestos e legíveis.
- Tetos rígidos dos pools permanecem inalterados (350 inimigos, 1000 ataques, 800 pickups).

### Assets e M3–M5

- Fallbacks de intro, parallax e sprites foram centralizados em `data/memoryVisuals.ts`.
- Nenhum nome de asset inexistente foi adicionado.
- URLs incorretas dos cenários (`-` versus `_`) foram corrigidas.
- Artes JPG fora de `public/` agora usam URLs importadas pelo Vite e entram no build de produção.
- Camadas M1 mid/near passam pelo chroma-key de `tools/process-sprites.mjs`; o xadrez do gerador deixou de aparecer em jogo.
- Escala das texturas de parallax foi normalizada para a altura lógica da tela.
- Ferramentas de desenvolvimento atualizadas para Vite 6.4.3 e Vitest 3.2.6, eliminando os advisories conhecidos sem alterar o runtime Phaser.

## Bugs encontrados e corrigidos

- Parallax ficava escondido atrás da grade opaca por ordem incorreta de depth.
- Cenários processados eram requisitados com caminhos inexistentes.
- JPGs funcionavam no dev server, mas não eram garantidos no `dist`.
- Lança de Sangue e outros projéteis deixavam de disparar durante boss sem inimigos comuns.
- Testes antigos divergiam do HP atual do runner e do fallback visual real de Satã.
- Listeners/pools da run agora são limpos explicitamente no shutdown da Scene.
- Seleção do alvo mais próximo deixou de criar array temporário a cada disparo.

## Validação executada

- `npm run sprites`: concluído; manifest regenerado e camadas M1 processadas.
- `npm run typecheck`: concluído sem erros.
- `npm test -- --run`: **53 arquivos, 198 testes aprovados**.
- `npm run build`: concluído; Vite gerou o bundle de produção.
- `npm audit`: **0 vulnerabilidades** após atualização das ferramentas de desenvolvimento.
- Verificação manual no navegador: Title → Hub → MemoryIntro → Run, assets, parallax, HUD e spawn do chefe confirmados.
- `git diff --check`: sem erros de whitespace (apenas aviso esperado de conversão LF/CRLF no Windows).
- Observação: o Vite ainda avisa que o chunk principal minificado passa de 500 kB; é uma otimização futura, não uma falha de build.

## Parcialmente concluído

- Game feel inclui telegraph, feedback de fase, shake e feedback do Drácula; hit flash/números de dano por inimigo ainda não foram adicionados.
- O sistema de chefes está data-driven e genérico, porém o balanceamento fino de cooldown/dano ainda depende de playtest humano completo das cinco lutas.
- A forma vertical/plataforma da arena de Satã descrita no design não foi implementada: o jogo atual usa movimentação top-down e uma mudança estrutural de plataforma exigiria escopo próprio.

## Dependente de novos assets

- M3, M4 e M5 ainda não possuem cenários, inimigos e bosses dedicados.
- Comandante Janízaro usa `elite-pyre-warden`; Primeiro Traído usa `boss-m2`; Satã usa `boss-m1` ampliado.
- Os fallbacks permanecem funcionais e estão documentados/centralizados até que a arte passe pelo pipeline e pelo `manifest.json`.

## Pendente / próximo passo recomendado

- Gerar e processar os assets dedicados de M3–M5, principalmente as três formas de Satã e VFX de fogo/meteoro.
- Fazer playtest manual completo das cinco memórias para calibrar dano, cooldown, duração das ondas e tempo disponível após o spawn do chefe.
- Adicionar opções visuais já previstas no design para flash/números de dano e medir frame time com 350 inimigos + 1000 projéteis antes de introduzir qualquer pool visual adicional.
