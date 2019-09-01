import React from 'react';
import { usePlaceholder } from 'calmly';

export const Layout = ({ children }) => {
  const { scriptTag } = usePlaceholder();
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
