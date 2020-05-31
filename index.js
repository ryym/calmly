const { BundleScript, BundleStylesheet, Placeholder } = require('./dist/lib/placeholder');
const { useClientJS } = require('./dist/lib/client-js-registry');

module.exports = {
  useClientJS,
  BundleScript,
  BundleStylesheet,
  Placeholder,
};
