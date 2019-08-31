const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const ReactDOMServer = require('react-dom/server');

const calmly = require('./calmly');

const compiler = webpack({
  mode: 'development',
  entry: path.join(__dirname, 'src'),
  output: {
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
  },
  // これも含めてビルドしちゃうと HTML 生成側と dist 側で別々のファイルを参照してしまい、
  // メモリ (global variable) を共有できない。
  externals: /\.\.\/calmly$/,
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader'],
        exclude: /\.client\.js$/,
      },
      {
        test: /\.client\.js$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.png$/,
        use: ['file-loader'],
      },
    ],
  },
});

compiler.run((err, stats) => {
  if (stats.hasErrors() || stats.hasWarnings()) {
    console.log(stats.toString({ chunks: false, colors: true }));
    return;
  }
  console.log('compile end');

  const { pages } = require('./dist/main');
  calmly.resetGlobal();
  const entries = {};
  Object.keys(pages).forEach((name, entryIdx) => {
    const domTree = pages[name]();

    let html = ReactDOMServer.renderToStaticMarkup(domTree);

    const global = calmly.resetGlobal();
    console.log(global);

    let js = '';
    global.configs.forEach((c, i) => {
      js += `import {onRendered as _${i}} from '../${c.onClient}';`;
    });
    js += '\n';
    global.configs.forEach((c, i) => {
      js += `_${i}();`;
    });
    console.log(js);

    fs.writeFileSync(`./tmp/${name}.js`, js);
    entries[`client-${entryIdx}`] = `./tmp/${name}.js`;

    html = html.replace('---js---', `/client-${entryIdx}.js`);
    fs.writeFileSync(`./dist/${name}.html`, html);
  });

  const compiler2 = webpack({
    mode: 'development',
    entry: entries,
    output: {
      path: path.join(__dirname, 'dist'),
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: ['babel-loader'],
        },
      ],
    },
  });

  console.log('building js');
  compiler2.run((err, stats) => {
    console.log(stats.toString({ colors: true }));
  });
});
