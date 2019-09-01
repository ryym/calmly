import React from 'react';
import { useScriptTagPlaceholder } from 'calmly';

export const Layout = ({ children }) => {
  const scriptTag = useScriptTagPlaceholder();
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>Welcome</title>
      </head>
      <body>
        {children}
        {scriptTag}
      </body>
    </html>
  );
};
