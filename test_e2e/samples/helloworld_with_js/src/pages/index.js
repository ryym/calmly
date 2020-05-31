import React from 'react';
import calmly from 'calmly';

export default function Index() {
  calmly.useClientJS('src/index.client.js');
  return (
    <body>
      <h1 id="hello">Hello</h1>
      <div>content</div>
      <calmly.BundleScript className="hello-script" />
    </body>
  );
}
