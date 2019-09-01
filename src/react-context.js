const { createElement, createContext, useContext } = require('react');

const CalmlyContext = createContext();

const useClientJS = filePath => {
  const state = useContext(CalmlyContext);
  state.paths.push(filePath);
};

const h = createElement;

const usePlaceholder = () => {
  return key => h('style', null, `#${key}{}`);
};

const useScriptTagPlaceholder = () => {
  return h('style', null, '#scriptTag{}');
};

module.exports = { CalmlyContext, useClientJS, useScriptTagPlaceholder, usePlaceholder };
