import React from 'react';
import { useScriptTagPlaceholder, usePlaceholder } from 'calmly';

export const Layout = ({ children }) => {
  const scriptTag = useScriptTagPlaceholder();
  const placeholder = usePlaceholder();
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>Welcome</title>
        {placeholder('styled-components-style-tags')}
      </head>
      <body>
        {children}
        {scriptTag}
      </body>
    </html>
  );
};
