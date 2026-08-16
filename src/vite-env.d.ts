/// <reference types="vite/client" />

// Declared here rather than in global.d.ts: that file has top-level imports,
// which makes it a module, so an ambient `declare module` inside it is not
// registered globally. This file is a global script, so it works here.
declare module "*.glb";
