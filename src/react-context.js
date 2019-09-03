const { createElement, createContext, useContext } = require('react');

const CalmlyContext = createContext();

const useClientJS = filePath => {
  const state = useContext(CalmlyContext);
  state.paths.push(filePath);
};

const h = createElement;

const usePlaceholder = placeholderId => {
  return h('style', null, `#${placeholderId}{}`);
};

const PH_SCRIPT_TAG = 'scriptTag';
const PH_STYLESHEET_TAG = 'stylesheetTag';

module.exports = {
  CalmlyContext,
  useClientJS,
  usePlaceholder,
  PH_SCRIPT_TAG,
  PH_STYLESHEET_TAG,
};
