import React from 'react';
import { useClientJS } from 'calmly';
import { Layout } from '../components/Layout';
import '../common.css';

export default function Index() {
  useClientJS('src/common.client.js');
  useClientJS('src/index.client.js');
  return (
    <Layout>
      <h1>Index</h1>
      <p>This is index page</p>
      <a href="/about">About</a>
    </Layout>
  );
}
