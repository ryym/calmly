import React from 'react';
import { useClientJS } from 'calmly';
import { Layout } from './Layout';
import { Greeter } from './Greeter';

const Welcome = ({ layout }) => {
  useClientJS('src/index.client.js');
  return (
    <Layout {...layout}>
      <main>
        <p>Welcome page</p>
        <Greeter name="world" />
      </main>
    </Layout>
  );
};

const About = () => {
  return (
    <Layout>
      <h1>About page</h1>
      <p>This page is completely static.</p>
    </Layout>
  );
};

export const pages = {
  index: ({ scriptUrl }) => <Welcome layout={{ scriptUrl }} />,
  about: About,
};
