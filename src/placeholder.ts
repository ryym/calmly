import { createElement, ScriptHTMLAttributes } from 'react';

export const usePlaceholder = (placeholderId: string) => {
  return createElement('style', null, `#${placeholderId}{}`);
};

export const PH_SCRIPT_TAG = 'scriptTag';
export const PH_STYLESHEET_TAG = 'stylesheetTag';

const RAND = '84be1ebca008480219397ad7ddc90bb3';
export const PLACEHOLDER_ID_BUNDLE_SCRIPT = `__calmly_placeholder_id_bundle_script_${RAND}__`;

export type BundleScriptProps = Omit<ScriptHTMLAttributes<HTMLScriptElement>, 'src'>;

export const BundleScript = (props: BundleScriptProps) => {
  const attrs = {
    id: PLACEHOLDER_ID_BUNDLE_SCRIPT,
    'data-data': JSON.stringify({ props }),
  };
  return createElement('template', attrs, null);
};
