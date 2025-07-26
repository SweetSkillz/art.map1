module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": "latest",
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "object-curly-spacing": "off", // Desativa para corrigir o erro de deploy.
    "linebreak-style": "off", // Ignora diferenças de quebra de linha entre Windows/Linux.
    "require-jsdoc": "off", // Desativa a exigência de comentários JSDoc.
    "max-len": ["error", { "code": 120, "ignoreUrls": true }], // Aumenta o comprimento máximo da linha.
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    "no-unused-vars": ["error", {"argsIgnorePattern": "^_"}],
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
