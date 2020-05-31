import cheerio from 'cheerio';
import {
  Placeholder,
  PlaceholderResolver,
  bundleStylesheetResolver,
  bundleScriptResolver,
} from './placeholder';
import { ClientJS } from './client-js-registry';

export interface RenderingContext {
  readonly bundleJSPath?: string;
  readonly bundleCSSPath?: string;
}

export class PageGroup {
  constructor(readonly name: string, private readonly templates: NamedPageTemplate[]) {
    if (templates.length === 0) {
      throw new Error('PageGroup templates must not be empty');
    }
  }

  getClientJSPaths(): string[] {
    // All templates shares same client scripts.
    return this.templates[0].template.clientJSs.map((c) => c.filePath);
  }

  renderPages(ctx: RenderingContext): Page[] {
    return this.templates.map(({ name, template }) => {
      const jsArgsList = template.clientJSs.map((c) => c.args);
      template.resolvePlaceholder(bundleScriptResolver(ctx.bundleJSPath, jsArgsList));

      template.resolvePlaceholder(bundleStylesheetResolver(ctx.bundleCSSPath));

      const html = template.render();
      return { name: name, html };
    });
  }
}

export interface Page {
  readonly name: string;
  readonly html: string;
}

export interface NamedPageTemplate {
  readonly name: string;
  readonly template: PageTemplate;
}

export class PageTemplate {
  private readonly placeholderResolvers: PlaceholderResolver<any>[] = [];

  constructor(private readonly html: string, readonly clientJSs: ClientJS[]) {}

  resolvePlaceholder<T = {}>(resolver: PlaceholderResolver<T>): void;
  resolvePlaceholder<T = {}>(selector: string, resolve: (data: T) => any): void;
  resolvePlaceholder(
    resolverOrSelector: string | PlaceholderResolver<any>,
    resolve?: ((data: any) => any) | any
  ): void {
    let resolver: PlaceholderResolver<any> | null = null;
    if (resolve === undefined) {
      resolver = resolverOrSelector as PlaceholderResolver<any>;
    } else {
      resolver = { selector: resolverOrSelector as string, resolve };
    }
    this.placeholderResolvers.push(resolver);
  }

  render(): string {
    const $ = cheerio.load(this.html);

    for (let resolver of this.placeholderResolvers) {
      const $placeholders = $(resolver.selector);
      for (let i = 0; i < $placeholders.length; i++) {
        const $placeholder = $placeholders.eq(i);
        const data = JSON.parse($placeholder.attr(Placeholder.dataAttributeName) || 'null');
        const replacement = resolver.resolve(data);
        $placeholder.replaceWith(replacement);
      }
    }

    return $.html();
  }
}
