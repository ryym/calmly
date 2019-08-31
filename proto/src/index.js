import { IndexPage } from './pages/index';
import { AboutPage } from './pages/about';
import { createElement } from '../calmly';

export const pages = {
  index: () => <IndexPage />,
  about: () => <AboutPage />,
};
