const { createContext, useContext } = require('react');

const CalmlyContext = createContext();

const useClientJS = filePath => {
  const state = useContext(CalmlyContext);
  state.paths.push(filePath);
};

module.exports = { CalmlyContext, useClientJS };
