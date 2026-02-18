import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Define all entry points
const entryPoints = [
  { input: 'src/index.ts', name: 'index' },
  { input: 'vue/index.ts', name: 'vue/index' },
  { input: 'angular/index.ts', name: 'angular/index' },
  { input: 'svelte/index.ts', name: 'svelte/index' },
];

// Create build configurations for each entry point
const buildConfigs = [];

// Main build configs (CJS and ESM for each entry point)
entryPoints.forEach(entry => {
  buildConfigs.push({
    input: entry.input,
    output: [
      {
        file: `dist/cjs/${entry.name}.js`,
        format: 'cjs',
        sourcemap: true
      },
      {
        file: `dist/esm/${entry.name}.js`,
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      resolve({
        browser: true,
      }),
      typescript({
        tsconfig: './tsconfig.json',
        jsx: 'react' // Use classic JSX transform
      })
    ],
    external: ['react', 'react-dom', 'vue', '@angular/core']
  });
});

// Type definition configs for each entry point
entryPoints.forEach(entry => {
  buildConfigs.push({
    input: entry.input,
    output: [{ file: `dist/${entry.name}.d.ts`, format: 'es' }],
    plugins: [dts()],
  });
});

// Add React adapter specific build (since it's in the main source)
buildConfigs.push({
  input: 'src/adapters/react/useLazyList.ts',
  output: [
    {
      file: 'dist/cjs/adapters/react/useLazyList.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/esm/adapters/react/useLazyList.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    resolve({
      browser: true,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      jsx: 'react'
    })
  ],
  external: ['react', 'react-dom']
});

buildConfigs.push({
  input: 'src/adapters/react/LazyList.tsx',
  output: [
    {
      file: 'dist/cjs/adapters/react/LazyList.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/esm/adapters/react/LazyList.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    resolve({
      browser: true,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      jsx: 'react' // Use classic JSX transform
    })
  ],
  external: ['react', 'react-dom']
});

// React adapter specific build
buildConfigs.push({
  input: 'src/adapters/react/index.ts',
  output: [
    {
      file: 'dist/cjs/adapters/react/index.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/esm/adapters/react/index.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    resolve({
      browser: true,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      jsx: 'react' // Use classic JSX transform
    })
  ],
  external: ['react', 'react-dom']
});

// Type definitions for React adapter
buildConfigs.push({
  input: 'src/adapters/react/useLazyList.ts',
  output: [{ file: 'dist/adapters/react/useLazyList.d.ts', format: 'es' }],
  plugins: [dts()],
});

buildConfigs.push({
  input: 'src/adapters/react/LazyList.tsx',
  output: [{ file: 'dist/adapters/react/LazyList.d.ts', format: 'es' }],
  plugins: [dts()],
});

// Type definition for React adapter index
buildConfigs.push({
  input: 'src/adapters/react/index.ts',
  output: [{ file: 'dist/adapters/react/index.d.ts', format: 'es' }],
  plugins: [dts()],
});

export default buildConfigs;