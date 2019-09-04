import { createElement, createContext, useContext } from 'react';

export interface CalmlyContext {
  readonly paths: string[];
}

export const CalmlyContext = createContext<CalmlyContext>({ paths: [] });

export const useClientJS = (filePath: string) => {
  const state = useContext(CalmlyContext);
  state.paths.push(filePath);
};

export const usePlaceholder = (placeholderId: string) => {
  return createElement('style', null, `#${placeholderId}{}`);
};

export const PH_SCRIPT_TAG = 'scriptTag';
export const PH_STYLESHEET_TAG = 'stylesheetTag';
