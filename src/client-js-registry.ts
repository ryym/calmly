import { useContext, createContext, createElement } from 'react';

export interface ClientJSEntries {
  paths: string[];
}

export interface Registerer {
  register(filePath: string, args: any[]): void;
}

const Context = createContext<Registerer>({
  register() {
    throw new Error('this is dummy registerer');
  },
});

// XXX: It is nice if the path can be relative from the component file.
export const useClientJS = (filePath: string, ...args: any[]) => {
  const registerer = useContext(Context);
  registerer.register(filePath, args);
};

export interface ClientJS {
  readonly filePath: string;
  readonly args: any[];
}

export class ClientJSRegistry {
  private clientJSs: ClientJS[] = [];
  private setupDone = false;

  setupRegistration(rootDom: any): any {
    this.setupDone = true;
    const registerer = {
      register: (filePath: string, args: any[]) => {
        this.clientJSs.push({ filePath, args });
      },
    };
    return createElement(Context.Provider, { value: registerer }, rootDom);
  }

  getClientJSs(): ClientJS[] | null {
    return this.setupDone ? this.clientJSs : null;
  }
}
