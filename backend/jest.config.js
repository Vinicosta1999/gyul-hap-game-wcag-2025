module.exports = {
    testEnvironment: "node",
    testMatch: [
        "**/__tests__/**/*.test.js",
        "**/?(*.)+(spec|test).js?(x)"
    ],
    transform: {
        "^.+\\\.js$": "babel-jest"
    },
    moduleFileExtensions: ["js", "json", "jsx", "node"],
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "json"],
    verbose: true
};

