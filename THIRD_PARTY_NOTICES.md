# Third-party notices

## Distributed web runtime

The built viewer retains full MIT notices for React, React DOM, Scheduler and Phosphor Icons under web/public/licenses (served as /licenses in the final image). These are copied verbatim from the pinned installed packages; bundling JavaScript does not remove their attribution requirements. Font OFL notices are retained in the same directory.

Original MatchPulse implementation is made available for source review under the repository host's terms on an approved public release. No additional open-source license for original MatchPulse code is granted by these third-party notices; each third-party component retains its own license. No competitor code or visual assets are redistributed.

## Broadcast typography

Manrope Variable (@fontsource-variable/manrope 5.3.0), copyright 2019 The Manrope Project Authors, and IBM Plex Mono (@fontsource/ibm-plex-mono 5.3.0), copyright 2017 IBM Corp., are bundled locally by Vite under the SIL Open Font License 1.1. Their full copyright and license notices are retained at web/public/licenses/Manrope-OFL.txt and web/public/licenses/IBM-Plex-Mono-OFL.txt and copied into the built viewer. No external font CDN is contacted. These components retain their original licenses.

## football-simulator

Author: Tobias Bleckert. Source: https://github.com/tbleckert/football-simulator
Commit: 39529b19c40868d66aa47db084ebc9ea29c86e70; source manifest version 2.0.0.

Used through direct TypeScript source imports in this research PoC. No upstream implementation modifications. Team/Player construction and injected random-function usage follow upstream public examples and tests. The event adapter, experiments, schema and evaluation reports are MatchPulse research work.

MIT License

Copyright (c) 2026 Tobias Bleckert

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## PoC dependency notices

Zod 4.1.12 is MIT; its installed full license is in poc/node_modules/zod/LICENSE.
Runtime source imports use the upstream source's MIT grant above. The upstream package's declared events dependency is MIT. Development dependencies and transitive declared licenses are inventoried in research/dependency-licenses.json; their installed notice files are retained in their respective node_modules directories. If packaging this research for redistribution, include those applicable license/notice files, rather than relying only on this inventory.

No third-party media or football datasets are used in generated matches. Other candidates were inspected as references only.

## Step 2 Python analytical dependencies

River 0.22.0 (the River developers) is used as an installed BSD-3-Clause dependency for Page-Hinkley and ADWIN comparison. Retain its copyright, conditions and disclaimer; do not imply endorsement. The full installed license is retained in research/step2-artifacts/river-LICENSE.txt. No River implementation is copied into MatchPulse source.

Pydantic 2.12.3 is MIT; pytest 8.4.2 is MIT (development); Matplotlib 3.10.7 uses its bundled Matplotlib/PSF-based license terms (evaluation charts). Full installed notices and the complete locked dependency inventory are in research/step2-artifacts/ and backend/uv.lock. NumPy/SciPy and their distributed numerical libraries carry additional bundled notices; retain the installed distribution notices if redistributing their wheels or a Python environment. This project does not relicense those components.

Ruptures was researched (BSD-2-Clause); it is not installed, imported or copied. The original rolling detector, signal definitions, adapter, EvidencePack engine and evaluation are MatchPulse implementation work.
