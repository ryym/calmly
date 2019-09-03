import React from 'react';
import { usePlaceholder, PH_SCRIPT_TAG, PH_STYLESHEET_TAG } from 'calmly';

export const Layout = ({ children }) => {
  const scriptTag = usePlaceholder(PH_SCRIPT_TAG);
  const stylesheetTag = usePlaceholder(PH_STYLESHEET_TAG);
  const styledComponentsTag = usePlaceholder('styled-components-style-tags');
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>Welcome</title>
        {stylesheetTag}
        {styledComponentsTag}
      </head>
      <body>
        {children}
        {scriptTag}
      </body>
    </html>
  );
};
