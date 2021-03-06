import React from 'react';
import { useClientJS } from 'calmly';
import { Layout } from '../Layout';
import { Greeter } from '../Greeter';

import '../common.css';

const Index = ({ builtAt }) => {
  useClientJS('src/index.client.js');
  return (
    <Layout>
      <main>
        <p>Welcome page. This page was built at {builtAt.toString()}</p>
        <Greeter name="world" />
      </main>
    </Layout>
  );
};

export default Index;

export const getInitialProps = () => {
  return { builtAt: new Date() };
};
