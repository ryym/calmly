module.exports = {
  roots: ['src', 'test_e2e'],
  testMatch: ['**/*.test.ts'],
  verbose: true,
  preset: 'ts-jest',
  moduleFileExtensions: [
    'js',
    'ts',
    // We run webpack in E2E test and babel-loader loads json file by 'require'.
    'json',
  ],
};
