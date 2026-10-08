# Karten design mockups (v1.2 proposal)

Rendered from HTML/CSS with headless Chrome at 2x (`src/*.py` -> `src/*.html` -> PNG).
Rebuild: `cd src && python3 build.py && ./render.sh style-1-vienna style-2-playful style-3-neon style-4-minimal && python3 overview.py`

Fonts (OFL, bundled in `fonts/`, all with Cyrillic): Playfair Display, Manrope, Nunito, Unbounded, Inter Tight.
Icons are inline SVG (lucide-style paths) -> react-native-svg. Mascot "Бимми" is plain SVG shapes.
RN notes: gradients -> expo-linear-gradient; glow/3D shadows -> RN 0.76+ `boxShadow`, `textShadow`;
glass -> expo-blur BlurView; blurred orbs -> pre-rendered PNG or SVG radial gradients.
