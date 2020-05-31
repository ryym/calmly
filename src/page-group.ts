import cheerio from 'cheerio';
import { Placeholder, PlaceholderResolver } from './placeholder';

export class PageGroup {
  constructor(readonly name: string, private readonly templates: NamedPageTemplate[]) {
    if (templates.length === 0) {
      throw new Error('PageGroup templates must not be empty');
    }
  }

  get clientJsPaths(): string[] {
    // All templates shares same client scripts.
    return this.templates[0].template.clientJsPaths;
  }

  replace(key: string, value: string) {
    this.templates.forEach((t) => t.template.replace(key, value));
  }

  resolvePlaceholder<T = {}>(resolver: PlaceholderResolver<T>): void {
    this.templates.forEach((t) => t.template.resolvePlaceholder(resolver));
  }

  renderPages(): Page[] {
    return this.templates.map((t) => {
      const html = t.template.render();
      return { name: t.name, html };
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
  private readonly replacements: { key: string; value: string }[];
  private readonly placeholderResolvers: PlaceholderResolver<any>[] = [];

  constructor(private readonly html: string, readonly clientJsPaths: string[]) {
    this.replacements = [];
  }

  replace(key: string, value: string) {
    this.replacements.push({ key, value });
  }

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
      const $placeholders = $(`#${resolver.placeholderId}`);
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
