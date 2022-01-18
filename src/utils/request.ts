import cheerio from 'cheerio';
import axios from 'axios';

interface Options {
  scrapy: boolean;
  parse: boolean;
}

export const fetchData = async (
  url: string,
  options?: Options,
): Promise<any> => {
  if (options !== undefined) {
    if (options.scrapy) {
      const response = await axios.get(url);
      return await cheerio.load(response.data);
    }

    if (options.parse) {
      const response = await axios.get(url);
      return response.data;
    }
  } else {
    return await axios.get(url);
  }
};
