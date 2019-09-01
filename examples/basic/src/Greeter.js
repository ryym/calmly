import React from 'react';
import { useClientJS } from 'calmly';

export const Greeter = ({ name }) => {
  useClientJS('src/Greeter.client.js');
  return (
    <div>
      <h1 id="greeting">Hello, {name}!</h1>
    </div>
  );
};
