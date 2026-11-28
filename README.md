# Speed Camera: "The Speed Camera That Paid Good Drivers"

Remotion 4 + three.js project that renders ONE vertical Short (composition `SpeedCameraFull`,
1080x1920, 30 fps, 1732 frames = 57.7 s) in the style of the reference video.

## Run
```
npm install          # generates package-lock.json (commit it: the workflow uses `npm ci`)
npm start            # Remotion Studio preview
npm run render       # renders out/speed-camera-full.mp4 (--gl=swangle)
```
The phone cannot render WebGL. Push to GitHub and the `Render video` workflow renders it and
commits `out/speed-camera-full.mp4` back to the repo.

## Layout
- `src/scene/shots-full.ts`  26 shots, ONE continuous camera path (61 keyframes, never a hard cut),
  lighting arc, HUD scoreboard states and the one-word-at-a-time captions.
- `src/scene/car.tsx`        glossy 3D car, gold trim, rivets, spinning wheels, RED rear lights.
- `src/scene/driver.tsx`     FLAT 2D character with separate arm/leg pivots, exact mouth shapes.
- `src/scene/props.tsx`      ladder, mailbox, $2,000 check, tablet, banknotes, drum, jackpot machine,
                             signs, gantry, living room.
- `src/scene/world.tsx`      sky (gradient + clouds + sun disc), road, 2,200 grass blades, 1,400 stones,
                             trees, skyline, hills, mist, camera pole.
- `src/scene/textures.ts`    canvas textures.
- `public/speed-camera-voice-1.2x.mp3`  the voice file, copied unchanged.

## Notes
- Caption word times: only segment start/end were measured, so words inside a segment are spread
  by word length.
- Driver skin is warm (`#F2C29B`) per the look rules. Set `SKIN_DEFAULT` in `driver.tsx` to
  `#FBF6EC` for pure white heads like the reference.
- `@react-three/fiber` arrives as a peer dependency of `@remotion/three`; `SpeedCameraFull.tsx`
  imports `useThree` from it. If your npm does not auto-install peers, run
  `npm i @react-three/fiber`.
