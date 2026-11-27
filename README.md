# The Speed Camera That Paid Good Drivers

A 57.712 second vertical Remotion Short (1080x1920, 30 fps, 1732 frames), composed in
three.js with flat 2D characters and a rich 3D world.

## Local

```bash
npm ci
npm start          # Remotion Studio (preview)
```

WebGL rendering is intentionally done on GitHub Actions, not on a phone.

## Render

Push to `src/**`, `package.json`, `package-lock.json`, `remotion.config.ts` or the
workflow file to trigger `.github/workflows/render-video.yml`. It renders
`SpeedCameraFull` with `--gl=swangle` to `out/speed-camera-full.mp4`, uploads the
artifact and commits the result back to the repository.

Manual render:

```bash
npx remotion render SpeedCameraFull out/speed-camera-full.mp4 --gl=swangle --codec=h264 --overwrite
```

## Audio

`public/speed-camera-voice-1.2x.mp3` is the original 57.712 s voice file, copied
unmodified. It starts at frame 0 and plays at full volume. Shot boundaries are locked
to the measured voice beats in `src/scene/shots-full.ts`.

## Check

```bash
npx tsc --noEmit
```
