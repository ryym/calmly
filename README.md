# Calmly

_Build a website with React, Run it without React_

## About

[react]: https://reactjs.org/

Calmly is a static website generator for [React][react].
You can use React to construct web pages and Calmly generate static HTML files from that.
The difference with similar tools is that the generated HTML does NOT load JavaScript code by default, including React.

In other words, **Calmly runs React only at the build time**.

1. Write a component.

   ```javascript
   export const IndexPage = () => {
     const name = 'world';
     return <h1>Hello, {name}!</h1>;
   };
   ```

2. Generate a static markup.

   ```html
   <h1>Hello, world!</h1>
   <!-- By default, no JavaScript code is included. -->
   ```

3. Serve the generated assets!

## Features

- Construct your website based on React components.
- Generate static HTML files without emitting client side JavaScript code.

Thus Calmly is suited for a website where 95% of the pages don't require JavaScript.

Additionally, you can also attach some client side JavaScript to your components as needed.
We know it is not practical nowadays to omit JavaScript completely.

### Wait, why is React necessary for static site in the first place?

This is a natural question.
If you want to create a static website but don't want to use React at runtime,
why don't you just write HTML directly or use some other template engines?
Without client side rendering, React cannot provide its killer features such as declarative UI updates based on virtual DOM diffing, powerful state/effect management by React Hooks, etc.

But we think React still shines even if it loses these functionalities, in the server side. Because:

- It encourages you to mark up HTML as a composition of reusable components. This greatly helps you keep your code base maintainable.
- You can depend on various Node.js ecosystem because JSX is just a JavaScript code.
- It works well with TypeScript that makes daily coding very comfortable thanks to helpful compiler assists.

And these features still function in the server side. That's why we want to use React just for building web pages.

### How about Gatsby or React Static?

[gatsby]: https://www.gatsbyjs.org/
[react-static]: https://github.com/react-static/react-static

[Gatsby][gatsby] and [React Static][react-static] are soooo nice tool to build a static site!
Recently I built some websites using Gatsby and it was so much fun!
But they load React on the client side in any page, to provide some client side features like SPA.
However, not all websites require such a rich and dynamic content.
some websites mostly consist of static pages.
For those sites, loading bunch of JavaScript code including React would be less meaningful,
since its content hardly change after their initial renders.

This is where Camly fits in.
Using Calmly you can generate JavaScript-free web pages with React,
while you can bundle a few client side JavaScript code per component as well only if necessary.

## How to use

TODO
