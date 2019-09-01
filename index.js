const React = require('react');
const { createContext, useContext } = React;

const CalmlyContext = createContext();

const useClientJS = filePath => {
  const state = useContext(CalmlyContext);
  state.paths.push(filePath);
};

const page = component => ({ contextState, pageProps }) => {
  return React.createElement(
    CalmlyContext.Provider,
    { value: contextState },
    component(pageProps)
  );
};

module.exports = { CalmlyContext, useClientJS, React, page };
