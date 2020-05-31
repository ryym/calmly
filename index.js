const {
  usePlaceholder,
  PH_SCRIPT_TAG,
  PH_STYLESHEET_TAG,
  BundleScript,
} = require('./dist/lib/placeholder');
const { useClientJS } = require('./dist/lib/client-js-registry');

module.exports = {
  useClientJS,
  usePlaceholder,
  PH_SCRIPT_TAG,
  PH_STYLESHEET_TAG,
  BundleScript,
};
