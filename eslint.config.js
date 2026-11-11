import pluginVue from 'eslint-plugin-vue';
import esbuild from 'esbuild';
import * as espree from 'espree';

const tsEsbuildParser = {
  meta: {
    name: 'ts-esbuild-espree-parser',
    version: '1.0.0',
  },
  parseForESLint(code) {
    const transformed = esbuild.transformSync(code, {
      loader: 'ts',
      target: 'esnext',
      format: 'esm',
    });
    const ast = espree.parse(transformed.code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      loc: true,
      range: true,
      tokens: true,
      comment: true,
    });
    return {
      ast,
      services: {},
      scopeManager: null,
      visitorKeys: espree.VisitorKeys,
    };
  },
};

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsEsbuildParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsEsbuildParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/valid-define-props': 'off',
      'vue/valid-define-emits': 'off',
    },
  },
];
