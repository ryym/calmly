import { createElement } from '../calmly';

import clientJs from './Hoge.client.js';

export const Hoge = ({ name }) => {
  return (
    <div>
      <div>Hoge</div>
      <p>Hello, {name}!</p>
    </div>
  );
};

Hoge.calmlyConfig = { onClient: clientJs };
