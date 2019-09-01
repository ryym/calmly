import React from 'react';
import { useClientJS, React as React2 } from 'calmly';

console.log('---', React === React2);

export const Greeter = ({ name }) => {
  useClientJS('src/Greeter.client.js');
  return (
    <div>
      <h1 id="greeting">Hello, {name}!</h1>
    </div>
  );
};
