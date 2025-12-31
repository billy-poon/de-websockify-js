import commonJS from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import path from 'path'
import { defineConfig } from 'rollup'
import esbuild from 'rollup-plugin-esbuild'
import url from 'url'
import pkg from './package.json' with { type: 'json' }

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const input = path.join(__dirname, 'src/index.ts')
const output = path.join(__dirname, 'dist', pkg.name + '.js')

const plugins = [
    replace({
        preventAssignment: true,
        values: {
            'process.env.COMMAND_NAME': JSON.stringify(path.basename(output))
        }
    }),
    esbuild({
        charset: 'utf8',
        minify: false,
    }),
    commonJS(),
    resolve(),
]

const result = defineConfig({
    input,
    output: {
        file: output,
        format: 'commonjs',
        banner: '#!/usr/bin/env node'
    },
    plugins,
})

export default result
