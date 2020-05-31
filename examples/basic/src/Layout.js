import React from 'react';
import { BundleScript, BundleStylesheet, Placeholder } from 'calmly';

export const Layout = ({ children }) => {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>Welcome</title>
        <BundleStylesheet />
        <Placeholder id="styled-components-style-tags" />
      </head>
      <body>
        {children}
        <BundleScript />
      </body>
    </html>
  );
};
