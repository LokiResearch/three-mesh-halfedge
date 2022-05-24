export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,

  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  "setupFilesAfterEnv": ['./src/augments.ts']
}