import { createElement, ScriptHTMLAttributes, LinkHTMLAttributes, HTMLAttributes } from 'react';
import cheerio from 'cheerio';

const RAND = '84be1ebca008480219397ad7ddc90bb3';
const PLACEHOLDER_ID_BUNDLE_SCRIPT = `__calmly_placeholder_id_bundle_script_${RAND}__`;
const PLACEHOLDER_ID_BUNDLE_STYLESHEET = `__calmly_placeholder_id_bundle_stylesheet_${RAND}__`;

export interface PlaceholderResolver<T = {}> {
  selector: string;
  resolve: (data: T) => any;
}

export type BundleScriptProps = Omit<ScriptHTMLAttributes<HTMLScriptElement>, 'src'>;

export const BundleScript = (props: BundleScriptProps) => {
  return createElement(Placeholder, { id: PLACEHOLDER_ID_BUNDLE_SCRIPT, data: { props } });
};

export type BundleStylesheetProps = Omit<LinkHTMLAttributes<HTMLLinkElement>, 'href'>;

export const BundleStylesheet = (props: BundleStylesheetProps) => {
  return createElement(Placeholder, { id: PLACEHOLDER_ID_BUNDLE_STYLESHEET, data: { props } });
};

export const bundleScriptResolver = (
  bundleJSPath: string | undefined,
  argsList: any[][]
): PlaceholderResolver => {
  const argsListJson = JSON.stringify(argsList);
  return {
    selector: `#${PLACEHOLDER_ID_BUNDLE_SCRIPT}`,
    resolve: ({ props }: any) => {
      if (bundleJSPath == null) {
        return null;
      } else {
        return cheerio('<script>').attr({
          ...props,
          src: `/${bundleJSPath}`,
          onload: `__calmly_bundle_call(${argsListJson})`,
        });
      }
    },
  };
};

export const bundleStylesheetResolver = (
  bundleCSSPath: string | undefined
): PlaceholderResolver => {
  return {
    selector: `#${PLACEHOLDER_ID_BUNDLE_STYLESHEET}`,
    resolve: ({ props }: any) => {
      if (bundleCSSPath == null) {
        return null;
      } else {
        return cheerio('<link>').attr({
          ...props,
          rel: 'stylesheet',
          href: `/${bundleCSSPath}`,
        });
      }
    },
  };
};

export type TemplateTagProps = HTMLAttributes<HTMLTemplateElement>;

export interface PlaceholderProps<T = {}> extends TemplateTagProps {
  data?: T;
}

export const Placeholder = ({ id, data }: PlaceholderProps) => {
  const dataJson = JSON.stringify(data);
  return createElement('template', { id, [Placeholder.dataAttributeName]: dataJson }, null);
};

Placeholder.dataAttributeName = 'data-data';
