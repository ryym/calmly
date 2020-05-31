import React from 'react';
import calmly from 'calmly';

export default function Index() {
  return (
    <>
      <head>
        <calmly.BundleStylesheet />
      </head>
      <body>
        <h1>No script tag and link tag should be rendered</h1>
        <calmly.BundleScript />
      </body>
    </>
  );
}
