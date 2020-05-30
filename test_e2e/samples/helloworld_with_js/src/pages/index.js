import React from 'react';
import calmly from 'calmly';

export default function Index() {
  calmly.useClientJS('src/index.client.js');
  const scriptTag = calmly.usePlaceholder(calmly.PH_SCRIPT_TAG);
  return (
    <body>
      <h1 id="hello">Hello</h1>
      <div>content</div>
      {scriptTag}
    </body>
  );
}
