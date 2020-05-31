import { ServerStyleSheet } from 'styled-components';

export const renderHTML = (dom, render) => {
  const sheet = new ServerStyleSheet();
  const html = render(sheet.collectStyles(dom));
  const styleTags = sheet.getStyleTags();
  html.resolvePlaceholder('#styled-components-style-tags', () => styleTags);
  return html;
};
