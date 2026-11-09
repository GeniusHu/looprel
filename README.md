# Looprel — Photo to Crochet & Cross Stitch Chart Generator

> **Online**: [looprel.com](https://looprel.com) — free, no sign-up, runs entirely in your browser.

Turn any photo into a printable crochet chart (C2C, tapestry, or filet), a cross stitch symbol chart, or a scannable embroidery QR code — with row numbers, color legends, and stitch counts.

## Why it's different

- **Zero upload** — your photos are processed entirely in your browser (Canvas API), never sent to a server
- **No sign-up** — open the page, upload, print
- **Three crochet styles** — C2C (corner-to-corner), tapestry (row-by-row), and filet (two-block)
- **Cross stitch symbol charts** — every color gets its own symbol for easy counting
- **QR code patterns** — generate a scannable QR code as a stitchable grid with error-correction H

## How it works

```
Photo → Canvas sampling → Color quantization (weighted nearest-match to yarn palette) → Grid rendering → Print
```

The color matching uses a perceptually weighted distance function (green channel weighted highest, matching human color sensitivity), mapped to a hand-picked 43-color yarn palette.

## Tech stack

- Pure vanilla JavaScript — zero frameworks, zero build step, zero server
- Canvas API for image processing and grid rendering
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT) for QR code generation
- Static hosting on Cloudflare

## Pages

| Page | Purpose |
|---|---|
| [Home](https://looprel.com) | Photo to crochet pattern generator |
| [Cross Stitch Generator](https://looprel.com/cross-stitch-pattern-generator/) | Photo to symbol chart |
| [Chart Maker](https://looprel.com/crochet-chart-maker/) | Grid + row numbers + color counts |
| [QR Pattern Generator](https://looprel.com/qr-code-to-pattern/) | Text/link to scannable embroidery QR grid |
| [How to Read a Crochet Chart](https://looprel.com/how-to-read-a-crochet-chart/) | Beginner guide to C2C, tapestry and filet |

## License

MIT — do whatever you want. If you build something with this, a link back to [looprel.com](https://looprel.com) is appreciated.
