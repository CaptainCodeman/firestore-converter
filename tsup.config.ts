import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/lib/index.ts', 'src/lib/firebase/index.ts', 'src/lib/firebase.server/index.ts'],
	format: ['esm'],
	external: ['firebase', 'firebase-admin'],
	noExternal: ['uint8array-extras'],
	splitting: true,
	sourcemap: false,
	minify: true,
	clean: true,
	dts: true
});
