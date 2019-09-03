import React from 'react';
import { Layout } from '../../Layout';
import imgSample from '../../img/sample.jpg';

import '../../common.css';
import '../../about.css';

const About = () => {
  return (
    <Layout>
      <h1>About page</h1>
      <p>This page is completely static.</p>
      <img src={imgSample} alt="" style={{ maxWidth: '200px' }} />
    </Layout>
  );
};

export default About;
