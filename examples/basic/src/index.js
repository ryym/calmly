import React from 'react';

const Welcome = ({ name }) => {
  return <h1>Hello, {name}!</h1>;
};

export const pages = {
  index: () => <Welcome name="world" />,
};
