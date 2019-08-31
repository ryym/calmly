module.exports = {
  plugins: ['@babel/plugin-syntax-import-meta'],
  presets: [['@babel/preset-react', { pragma: 'createElement' }]],
  // presets: ['@babel/preset-react'],
};
