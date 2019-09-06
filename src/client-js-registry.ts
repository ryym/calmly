import { useContext, createContext, createElement } from 'react';

export interface ClientJSEntries {
  paths: string[];
}

export interface Registerer {
  register(path: string): void;
}

const Context = createContext<Registerer>({
  register() {
    throw new Error('this is dummy registerer');
  },
});

export const useClientJS = (filePath: string) => {
  const registerer = useContext(Context);
  registerer.register(filePath);
};

export class ClientJSRegistry {
  private paths: string[] = [];
  private setupDone = false;

  setupRegistration(rootDom: any): any {
    this.setupDone = true;
    const registerer = {
      register: (path: string) => {
        this.paths.push(path);
      },
    };
    return createElement(Context.Provider, { value: registerer }, rootDom);
  }

  getScriptSources(): string[] | null {
    return this.setupDone ? this.paths : null;
  }
}