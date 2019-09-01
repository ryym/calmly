import React from 'react';
import styled from 'styled-components';
import { useClientJS } from 'calmly';

const Title = styled.h1`
  color: red;
`;

export const Greeter = ({ name }) => {
  useClientJS('src/Greeter.client.js');
  return (
    <div>
      <Title id="greeting">Hello, {name}!</Title>
    </div>
  );
};
