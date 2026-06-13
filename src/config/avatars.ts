// Preset avatar choices for the settings page. Illustrated 3D-style avatars
// (DiceBear), never real human photos — consistent with the seeded instructor
// avatars. Deterministic URLs so previews are stable and testable.
const DICEBEAR = "https://api.dicebear.com/9.x/adventurer/png";
const BG = "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf";

export const PRESET_AVATARS: string[] = [
  "Milo",
  "Luna",
  "Kira",
  "B2",
  "Nova",
  "Pip",
].map((seed) => `${DICEBEAR}?seed=${seed}&backgroundColor=${BG}`);
