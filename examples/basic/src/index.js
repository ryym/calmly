import React from 'react';
import { useClientJS } from 'calmly';
import { ServerStyleSheet } from 'styled-components';
import { Layout } from './Layout';
import { Greeter } from './Greeter';

const Welcome = ({ builtAt }) => {
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

const About = () => {
  return (
    <Layout>
      <h1>About page</h1>
      <p>This page is completely static.</p>
    </Layout>
  );
};

export const pages = {
  index: () => <Welcome builtAt={new Date()} />,
  about: About,
};

export const renderHTML = (dom, render) => {
  const sheet = new ServerStyleSheet();
  const html = render(sheet.collectStyles(dom));
  const styleTags = sheet.getStyleTags();
  html.replace('styled-components-style-tags', styleTags);
  return html;
};
