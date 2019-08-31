const React = require('react');

let Global = {
  configs: [],
};

module.exports = {
  resetGlobal: () => {
    const current = Global;
    Global = { configs: [] };
    return current;
  },

  createElement: (elm, props, ...children) => {
    if (typeof elm === 'function' && elm.calmlyConfig) {
      Global.configs.push(elm.calmlyConfig);
    }
    return React.createElement(elm, props, ...children);
  },
};
