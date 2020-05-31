import { createElement, ScriptHTMLAttributes, LinkHTMLAttributes } from 'react';

export const usePlaceholder = (placeholderId: string) => {
  return createElement('style', null, `#${placeholderId}{}`);
};

export const PH_SCRIPT_TAG = 'scriptTag';
export const PH_STYLESHEET_TAG = 'stylesheetTag';

const RAND = '84be1ebca008480219397ad7ddc90bb3';
export const PLACEHOLDER_ID_BUNDLE_SCRIPT = `__calmly_placeholder_id_bundle_script_${RAND}__`;
export const PLACEHOLDER_ID_BUNDLE_STYLESHEET = `__calmly_placeholder_id_bundle_stylesheet_${RAND}__`;

export type BundleScriptProps = Omit<ScriptHTMLAttributes<HTMLScriptElement>, 'src'>;

export const BundleScript = (props: BundleScriptProps) => {
  const attrs = {
    id: PLACEHOLDER_ID_BUNDLE_SCRIPT,
    'data-data': JSON.stringify({ props }),
  };
  return createElement('template', attrs, null);
};

export type BundleStylesheetProps = Omit<LinkHTMLAttributes<HTMLLinkElement>, 'href'>;

export const BundleStylesheet = (props: BundleStylesheetProps) => {
  const attrs = {
    id: PLACEHOLDER_ID_BUNDLE_STYLESHEET,
    'data-data': JSON.stringify({ props }),
  };
  return createElement('template', attrs, null);
};
