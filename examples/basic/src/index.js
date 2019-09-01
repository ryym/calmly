import React from 'react';
import { page, useClientJS } from 'calmly';
import { Layout } from './Layout';
import { Greeter } from './Greeter';

const Welcome = ({ name, layout }) => {
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
  // index: ({ scriptUrl }) => page(<Welcome layout={{ scriptUrl }} />),
  index: page(cfg => <Welcome layout={{ scriptUrl: cfg.scriptUrl }} />),
  about: page(About),
  // index: ({ scriptUrl }) => <Welcome layout={{ scriptUrl }} />,
  // about: () => <About layout={{}} />,
};
