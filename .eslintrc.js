module.exports = {
    root: true,
    parserOptions: {
        sourceType: "module"
    },
    env: {
        browser: true,
        node: true
    },
    extends: [
        // 'plugin:vue/essential',
        // "plugin:vue/base",
        "standard"
    ],
    globals: {
        __static: true
    },
    plugins: ["html"],
    rules: {
        indent: ["error", 4],
        "space-before-function-paren": ["error", "never"],
        // allow paren-less arrow functions
        "arrow-parens": 0,
        // allow async-await
        "generator-star-spacing": 0,
        // allow debugger during development
        "no-debugger": process.env.NODE_ENV === "production" ? 2 : 0,
        "no-unused-vars": ["warn"],
        "camelcase": ["warn"]
    }
};
