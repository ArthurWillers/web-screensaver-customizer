# Web Screensaver Customizer

Um screensaver web personalizável, baseado no [screensaver do Omarchy](https://omarchy.org/screensaver/) e adaptado do repositório [omacom/omarchy-site](https://github.com/omacom/omarchy-site). Digite um texto, escolha um efeito e ajuste o tamanho diretamente no navegador.

Este projeto deriva do trabalho do Omarchy e de seus colaboradores. Não é um produto oficial do Omarchy e não implica endosso dos autores originais.

## Executar localmente

É um site estático: não exige npm, compilação ou instalação do Omarchy.

Na pasta deste projeto, execute:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Abra [http://localhost:8000](http://localhost:8000). Para encerrar o servidor, pressione Ctrl+C no terminal.

Use HTTP para carregar os módulos JavaScript, as fontes e o WebAssembly. Abrir `index.html` por `file://` não é suficiente para o editor animado.

## Personalização

Clique em **Personalizar**, digite até 24 caracteres e ajuste o efeito e o tamanho. As alterações aparecem no preview; **Aplicar** confirma a visualização e fecha o painel.

- Letras A–Z, números 0–9 e espaços são aceitos.
- Letras minúsculas viram maiúsculas e acentos são convertidos, por exemplo `ação` → `ACAO`.
- Outros símbolos são ignorados. Uma entrada sem letras ou números mostra uma mensagem e preserva a arte anterior.
- O tamanho se ajusta à área disponível para evitar cortar o texto.
- **Aleatório** alterna entre os efeitos disponíveis; um efeito escolhido continua se repetindo.
- Preferência de movimento reduzido do sistema é respeitada: a arte fica estática, e o texto e o tamanho continuam editáveis.

| Tecla | Ação |
| --- | --- |
| C | Abrir ou fechar a personalização |
| F | Entrar ou sair da tela cheia |
| Esc | Fechar o painel; com o painel fechado, o navegador pode sair da tela cheia |

As teclas C e F não interrompem a digitação dentro de campos de edição.

Os atalhos ficam visíveis na abertura normal. Em tela cheia, o botão e a faixa de atalhos são ocultados; ao entrar com F, a faixa aparece por 3,5 segundos. C abre o painel quando necessário. O cursor reaparece ao mover o mouse e continua visível enquanto o painel está aberto.

## Como o texto é gerado

As letras vêm da FIGfont **Delta Corps Priest 1**, embutida no comando [`omarchy ascii`](https://github.com/omacom/omarchy/blob/quattro/bin/omarchy-ascii). O texto é composto como arte de caracteres, usando o espaçamento do gerador do Omarchy, e entregue ao motor `ttfx`.

A fonte original não inclui números. Os glifos **0–9** desta adaptação foram desenhados para acompanhar o estilo de blocos; não são glifos oficiais do Omarchy.

O canvas desenha os blocos geometricamente, preservando as formas durante o redimensionamento. A **Inter**, de Rasmus Andersson e colaboradores, é usada na interface e nos símbolos dos efeitos. Os arquivos da fonte estão incluídos no projeto, sem CDN durante o uso.

## Origem e créditos

- **Omarchy, David Heinemeier Hansson e colaboradores:** screensaver, identidade visual e gerador de texto. [Projeto Omarchy](https://github.com/omacom/omarchy).
- **Omacom e colaboradores do site:** página original, apresentação, seleção de efeitos e integração com canvas/WebAssembly. [omarchy-site](https://github.com/omacom/omarchy-site).
- **37signals / omacom:** `ttfx`, port para Rust do motor de efeitos. [ttfx](https://github.com/omacom/ttfx).
- **ChrisBuilds:** criador de **TerminalTextEffects**, de onde vêm os efeitos e o desenho das animações. [TerminalTextEffects](https://github.com/ChrisBuilds/terminaltexteffects).
- **CoSMiC cHiLD:** autor de **Delta Corps Priest 1**. A fonte original também registra o [FIGFont Editor de patorjk](https://patorjk.com/figfont-editor/).
- **Rasmus Andersson e colaboradores:** fonte **Inter**. [Inter](https://github.com/rsms/inter).

A extração de `omarchy-site` foi feita em **14 de outubro de 2026**, a partir do commit [0cc3001b9dfe8cce78bc371ead037f55b49ebf9c](https://github.com/omacom/omarchy-site/tree/0cc3001b9dfe8cce78bc371ead037f55b49ebf9c). A origem de cada grupo de arquivos está em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Arquivos

```text
index.html                         Página e controles
assets/css/                        Estilos e fontes
assets/fonts/                      Inter e FIGfont com os glifos
assets/js/modules/screensaver.js   Editor, atalhos e ciclo de animação
assets/js/modules/omarchy-font.js  Conversão de texto em arte
assets/js/modules/screensaver-picker.js
assets/js/wte/                     Motor ttfx e desenho no canvas
licenses/                         Licenças e avisos preservados
```

## Licença

As contribuições originais deste personalizador e suas modificações são disponibilizadas sob a [licença MIT](LICENSE). Omarchy e ttfx preservam suas licenças MIT e os respectivos avisos de autoria. A Inter permanece sob **SIL Open Font License 1.1**.

A revisão importada de **omarchy-site não contém uma licença geral declarada**. A MIT deste projeto não concede uma nova licença para esses arquivos preservados. Consulte [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) e os textos em [licenses/](licenses/) para o escopo de cada componente.
