# Speed Camera Render Test

A 15-second Remotion + three.js test animation (1080×1920 vertical, 30fps, no audio): the opening of the Speed Camera story — a red car speeding down a road, the driver, the speedometer showing 62, the brake, "everyone does it" (shots 1–5, 0:00–~15 s).

## Style

Rich saturated 3D world + flat 2D rigged characters (big round white heads, dot eyes, thick black outlines, visible neck). Characters move — the driver steers and reacts. A visible camera move in every shot. Detail is built, not painted: individual stones along the road, individual grass blades, trees, telegraph poles, road markings, a detailed glossy car.

## Render

Rendered on GitHub Actions (GitHub runners have no GPU, so the render uses `--gl=swangle` — SwiftShader software WebGL — see `remotion.config.ts`).

Pushing to `main` triggers `.github/workflows/render-video.yml`, which runs:

```
npx remotion render SpeedCameraTest out/test15.mp4 --gl=swangle --codec=h264
```

and commits `out/test15.mp4` + `out/render-status.json` back to the repo.

## Local preview

```
npm install
npx remotion still SpeedCameraTest out/still.png --frame=120 --gl=swangle
npm run render   # full 15 s mp4 (software GL, slow)
```

## Files

- `src/Root.tsx` — composition `SpeedCameraTest` (1080×1920, 30fps, 450 frames)
- `src/SpeedCameraTest.tsx` — scene composition, HUD overlay, camera rig
- `src/scene/shots.ts` — per-shot camera moves, car + driver state (shots 1–8)
- `src/scene/world.tsx` — road, grass, stones, trees, poles, houses, skyline, sign
- `src/scene/car.tsx` — detailed sedan (glossy paint, chrome, headlights, tread tyres)
- `src/scene/driver.tsx` — rigged flat 2D driver (separate parts, pivots at joints)
- `src/scene/textures.ts` — canvas textures (sky gradient, grass, asphalt, sign, road paint)
