```markdown
# TattooYar | 3D Interactive Tattoo Studio & Visualization

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r128+-black.svg)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-Fast%20Bundler-646CFF.svg)](https://vitejs.dev/)
[![WebGL](https://img.shields.io/badge/WebGL-Custom%20GLSL%20Shaders-990000.svg)](https://www.khronos.org/webgl/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An advanced WebGL/Three.js-powered 3D virtual studio engineered for realistic stencil projection, anatomical preview, and real-time interactive positioning of tattoo artwork on high-fidelity human body meshes.

---

## Overview

TattooYar provides tattoo artists and clients with a digital fitting room. By combining custom GLSL surface mapping algorithms with an intuitive 3D viewport, users can import custom flash art, remove solid backgrounds, preview realistic skin integration under studio lighting, and fine-tune transform parameters across multi-zone body segments.

---

## Key Features

- **Dual Stencil Mapping Pipeline:**
  - **Curved UV Mapping Mode:** Maps wide-format stencils across complex limb geometry (arms, legs, torso) using multi-channel UV sets (`uvSet0`–`uvSet3`) with zone-specific rotational offset matching.
  - **Surface-Normal Cylindrical Projection:** Calculates local limb tangent and bitangent bases directly from surface hit normals to ensure natural conforming to organic contours.
- **Multi-Tattoo Concurrency:**
  - Optimized GLSL fragment shader supporting up to **8 simultaneous active tattoo slots** with dedicated transforms (scale, $360^\circ$ rotation, positioning) and zero frame-rate degradation.
- **Contextual Preview Modes:**
  - Real-time soft-opacity preview during hover in standard projection mode.
  - Visual target-ring guide (`SurfaceTargetGuide`) in UV mode to guarantee accurate surface selection without orientation artifacts.
- **AI-Assisted Stencil Extraction:**
  - Built-in background isolation tool converting raw stencil artwork or photos into transparent PNG overlays ready for 3D application.
- **Interactive Studio Lighting & UI:**
  - $360^\circ$ orbital lighting to inspect stencil appearance across various highlight and shadow angles.
  - Collapsible drawer UI, orientation guards for mobile landscape viewing, and complete canvas viewport management.

---

## Tech Stack

- **Core & Runtime:** React 18, Vite
- **3D Engine:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **Graphics Pipeline:** Custom GLSL Shaders (Vertex & Fragment)
- **Icons & Styling:** Lucide React, Modular CSS

---

## Project Structure

```plaintext
├── public/
│   └── models/
│       └── body_parts/          # 3D assets (torso.glb, arm_right.glb, etc.)
├── src/
│   ├── components/
│   │   ├── Canvas3D.jsx         # WebGL canvas, Three.js shaders & raycasting
│   │   ├── TattooExtractor.jsx  # Background removal & stencil processing
│   │   └── PhysicsSlider.jsx    # Kinetic drag slider controls
│   ├── App.jsx                  # State machine, step controller & workspace layout
│   └── main.jsx
├── package.json
└── vite.config.js

```

---

## Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
* `npm` or `yarn`

### Installation

1. Clone the repository:
```bash
git clone [https://github.com/your-username/tattooyar.git](https://github.com/your-username/tattooyar.git)
cd tattooyar

```


2. Install dependencies:
```bash
npm install

```


3. Launch the development server:
```bash
npm run dev

```


Open `http://localhost:5173` in your browser.

---

## Production Build & Deployment

To bundle the application for production hosting:

```bash
npm run build

```

The optimized static assets will be output to the `dist/` directory.

### Static Hosting

The build artifacts can be hosted on any static platform or internal CDN:

* Upload the contents of `dist/` directly to your web server root or hosting provider (e.g., Chabokan, Nginx, or AWS S3).
* Configure your web server to serve `index.html` for single-page routing if client-side redirects are enabled.

---

## Controls & Shortcuts

| Action | Control |
| --- | --- |
| **Rotate Model** | Left Click + Drag (Navigation Mode) |
| **Pan Model** | Right Click + Drag |
| **Zoom Viewport** | Scroll Wheel / Pinch Gesture |
| **Place Stencil** | Left Click on Mesh Surface (Placement Mode) |
| **Adjust Scale** | Middle Click Drag or `Ctrl` + Right Drag |
| **Adjust Rotation** | `Shift` + Right Drag |

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

```

```