# 🚗 WELCOME TO — SWADHINJIT'S 3D PORTFOLIO

A Bruno Simon–inspired real-time 3D game-world portfolio built with React, Three.js, @react-three/fiber, @react-three/drei, and @react-three/rapier.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Open in browser
http://localhost:5173
```

---

## 🕹️ Controls

| Key | Action |
|-----|--------|
| `W` / `↑` | Drive forward |
| `S` / `↓` | Drive backward |
| `A` / `←` | Turn left |
| `D` / `→` | Turn right |
| `SPACE` | Jump |
| `SHIFT` | Boost |

---

## 🗺️ World Map

```
          [ABOUT ME - North]
               ↑
[SKILLS] ←  🚗 START  → [PROJECTS]
               ↓
          [CONTACT - South]
```

Drive to each glowing cube to open the section panel.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Scene.jsx         # Canvas + Physics + lights
│   ├── Car.jsx           # Drivable car with physics
│   ├── World.jsx         # Ground, roads, walls, props
│   ├── Sections.jsx      # Glowing cubes + name title
│   ├── HUD.jsx           # UI overlay, speed, modals
│   └── LoadingScreen.jsx # Animated loading screen
├── hooks/
│   └── useControls.js    # Keyboard input
├── store.js              # Zustand global state
└── main.jsx              # Entry point
```

---

## ⚙️ Tech Stack

- **React 18** + **Vite 5**
- **Three.js** — 3D rendering
- **@react-three/fiber** — React renderer for Three.js
- **@react-three/drei** — Helpers (Text, Stars, Billboard…)
- **@react-three/rapier** — Physics engine (Rapier WASM)
- **Zustand** — Lightweight state management

---

## 🎨 Customisation

### Change the name
Edit `src/components/Sections.jsx` → `NameTitle` component → update the `<Text>` content.

### Change section content
Edit `src/components/HUD.jsx` → `AboutContent`, `ProjectsContent`, `SkillsContent`, `ContactContent`.

### Add sections
In `Sections.jsx`, add an entry to the `sections` array and add a matching content component in `HUD.jsx`.

### Adjust car physics
Edit constants at the top of `src/components/Car.jsx`:
```js
const SPEED = 18        // base speed
const BOOST_MULT = 2.2  // shift multiplier
const TURN_SPEED = 2.2  // turning rate
const JUMP_FORCE = 7    // jump impulse
```

---

## 🏗️ Build for Production

```bash
npm run build
# Output in /dist — deploy to Vercel, Netlify, or any static host
```
