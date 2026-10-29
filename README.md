# Tattooyar 🎨✨

An interactive 3D tattoo visualization web application built with React, Three.js, and Vite. Tattooyar allows users to preview and test tattoo placements on anatomical 3D models with high visual fidelity and fluid physics-based controls.

---

## 🚀 Features

- **360° Studio-Grade 3D Scene**: Inspect static GLB body parts (Right/Left Arm, Right/Left Leg, Head, Torso, Full Body) with matte clay shaders and custom studio directional lighting.
- **Guided Multi-Step Workflow**:
  1. **Body Part Selector**: Choose an anatomical focus target from an interactive glassmorphic card catalog.
  2. **Artwork Importer**: Upload and manage custom tattoo designs via file picker or drag-and-drop.
  3. **3D Workspace**: Interactive split-screen environment (two-thirds dedicated to the 3D canvas, one-third dedicated to control sidebars).
- **Physics-Based Transform Controls**: Adjust tattoo scale and 3-axis rotation (X, Y, Z) with floating balloon-style physics sliders that react dynamically to cursor dragging.
- **Smart Artwork Management**: Select active designs with standard clicks/taps, and remove assets via desktop right-click or mobile long-press gestures.

---

## 🛠 Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **3D Engine**: Three.js
- **3D Helpers & Canvas**: `@react-three/fiber` & `@react-three/drei`
- **Iconography**: `lucide-react`
- **Asset Projection Pipeline**: `DecalGeometry`

---

## 📋 Prerequisites

Before running the project locally, ensure you have the following installed on your machine:
- **Node.js**: `v18.x` or higher (Node 18/20 LTS recommended)
- **npm**: `v9.x` or higher (packaged with Node.js)

---

## 💻 Getting Started

### 1. Clone the Repository

```bash
git clone <REPOSITORY_URL>
cd tattooyar
```

### 2. Navigate to the Frontend Workspace

All UI logic, 3D scenes, and application dependencies reside within the `frontend/` directory:

```bash
cd frontend
```

### 3. Install Dependencies

Install the locked package dependencies:

```bash
npm install
```

> **Note on Peer Dependencies**: If encountering conflicts regarding React 18 and Three.js packages during installation, append the `--legacy-peer-deps` flag:
> ```bash
> npm install --legacy-peer-deps
> ```

### 4. Run the Development Server

Start the local Vite development server:

```bash
npm run dev
```

Open your browser and navigate to the address displayed in the terminal output (default: `http://localhost:5173`).

---

## 📁 Directory Structure

```text
tattooyar/
├── frontend/
│   ├── public/
│   │   ├── models/
│   │   │   └── body_parts/        # Static 3D models (.glb files)
│   │   │       ├── arm_left.glb
│   │   │       ├── arm_right.glb
│   │   │       ├── full_body.glb
│   │   │       ├── head.glb
│   │   │       ├── leg_left.glb
│   │   │       ├── leg_right.glb
│   │   │       └── torso.glb
│   │   └── sample_tattoos/        # Demo tattoo textures and mock assets
│   ├── src/
│   │   ├── assets/                # Icons and static brand assets
│   │   ├── Canvas3D.jsx           # R3F Canvas, environment lighting, and mesh loaders
│   │   ├── App.jsx                # Multi-step state machine, sidebar panels, and physics sliders
│   │   ├── index.css              # Global styles and resets
│   │   └── main.jsx               # Application entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore                     # Git ignore rules for node_modules and logs
└── README.md                      # Project documentation and onboarding guide
```

---

## 🧪 Available Scripts

Inside the `frontend/` directory, you can run:

- `npm run dev`: Starts the local development server with Hot Module Replacement (HMR).
- `npm run build`: Bundles production-optimized assets into `frontend/dist/`.
- `npm run preview`: Locally previews the production build output.
- `npm run lint`: Runs ESLint to check for code quality and syntax issues.