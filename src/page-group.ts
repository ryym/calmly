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
    this.templates.forEach(t => t.template.replace(key, value));
  }

  renderPages(): Page[] {
    return this.templates.map(t => {
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

  constructor(private readonly html: string, readonly clientJsPaths: string[]) {
    this.replacements = [];
  }

  replace(key: string, value: string) {
    this.replacements.push({ key, value });
  }

  render(): string {
    const html = this.replacements.reduce((s, r) => {
      // TODO: Do more practical and secure replacement..
      return s.replace(`<style>#${r.key}{}</style>`, r.value);
    }, this.html);
    return html;
  }
}
