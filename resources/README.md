# Resource integration drop zone

This directory is the contract between the playable game and the official NASA
Space Apps Challenge 2026 resource pack. The repository ships with a
**provisional** dataset so the experience is playable offline; official values
are not claimed.

## What lives here

```text
resources/
├── manifest.json   # source register, field mappings and release gate
├── incoming/       # official files go here; kept empty in this build
└── README.md
```

The runtime reads TypeScript data from `src/data/`. Nothing in `resources/` is
loaded at runtime yet. The manifest records provenance and the intended mapping
so a supplied pack can be audited and integrated deliberately.

## Drop-in workflow

1. Put the official files in `resources/incoming/`.
2. Add each file to the relevant source entry's `files` array in
   `resources/manifest.json`. Change that source's `status` from `pending` to
   `verified` only after reviewing its licence and usage terms.
3. Map each supplied field to the target file and field listed under
   `fieldMappings`.
4. Replace values in `src/data/`. Keep gameplay-only conversions (for example,
   cost rounding) visible in code comments.
5. Update `src/data/dataset.ts` and the manifest together:
   - `version`
   - `status` (`provisional`, `mixed`, or `official`)
   - `summary`
   - `pendingSources`
6. Run:

   ```bash
   npm run data:check
   npm run data:check:strict
   npm test
   npm run build
   ```

`data:check` is a development check and tolerates a pending pack.
`data:check:strict` is the release gate and fails until the official source is
supplied, mapped and marked appropriately.

## Current source register

The manifest records:

| Source | Integration state | What it informs |
| --- | --- | --- |
| NASA Space Apps 2026 pack | **pending** | Numerical components, orbits, launch vehicles, objectives |
| JPL Concept Maturity Levels paper | integrated reference | CML 1–4 game badge |
| NASA *Design and Develop Science Missions* | integrated reference | Mission segments and review discipline |
| NASA *CubeSat 101* | integrated reference | Process, AIT and risk language |
| NASA GSFC Mission Design Lab | integrated reference | MEL, budget, review structure |
| NASA `mission-viz` | deferred adapter | Future 3D visualization |
| Webb *Build It Yourself* | integrated inspiration | Trade-off framing and mission analogues |
| NASA GMAT | integrated handoff | Downloadable trajectory starting point |

See `docs/RESOURCE-INTEGRATION.md` for field-level detail, caveats and the
acceptance checklist.

## Rules

- Do not put credentials, personal data or non-public material in this folder.
- Do not relabel provisional values as official without a recorded source.
- Do not copy third-party assets into the application unless the licence allows
  redistribution. Prefer links and citations.
- Keep the app usable offline. Official data must not introduce a required
  backend for the single-player build.
