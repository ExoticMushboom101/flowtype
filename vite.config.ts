import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local dev, tests and root-domain hosting use "/". GitHub Pages project sites are
// served from "/<repo>/", so the deploy workflow sets BASE_PATH=/flowtype/.
const base = process.env.BASE_PATH || "/";

export default defineConfig({ base, plugins: [react()] });
