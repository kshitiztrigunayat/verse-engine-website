# Verse Engine — naming glossary

*Definitions are taken from the doc comments and specs they cite:
`docs/architecture.md`, the container format spec (in-repo, for the team),
`crates/verse-render/src/vg_residency.rs`, `crates/verse-core/src/wire.rs`,
`crates/verse-core/src/anim.rs`, `crates/verse-rhi/src/lib.rs`,
`web/playground/caps.js`, `web/playground/triple-buffer.js`. Where a term is
used with two meanings in the code, both are listed.*

### Virtualized geometry

**cluster** — The draw unit of virtualized geometry: a meshlet of up to 128
triangles / 256 vertices with its own bounding sphere, `own_error`,
`parent_error`, quantization AABB, material and payload range (112-byte
entry in the `.vpk` cluster table). Rendered as one fixed 384-vertex
instance, degenerate past the real triangle count.

**group** — The streaming and simplification unit. In the compiler: a set
of adjacent clusters simplified together with the group border locked, then
re-split into parent clusters. In the file: a contiguous run of child
clusters, one byte range, one FNV-1a checksum (32-byte v5 group entry).
Residency is group-atomic. A cluster is a *child* of `parent_group` (its
residency unit) and a *parent* of `own_group` (the group that refines it).

**DAG cut** — The set of clusters drawn in a frame. Cut rule: draw a
cluster iff `project(own_error) ≤ τ < project(parent_error)`. Errors grow
strictly up the DAG (`parent_error > own_error` is enforced on read), which
keeps a mixed-level cut crack-free. Evaluated per cluster in `vg_cull`
(`shaders/vg.wgsl`), and on the CPU for the burst plan.

**own error / parent error** — `own_error`: object-space error of this
cluster versus the source mesh, projected through `own_test_sphere` (the
group that produced it; identical on both sides of a boundary).
`parent_error`: the error of drawing its parents instead, projected through
`parent_test_sphere`; `+∞` at roots. `τ` is the pixel budget.

**residency** — Which groups are loaded into GPU pool slots right now.
Group-atomic and top-down: a group may only be resident when every group
holding its parent clusters is resident, because the cut falls back to a
parent when a child is absent. The CPU state machine is `Residency` in
`vg_residency.rs` (pure, headless-tested); `gpu.rs` owns the buffers.
Roots (clusters with no `parent_group`) are always resident.

**closure (requires / enables)** — The top-down dependency graph.
`requires[g]` = groups holding g's parent clusters; they must be resident
before g loads (`Admission::NeedsParent` otherwise). `enables[g]` = the
inverse edge: groups that list g in their `requires` — the eviction guard
(g cannot be evicted while a dependent is loaded). Edges are added by
`link_clusters`: a cluster that is both a child of `parent_group` and a
parent of `own_group` says "`own_group` requires `parent_group`".
`closure_holds()` is the debug invariant.

**wants** — GPU feedback: every drawn cluster that wanted refinement stamps
the group it would refine into with the current frame number (`wants[g]` =
last frame g was wanted; 0 = never). `plan_from_wants` turns stamps within
`WANT_HORIZON` (120 frames) into a fetch plan — absent groups with their
missing ancestors first, capped to what can land (free slots + evictable,
at most `TICK_CAP` = 24). A group wanted within `EVICT_GRACE` (60 frames)
is never evicted.

**burst plan** — Instant refine: `burst_plan` walks the
refinement cut for a camera entirely on the CPU from the directory (every
resident cluster entry carries its sphere and error) and returns the
unloaded groups the cut needs, ancestors strictly before dependents — one
call instead of one GPU round trip per DAG level. With a paged directory
the walk stops at the resident prefix and resumes when the next page
lands. Related: `preload_list`, the coarse-first warmup fetched right after
the roots (≤ 512 KiB, never more than half the pool).

**head / page (.vpk v5)** — The **head** is the byte prefix the runtime
opens on: `[header 128 B | group table | first n cluster entries]`, with
`n = min(cluster_count, 32 768)` (~3.7 MB regardless of scene size). It
must contain every root entry. The remaining cluster entries are fetched in
order as **pages** — whole, contiguous entries not overrunning
`cluster_count` — and appended with `Directory::extend` /
`vg_dir_extend`; `Admission::NeedsPage` gates any group whose children's
entries are not paged in yet. v ≤ 4 files (group table after the entries)
open on the whole directory as a single head.

**Hi-Z** — A hierarchical depth pyramid (`hiz.wgsl`) at a fixed virtual
resolution, deliberately independent of render resolution so DRS scale
changes cannot misalign it. Used for two-phase occlusion culling of
clusters: `vg_cull` tests against the pyramid in phase 1, the pyramid is
rebuilt after the main pass, and a phase-1 → phase-2 re-test queue gives
occluded-then-revealed clusters a second chance. `?vghiz=0` disables it for measurement.

