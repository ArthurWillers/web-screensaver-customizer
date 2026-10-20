# Web Screensaver Customizer

A customizable web screensaver based on the [Omarchy screensaver](https://omarchy.org/screensaver/) and adapted from the [omacom/omarchy-site](https://github.com/omacom/omarchy-site) repository. Enter text, choose an effect, and adjust its size right in your browser.

This project builds on work by Omarchy and its contributors. It is not an official Omarchy product and does not imply endorsement by the original authors.

## Run locally

This is a static site. It does not require npm, a build step, or an Omarchy installation.

From the project directory, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [http://localhost:8000](http://localhost:8000). Press Ctrl+C in the terminal to stop the server.

Use HTTP to load the JavaScript modules, fonts, and WebAssembly. Opening `index.html` with `file://` is not sufficient for the animated editor.

## Customize

Click **Customize**, enter up to 24 characters, and adjust the effect and size. Changes appear in the preview; **Apply** confirms the preview and closes the panel.

- Letters A–Z, numbers 0–9, and spaces are accepted.
- Lowercase letters are converted to uppercase and accents are removed, for example, `café` → `CAFE`.
- Other symbols are ignored. If the input contains no letters or numbers, a message appears and the previous artwork is preserved.
- The size adjusts to the available area to keep the text on screen.
- **Random** cycles through the available effects; a selected effect repeats.
- The system's reduced-motion preference is respected: the artwork stays static, while the text and size remain editable.

| Key | Action |
| --- | --- |
| C | Open or close customization |
| F | Enter or exit fullscreen |
| Esc | Close the panel; when the panel is closed, the browser may exit fullscreen |

The C and F keys do not interrupt typing in editable fields.

Shortcuts are visible during normal startup. In fullscreen, the button and shortcut bar are hidden; when entering fullscreen with F, the shortcut bar appears for 3.5 seconds. Press C to open the panel when needed. The pointer reappears when you move the mouse and stays visible while the panel is open.

## How the text is generated

The letters come from the **Delta Corps Priest 1** FIGfont, bundled with the [`omarchy ascii`](https://github.com/omacom/omarchy/blob/quattro/bin/omarchy-ascii) command. Text is composed as character art using the spacing from Omarchy's generator, then passed to the `ttfx` engine.

The original font does not include numbers. The **0–9** glyphs in this adaptation were designed to match the block style; they are not official Omarchy glyphs.

The canvas draws the blocks geometrically, preserving their shapes when resized. **Inter**, by Rasmus Andersson and contributors, is used for the interface and effect symbols. The font files are included in the project, with no CDN required at runtime.

## Origins and credits

- **Omarchy, David Heinemeier Hansson, and contributors:** screensaver, visual identity, and text generator. [Omarchy project](https://github.com/omacom/omarchy).
- **Omacom and site contributors:** original page, presentation, effect selection, and canvas/WebAssembly integration. [omarchy-site](https://github.com/omacom/omarchy-site).
- **37signals / omacom:** `ttfx`, a Rust port of the effects engine. [ttfx](https://github.com/omacom/ttfx).
- **ChrisBuilds:** creator of **TerminalTextEffects**, the source of the effects and animation rendering. [TerminalTextEffects](https://github.com/ChrisBuilds/terminaltexteffects).
- **CoSMiC cHiLD:** author of **Delta Corps Priest 1**. The original font also credits [patorjk's FIGFont Editor](https://patorjk.com/figfont-editor/).
- **Rasmus Andersson and contributors:** **Inter** font. [Inter](https://github.com/rsms/inter).

The `omarchy-site` snapshot was imported on **October 14, 2026**, from commit [0cc3001b9dfe8cce78bc371ead037f55b49ebf9c](https://github.com/omacom/omarchy-site/tree/0cc3001b9dfe8cce78bc371ead037f55b49ebf9c). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the origins of each group of files.

## Files

```text
index.html                         Page and controls
assets/css/                        Styles and fonts
assets/fonts/                      Inter and FIGfont glyphs
assets/js/modules/screensaver.js   Editor, shortcuts, and animation loop
assets/js/modules/omarchy-font.js  Text-to-art conversion
assets/js/modules/screensaver-picker.js
assets/js/wte/                     ttfx engine and canvas rendering
licenses/                          Preserved licenses and notices
```

## License

Original contributions to this customizer and its modifications are available under the [MIT license](LICENSE). Omarchy and ttfx retain their MIT licenses and respective copyright notices. Inter remains under the **SIL Open Font License 1.1**.

The imported **omarchy-site snapshot does not include a general license**. This project's MIT license does not grant a new license for those preserved files. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and the texts in [licenses/](licenses/) for the scope of each component.
