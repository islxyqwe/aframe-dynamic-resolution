import buble from 'rollup-plugin-buble'
import typescript from 'rollup-plugin-typescript'
import { uglify } from 'rollup-plugin-uglify'
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: 'src/main.ts',
  output: {
    name: 'AFRAME_DynaimcResolutionComponent',
    file: 'dist/aframe-dynamic-resolution.js',
    format: 'umd',
    globals: {
      aframe: 'AFRAME'
    },
    sourcemap: true
  },
  plugins: [resolve(), typescript(), buble(), uglify()],
  external: ['aframe']
}
