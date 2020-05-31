import cheerio from 'cheerio';
import { PLACEHOLDER_ID_BUNDLE_SCRIPT } from './placeholder';

export interface RenderingContext {
  readonly bundleJSPath: string | null;
}

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

  renderPages(ctx: RenderingContext): Page[] {
    return this.templates.map((t) => {
      const html = t.template.render(ctx);
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

  constructor(private readonly html: string, readonly clientJsPaths: string[]) {
    this.replacements = [];
  }

  replace(key: string, value: string) {
    this.replacements.push({ key, value });
  }

  render(ctx: RenderingContext): string {
    const $ = cheerio.load(this.html);

    // Inject the bundle JS script tag if necessary.
    const $jsPlaceholders = $(`#${PLACEHOLDER_ID_BUNDLE_SCRIPT}`);
    if ($jsPlaceholders.length > 1) {
      throw new Error('multiple BundleScript exists but this is nonsense');
    }
    if ($jsPlaceholders.length > 0) {
      const $jsPlaceholder = $jsPlaceholders.first();
      if (ctx.bundleJSPath == null) {
        $jsPlaceholder.remove();
      } else {
        const data = JSON.parse($jsPlaceholder.attr('data-data')!);
        const $script = $('<script>').attr({ ...data.props, src: `/${ctx.bundleJSPath}` })!;
        $jsPlaceholder.replaceWith($script);
      }
    }

    return $.html();
  }
}
