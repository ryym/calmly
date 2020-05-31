import React from 'react';
import { Layout } from '../components/Layout';
import '../common.css';
import '../about.css';

export default function About() {
  return (
    <Layout>
      <h1>About</h1>
      <p>This is about page</p>
      <a href="/">Home</a>
    </Layout>
  );
}
