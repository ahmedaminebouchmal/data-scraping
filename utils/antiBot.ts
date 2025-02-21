import { getRandom } from 'random-useragent';

export const getRandomUserAgent = () => getRandom();

export const humanDelay = (min = 1000, max = 3000) => 
  new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
