import React from 'react';
import { BundleScript, BundleStylesheet } from 'calmly';

export const Layout = ({ children }) => {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>multiple_pages_with_js_css</title>
        <BundleStylesheet />
      </head>
      <body>
        {children}
        <BundleScript />
      </body>
    </html>
  );
};
