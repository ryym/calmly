import React from 'react';

export const Layout = ({ children, scriptUrl }) => {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>Welcome</title>
      </head>
      <body>
        {children}
        {scriptUrl && <script src={scriptUrl} />}
      </body>
    </html>
  );
};
