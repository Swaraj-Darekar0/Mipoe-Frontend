import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// react-three-fiber treats hyphenated JSX props (e.g. "position-x") as nested
// property paths on the underlying three.js object. lovable-tagger's dev-only
// componentTagger injects a `data-lov-id` attribute on every JSX element,
// which crashes any r3f element it doesn't already know about (e.g. the
// custom `meshLineGeometry`/`meshLineMaterial` elements registered via
// `extend()` in Lanyard.tsx) with "Cannot read properties of undefined
// (reading 'lov')". Skip tagging for files that render a react-three-fiber
// scene so this dev-only instrumentation can't reach those elements.
function taggerSkippingR3F() {
  const tagger = componentTagger();
  const originalTransform = tagger.transform as (this: unknown, code: string, id: string, options?: unknown) => unknown;
  tagger.transform = function (code: string, id: string, options?: unknown) {
    if (id.includes("/persona/Lanyard.tsx") || id.includes("\\persona\\Lanyard.tsx")) {
      return null;
    }
    return originalTransform.call(this, code, id, options);
  };
  return tagger;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  assetsInclude: ["**/*.glb"],
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    taggerSkippingR3F(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