**probe** — Two uses. (1) **Environment probe**: a 128² cube map
of the streamed scene rendered from the walker's position
(`vg_bake_probe`, `bake-probe` message) that mirror-like materials sample.
(2) **QA probe**: the drawn-cluster readback (`visible_stats`) that feeds
the ~1 Hz culling stats in the HUD.

### Rendering

**tier A / B / C / –** — Device class. Engine side (`verse-rhi` `Tier`):
**A** = WebGPU with `max_storage_buffer_binding_size > 128 MiB` and
`max_buffer_size > 256 MiB` (full pipeline); **B** = WebGPU with reduced,
mobile-class limits (reduced budgets); **C** = the WebGL2 build, by
construction whatever the hardware (classic meshes, procedural sky, no
post chain; streamed scenes open with a CPU-selected cut; no splats). Page side (`caps.js` `detect`) reports **A/B** (WebGPU adapter +
OffscreenCanvas; the engine then decides A vs B), **C** (WebGL2 only), or
**–** (neither: poster + link-out, the engine never boots).

**TSR** — Temporal super-resolution ("4K Mode", `?temporal=1`, embed
`quality: "4k"`). Replaces MSAA with jitter + motion vectors and
reconstructs output-resolution detail from a scaled render using a
ping-pong history at output resolution. Not available on tier C; depth of
field and the stereo (XR) path are not applied in temporal mode.

**DRS** — Dynamic resolution scaling: a PI controller on the sensed frame
time that moves the internal render scale within [0.5, 1.0] to hold the
frame budget. `?scale=` pins the scale and disables the controller. The
thermal predictor (`thermal.rs`) caps the DRS ceiling when it regresses an
upward drift in pixel-normalized cost (`sensed_ms / scale²`).

### Animation (FEAT-8)

**deform block** — The per-frame f32 block the sim appends to the snapshot
for skinning and morphing: joint palettes (16 words per joint) and morph
weights (one word per target), capped at 256 joints' worth. Per-instance
pointers (`deform_base`, `morph_base`; -1 / MAX = none, bind-pose
fallback) address into it.

**palette** — A skin's joint matrices for one frame:
`inverse(mesh world) × joint world × inverse bind`, so the vertex shader
skins in mesh space before applying the model matrix. A *rig*
(`wire::pack_rig`) carries the rest-pose node hierarchy, clips, skins
(joint node indices + inverse bind matrices), per-instance skin index and
morph defaults.

### Workers and wire

**snapshot / wire** — `verse-core/src/wire.rs` defines the packed f32
formats crossing worker boundaries so both sides compile from one module.
The **frame snapshot** (sim → render, every tick) is `[time, view_proj,
view, proj, camera_pos, bounds, instance_count, instances × 24 words,
light_count, lights, …deform block]`; a torn or truncated slot deserializes
to `None` rather than panicking. The **scene description** (render → main
→ sim, once per load) packs the node list + bounds; the **rig** packs
animation data beside it.

**triple buffer** — `web/playground/triple-buffer.js`: a lock-free,
wait-free exchange over a `SharedArrayBuffer` — three f32 slots in the
wire format plus one atomic "latest" word `{slot index, dirty bit}` in a
64-byte header. The writer publishes with one `Atomics.exchange` and
continues into the slot it got back; the reader swaps its held slot for the
latest. Writer and reader can never hold the same slot, so no torn reads
and nobody waits. Only exists when the page is cross-origin isolated.

**sim worker / render worker** — The **render worker** (`render-worker.js`)
owns the wasm `VerseEngine` and the `OffscreenCanvas`: streaming loop,
texture streaming, picking, environment swaps, golden capture, frame
telemetry; restarted by the main-thread watchdog after 8 s without a
message. The **sim worker** (`sim-worker.js`) runs the fixed-cadence ECS
tick — camera, walk physics, collision against the occupancy grid,
animation playback — and publishes snapshots through the triple buffer.
Without cross-origin isolation there is no sim worker and the render worker
ticks a camera-only fallback world (telemetry `mode: "fallback"`).

### Ingest

**ingest job** — The unit of the asynchronous compile API. `POST
/v1/ingest` stores the GLB, spawns `verse-compile`, and answers `202
{ job }`; `GET /v1/ingest/<job>` returns `{ status: "compiling" | "done" |
"error", … }` plus the compiler's phase (`stage`) and an estimate while
running, and `{ url, vpkUrl, stats }` when done. Job records are kept 2 h
after completion (`404` afterwards); the compiled `ingest/<id>.vpk` is
retained and served; the uploaded GLB is deleted after compile (unless
the scene was published in compatibility mode, where the GLB is the
scene). A **scene
id** in the embed SDK (`data-scene`) is this ingest handle: it resolves to
`ingest/<scene>.vpk` on the Verse origin.
