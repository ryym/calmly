import { createElement } from '../calmly';
import { Hoge } from './Hoge';

// import { dirname } from 'path';
// import { fileURLToPath } from 'url';

// console.log('index', import.meta.url);

import someImg from '../img/tashi_kani.png';

// XXX: この方法だと dist にも index.client.js が出力されちゃうのでやっぱダメ。
// webpack にも依存するし。。 (でもこれは不可避？)
import clientJs from './index.client.js';

export const IndexPage = () => {
  return (
    <html>
      <head />
      <body>
        <h1>Index</h1>
        <Hoge name="world" />
        <a href="/about">about</a>
        <br />

        <img src={someImg} alt="たしかに" />
        <script src="---js---" />
      </body>
    </html>
  );
};

IndexPage.calmlyConfig = {
  onClient: clientJs,
};
