# Demo scene credits

The public demo scenes on the product page, in the docs' live examples and
behind the playground's "try a demo scene" link are third-party models
published under licenses that allow this use. Verse Engine compiles them
unchanged (`scripts/build-demo-scenes.mjs`); the credits below are the
attribution those licenses ask for, and our thanks either way.

| Demo | Source | Author | License |
| --- | --- | --- | --- |
| **Chess set** (`ingest/demo-chess-set.vpk`) — product hero, HDR/reflections card | [Poly Haven — Chess Set](https://polyhaven.com/a/chess_set) | Riley Queen | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| **Marble bust** (`ingest/demo-marble-bust.vpk`) — photo-scan example | [Poly Haven — Marble Bust 01](https://polyhaven.com/a/marble_bust_01) | Rico Cilliers | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| **Antique camera** (`ingest/demo-antique-camera.vpk`) — "classic PBR" example | [Khronos glTF-Sample-Assets — AntiqueCamera](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/AntiqueCamera) | Maximilian Kamps, UX3D | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (the UX3D logo on the model is a non-copyrightable mark owned by UX3D) |
| **Damaged helmet** (`assets/DamagedHelmet.glb`) — test fixture, no longer featured | [Khronos glTF-Sample-Assets — DamagedHelmet](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/DamagedHelmet) | ctxwing (glTF rebuild); theblueturtle_ (original) | [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/) (rebuild) / [CC-BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) (original) — why it stays a test fixture only |
| **Archviz interior** (`ingest/2kbaked-v9-….vpk`) — production scene | A real archviz project | — | shown with the owner's permission; not redistributable |

Poly Haven assets are released into the public domain (CC0) — no
attribution is legally required, and Poly Haven asks only that you do not
redistribute the files as your own or imply their endorsement. The
Khronos sample assets carry their own `README.md`/`metadata.json` with the
license per contributor.

Models are fetched from the sources above at image build time; nothing
third-party is checked into this repository. If you deploy your own server
and swap the demo scenes, update this page and the credits link in the
site footer.

## Material library (restyle)

The live restyle and plan-to-home material library
(`web/playground/assets/library/`) is 26 CC0 1.0 (public domain)
texture sets from [ambientCG](https://ambientcg.com) by Lennart Demes,
right-sized to 512² JPEG. CC0 needs no credit, but we give it anyway with
thanks. The source asset, URL, SHA-256 and byte size of each set are recorded in
`web/playground/assets/library/manifest.json` and
`web/playground/assets/library/LICENSES.md`.

## Test captures (not shipped)

The scan gate (`web/test/fix-verify-scans.mjs`) runs on real phone captures
downloaded to `~/VerseTestAssets/scans/` on the build machine. They are never
committed and never served. They come from the Objaverse release on Hugging
Face (`allenai/objaverse`, ODC-By); each object keeps its original author's
licence:

| File | Source | Author | License |
| --- | --- | --- | --- |
| `room-lidar.glb` (4.7 MB) | [Room LiDAR](https://sketchfab.com/3d-models/bce9b8d05b5b4480bdd89ee7e3066063) · [file](https://huggingface.co/datasets/allenai/objaverse/resolve/main/glbs/000-038/bce9b8d05b5b4480bdd89ee7e3066063.glb) | SeaTrey | [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `den-ipad-lidar.glb` (25.4 MB) | [Den - iPad Lidar Scan](https://sketchfab.com/3d-models/c4ee511cca09453ba3ae6acf181dc764) · [file](https://huggingface.co/datasets/allenai/objaverse/resolve/main/glbs/000-005/c4ee511cca09453ba3ae6acf181dc764.glb) | skollimarla | CC-BY 4.0 |
| `sendai-hotel-scaniverse.glb` (17.4 MB) | [Sendai Washington Hotel Room 410](https://sketchfab.com/3d-models/14fee65f91644eb78ea9cfea7703f544) (Scaniverse) · [file](https://huggingface.co/datasets/allenai/objaverse/resolve/main/glbs/000-016/14fee65f91644eb78ea9cfea7703f544.glb) | kazugoru | CC-BY 4.0 |
| `broadway-corridor-polycam.glb` (11.3 MB) | [Broadway corridor](https://sketchfab.com/3d-models/02e4d750159e4bc5b0b1952019c61f4f) (Polycam) · [file](https://huggingface.co/datasets/allenai/objaverse/resolve/main/glbs/000-011/02e4d750159e4bc5b0b1952019c61f4f.glb) | alban | CC-BY 4.0 |

`web/test/make-scan-fixtures.py` derives the other import types (OBJ zip,
USDZ, PLY mesh and points, XYZ, a tilted copy, an 8K-texture copy) from
`room-lidar.glb`. It also builds a **synthetic MatterPak** from the Polycam
corridor: no real MatterPak bundle is publicly licensed for this use.

## Verse Home furniture pack (committed)

The furniture, decor and window view that generated homes
(`web/playground/plan2home-gen.mjs`) are dressed with. The pack in
`web/playground/assets/furniture/` (6.1 MB) is committed and ships with the
server; `manifest.json` there records, per file, the source page, the sha256
of the raw Poly Haven download it was built from and the sha256 of the
shipped file (the generator skips any file whose hash does not match and
draws that piece procedurally). It is rebuilt with
`node tools/plan2home-lib/fetch.mjs` (raw 1k models and 2k HDRIs from
polyhaven.com, about 80 MB, local only, recorded in
`tools/plan2home-lib/manifest.json`) and `node tools/plan2home-lib/pack.mjs`
(Blender: decimation, 512/256 px textures, material names from the restyle
naming contract). Every file is CC0 1.0 (public domain); no attribution is
required, and we credit the source anyway.

| Asset | Kind | Used as | Source | Author | License |
| --- | --- | --- | --- | --- | --- |
| `armchair.glb` (306 KB) | model | armchair | [polyhaven.com/a/modern_arm_chair_01](https://polyhaven.com/a/modern_arm_chair_01) | Poly Haven | CC0 1.0 |
| `lounge_chair.glb` (258 KB) | model | lounge chair | [polyhaven.com/a/mid_century_lounge_chair](https://polyhaven.com/a/mid_century_lounge_chair) | Poly Haven | CC0 1.0 |
| `coffee_table.glb` (190 KB) | model | coffee table | [polyhaven.com/a/modern_coffee_table_01](https://polyhaven.com/a/modern_coffee_table_01) | Poly Haven | CC0 1.0 |
| `coffee_table_round.glb` (201 KB) | model | coffee table round | [polyhaven.com/a/coffee_table_round_01](https://polyhaven.com/a/coffee_table_round_01) | Poly Haven | CC0 1.0 |
| `tv_unit.glb` (529 KB) | model | tv unit | [polyhaven.com/a/modern_wooden_cabinet](https://polyhaven.com/a/modern_wooden_cabinet) | Poly Haven | CC0 1.0 |
| `dining_chair.glb` (219 KB) | model | dining chair | [polyhaven.com/a/dining_chair_02](https://polyhaven.com/a/dining_chair_02) | Poly Haven | CC0 1.0 |
| `side_table.glb` (196 KB) | model | side table | [polyhaven.com/a/side_table_01](https://polyhaven.com/a/side_table_01) | Poly Haven | CC0 1.0 |
| `plant_tall.glb` (1210 KB) | model | plant tall | [polyhaven.com/a/potted_plant_01](https://polyhaven.com/a/potted_plant_01) | Poly Haven | CC0 1.0 |
| `plant_wide.glb` (950 KB) | model | plant wide | [polyhaven.com/a/potted_plant_02](https://polyhaven.com/a/potted_plant_02) | Poly Haven | CC0 1.0 |
| `plant_small.glb` (138 KB) | model | plant small | [polyhaven.com/a/potted_plant_04](https://polyhaven.com/a/potted_plant_04) | Poly Haven | CC0 1.0 |
| `pendant.glb` (107 KB) | model | pendant | [polyhaven.com/a/modern_ceiling_lamp_01](https://polyhaven.com/a/modern_ceiling_lamp_01) | Poly Haven | CC0 1.0 |
| `vase_white.glb` (88 KB) | model | vase white | [polyhaven.com/a/ceramic_vase_01](https://polyhaven.com/a/ceramic_vase_01) | Poly Haven | CC0 1.0 |
| `vase_jar.glb` (98 KB) | model | vase jar | [polyhaven.com/a/ceramic_vase_02](https://polyhaven.com/a/ceramic_vase_02) | Poly Haven | CC0 1.0 |
| `vase_jug.glb` (90 KB) | model | vase jug | [polyhaven.com/a/ceramic_vase_04](https://polyhaven.com/a/ceramic_vase_04) | Poly Haven | CC0 1.0 |
| `vase_brass.glb` (90 KB) | model | vase brass | [polyhaven.com/a/brass_vase_02](https://polyhaven.com/a/brass_vase_02) | Poly Haven | CC0 1.0 |
| `art_landscape.glb` (200 KB) | model | art landscape | [polyhaven.com/a/hanging_picture_frame_02](https://polyhaven.com/a/hanging_picture_frame_02) | Poly Haven | CC0 1.0 |
| `art_gold.glb` (159 KB) | model | art gold | [polyhaven.com/a/fancy_picture_frame_01](https://polyhaven.com/a/fancy_picture_frame_01) | Poly Haven | CC0 1.0 |
| `art_photo.glb` (85 KB) | model | art photo | [polyhaven.com/a/standing_picture_frame_01](https://polyhaven.com/a/standing_picture_frame_01) | Poly Haven | CC0 1.0 |
| `bowl.glb` (86 KB) | model | bowl | [polyhaven.com/a/wooden_bowl_01](https://polyhaven.com/a/wooden_bowl_01) | Poly Haven | CC0 1.0 |
| `cube_shelf.glb` (183 KB) | model | cube shelf | [polyhaven.com/a/wooden_display_shelves_01](https://polyhaven.com/a/wooden_display_shelves_01) | Poly Haven | CC0 1.0 |
| `ottoman.glb` (109 KB) | model | ottoman | [polyhaven.com/a/Ottoman_01](https://polyhaven.com/a/Ottoman_01) | Poly Haven | CC0 1.0 |
| `books.glb` (580 KB) | model | books | [polyhaven.com/a/book_encyclopedia_set_01](https://polyhaven.com/a/book_encyclopedia_set_01) | Poly Haven | CC0 1.0 |
| `view_city.jpg` (107 KB) | view (2k HDRI → horizon band) | view city | [polyhaven.com/a/sunset_jhbcentral](https://polyhaven.com/a/sunset_jhbcentral) | Poly Haven | CC0 1.0 |

Fetched but not shipped: `side_table_tall_01` (its glTF indexes past its
vertex buffer), `throw_pillows_01` (replaced by procedural cushions that
restyle), `illovo_beach_balcony` (an HDRI tried for the view), and the first
library's `sofa_03`, `dining_table`, `painted_wooden_nightstand`, `Shelf_01`,
`wooden_stool_02`.

### First plan2home library (raw, not committed)

The ambientCG texture sets below were part of the first fetch. Generated
homes take their surface textures from the shared material library
(`web/playground/assets/library`, credited above), not from these.

| Asset | Kind | Used as | Source | Author | License |
| --- | --- | --- | --- | --- | --- |
| `WoodFloor051` | texture set | wood floor | [ambientcg.com/view?id=WoodFloor051](https://ambientcg.com/view?id=WoodFloor051) | ambientCG | CC0 1.0 |
| `Marble012` | texture set | marble floor | [ambientcg.com/view?id=Marble012](https://ambientcg.com/view?id=Marble012) | ambientCG | CC0 1.0 |
| `Tiles074` | texture set | tiles bath | [ambientcg.com/view?id=Tiles074](https://ambientcg.com/view?id=Tiles074) | ambientCG | CC0 1.0 |
| `Tiles101` | texture set | tiles kitchen | [ambientcg.com/view?id=Tiles101](https://ambientcg.com/view?id=Tiles101) | ambientCG | CC0 1.0 |
| `Tiles012` | texture set | stone balcony | [ambientcg.com/view?id=Tiles012](https://ambientcg.com/view?id=Tiles012) | ambientCG | CC0 1.0 |
| `PaintedPlaster017` | texture set | plaster wall | [ambientcg.com/view?id=PaintedPlaster017](https://ambientcg.com/view?id=PaintedPlaster017) | ambientCG | CC0 1.0 |
| `Fabric030` | texture set | fabric | [ambientcg.com/view?id=Fabric030](https://ambientcg.com/view?id=Fabric030) | ambientCG | CC0 1.0 |
| `Wood049` | texture set | wood furniture | [ambientcg.com/view?id=Wood049](https://ambientcg.com/view?id=Wood049) | ambientCG | CC0 1.0 |
| `Concrete034` | texture set | concrete | [ambientcg.com/view?id=Concrete034](https://ambientcg.com/view?id=Concrete034) | ambientCG | CC0 1.0 |
| `Carpet013` | texture set | carpet | [ambientcg.com/view?id=Carpet013](https://ambientcg.com/view?id=Carpet013) | ambientCG | CC0 1.0 |
