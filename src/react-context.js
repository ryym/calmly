const { createElement, createContext, useContext } = require('react');

const CalmlyContext = createContext();

const useClientJS = filePath => {
  const state = useContext(CalmlyContext);
  state.paths.push(filePath);
};

const h = createElement;

const usePlaceholder = () => {
  const scriptTag = h('style', null, '#scriptTag{}');
  return { scriptTag };
};

module.exports = { CalmlyContext, useClientJS, usePlaceholder };
