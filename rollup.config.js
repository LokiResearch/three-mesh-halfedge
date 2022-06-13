import typescript from '@rollup/plugin-typescript';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs'
import htmlTemplate from 'rollup-plugin-generate-html-template';

const lib_cfg = {
  input: 'src/index.ts',
  external: ['three'],
  output: [
    {
      name: 'MeshHalfEdgeLib',
      format: 'umd',
      file: 'build/index.umd.js',
      sourcemap: true,
      globals: {
        'three':'three'
      }
    },
    {
      format: 'esm',
      file: 'build/index.esm.js',
      sourcemap: true,
    }
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      compilerOptions: {
        "sourceMap": true,
        "declaration": true,
        "declarationMap": true,
        "declarationDir": "types",
      },
      exclude: ["examples/*"]
    })
  ]
};

const examples = ['ExtractSilhouette'];

const examples_cfg = []

for (const example of examples) {
  examples_cfg.push(
  {
    input: `examples/${example}.ts`,
    output: {
      file: `build-examples/examples/${example}.js`,
    },
    plugins: [
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
      }),
      nodeResolve(),
      htmlTemplate({
        template: `examples/${example}.html`,
        target: `${example}.html`,
      }),
    ]
  }
  );
}


let exported;
if (process.env.examples) {
  exported = examples_cfg;
} else {
  exported = lib_cfg;
}

export default exported;
