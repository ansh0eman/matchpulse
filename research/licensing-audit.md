# Licensing and provenance audit — 2026-10-22

## Primary source: usable with retained notices

Repository: https://github.com/tbleckert/football-simulator

Exact inspected commit: `39529b19c40868d66aa47db084ebc9ea29c86e70` (2026-10-04). Source manifest version: `2.0.0`.

The root LICENSE contains the complete MIT grant, copyright `Copyright (c) 2026 Tobias Bleckert`, redistribution notice requirement and warranty disclaimer. Its full text is retained in `upstream/football-simulator/LICENSE` and `../THIRD_PARTY_NOTICES.md`. Root package.json has **no license field**. The source license nevertheless explicitly covers the repository software; the absence of package metadata does not erase that grant.

We cloned for inspection, read the license, then imported the licensed source into the isolated PoC. No simulator implementation was copied into our original src files or modified. The PoC adapts the documented/tested construction pattern and injects a standard Park–Miller RNG. Attribution records that relationship.

If redistributing source, bundles, containers or substantial portions, include the full upstream copyright and MIT permission text. Keep exact commit provenance and record future modifications. Do not imply the upstream author endorses MatchPulse. The code license does not establish rights to Premier League marks, footage, imagery or third-party datasets. The PoC uses only fictional names and explicitly constructed attributes; upstream sample club/player datasets and commentary are not imported.

## npm artifact: do not substitute blindly

`npm view @bleckert/football-simulator` returned version 2.0.0 with no license value. We downloaded the exact tarball using `npm pack --ignore-scripts` and enumerated it without executing it. It has 9 files, no LICENSE/COPYING file, and no license field in its package.json. SHA-512 integrity:

`sha512-Wvyr1DZz9Ut0dYoI9nSVsnY/tI0aqv5B9PaIM/LqsJkDCVDnZhSdne/TjXis8BnXvpmnvkLrLcaDHkrHp5nwMg==`

SHA-1 from registry: `8a5dcad5ad7deb5056d0943f7ea59045f2a8807a`.

Evidence: npm-pack.json and npm-package-files.txt, with tarball in ../upstream/npm-package/. This establishes the missing notices; it does not establish that npm bundle bytes correspond to our audited commit. Use the pinned source and retained notices for the next milestone. A registry-based distribution should first resolve artifact provenance and carry the required notices.

## Dependencies

`dependency-licenses.json` inventories all 208 non-root lockfile entries across upstream and PoC, including optional platform packages. Every entry declares a license; declarations observed: MIT, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause, BlueOak-1.0.0. This is a lockfile metadata inventory, not a full independent provenance audit of every transitive implementation. Installed package license files remain in node_modules; redistribution must preserve applicable notices.

The upstream manifest has one runtime dependency, `events ^3.3.0` (MIT), primarily relevant to the older engine path, and eight development dependencies. This PoC's direct runtime dependency is Zod 4.1.12 (MIT); tsx 4.20.6, TypeScript 5.9.3, and @types/node 24.10.0 are development tools. Use locked installs. Keep upstream demo/Svelte/Vite/API-extractor tooling out of the eventual deployed Python service.

Current `npm audit --json` results are saved separately. PoC: zero advisories. Upstream: 5 dependency entries affected (4 moderate, 1 high), including direct Vite <=6.4.3 at high severity. The install-time count differed; use the later saved audit JSON as the explicit observation. The PoC imports source, does not launch the demo server, and does not require upstream's node_modules to generate matches. Do not carry that dev toolchain into deployment. No blanket claim of security or production readiness is made.

A bounded copyright/SPDX/license text search of TypeScript source found no additional file-specific headers. That negative search does not guarantee the absence of all third-party provenance concerns; root license plus dependency notices are the integration basis here.

## Secondary candidates

| Candidate / inspected revision | Actual evidence | Decision |
|---|---|---|
| Tobilion/footysim `5127557d6ca888a1611ec0c57fb95fe35a431986` | GitHub license endpoint 404; recursive tree contains no license/copying/notice path; README has no license statement | No implementation reuse without an explicit grant |
| kylemath/soccerSim `2255b922a408274162780d67cec19d7217f73cbe` | License endpoint 404; no license/copying/notice path; README says “MIT License - feel free to use and modify!” but lacks full standard terms/copyright notice | Ambiguous packaging; request explicit full license before choosing it |

Saved GitHub metadata, tree listings and README snapshots support these observations. Neither alternative was installed, benchmarked or imported. Public visibility is not permission by itself. They are not better deadline choices than the verified primary source route.

Hackathon eligibility/originality and deadline statements in the user brief were treated as supplied requirements, not independently audited rules. Licensed integration still needs original detection, evidence and explanation functionality; this engine alone is not a submission.
