import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vite.config';

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			setupFiles: ['src/test/integration.setup.ts']
		}
	})
);
