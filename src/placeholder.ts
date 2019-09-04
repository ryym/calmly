import { createElement } from 'react';

export const usePlaceholder = (placeholderId: string) => {
  return createElement('style', null, `#${placeholderId}{}`);
};

export const PH_SCRIPT_TAG = 'scriptTag';
export const PH_STYLESHEET_TAG = 'stylesheetTag';
