import React from 'react';
import calmly from 'calmly';
import '../index.css';

export default function Index() {
  calmly.useClientJS('src/index.client.js');
  return (
    <>
      <head>
        <calmly.BundleStylesheet />
      </head>
      <body>
        <h1 id="hello">Hello</h1>
        <div>content</div>
        <calmly.BundleScript />
      </body>
    </>
  );
}
