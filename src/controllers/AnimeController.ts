import { NextFunction, Request, Response } from 'express';
import { fetchData } from '../utils/request';
import {
  imageUrlToBase64,
  jkanimeInfo,
  monoschinosInfo,
  tioanimeInfo,
  videoServersJK,
  videoServersMonosChinos,
  videoServersTioAnime,
} from '../utils/util';
import { transformUrlServer } from '../utils/transformerUrl';
import AnimeModel, { Anime as ModelA } from '../database/models/anime.model';
import {
  animeExtraInfo,
  getAnimeVideoPromo,
  getAnimeCharacters,
  getRelatedAnimesMAL,
} from '../utils/util';
import urls from '../utils/urls';

/*
  AnimeController - a class to manage the schedule,
  top, all the animes, return the last episodes
  with async to return promises.
*/

interface Schedule {
  title: string;
  mal_id: number;
  image_url: any;
}

interface Anime {
  index: string;
  animeId: string;
  title: string;
  id: string;
  type: string;
}

interface Top {
  rank: string;
  title: string;
  url: string;
  image_url: string;
  type: string;
  subtype: string;
  page: number;
  score: string;
}

interface Episode {
  id: string;
  title: string;
  episode: string;
  servers: { url: string; name: string }[] | unknown;
}

interface Movie {
  id: string;
  title: string;
  type: string;
  page: string;
  banner: string;
  image: string;
  synopsis: string;
  status: string;
  rate: string;
  genres: string[];
  episodes: object[];
}

export default class AnimeController {
  async schedule(req: Request, res: Response, next: NextFunction) {
    const { day } = req.params;
    let data: any;

    try {
      data = await fetchData(`${urls.BASE_JIKAN}schedule/${day}`, {
        parse: true,
        scrapy: false,
      });
    } catch (err) {
      return next(err);
    }

    const animeList: Schedule[] = data[day].map((item: Schedule) => ({
      title: item.title,
      malid: item.mal_id,
      image: item.image_url,
    }));

    if (animeList.length > 0) {
      res.status(200).json({
        day: animeList,
      });
    } else {
      res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }

  async top(req: Request, res: Response, next: NextFunction) {
    const { type, subtype, page } = req.params;
    let data: any;

    try {
      if (subtype !== undefined) {
        data = await fetchData(
          `${urls.BASE_JIKAN}top/${type}/${page}/${subtype}`,
          { parse: true, scrapy: false },
        );
      } else {
        data = await fetchData(`${urls.BASE_JIKAN}top/${type}/${page}`, {
          parse: true,
          scrapy: false,
        });
      }
    } catch (err) {
      return next(err);
    }

    const top: Top[] = data.top.map((item: Top) => ({
      rank: item.rank,
      title: item.title,
      url: item.url,
      image_url: item.image_url,
      type: type,
      subtype: subtype,
      page: page,
      score: item.score,
    }));

    if (top.length > 0) {
      return res.status(200).json({ top });
    } else {
      return res
        .status(400)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }

  async getAllAnimes(req: Request, res: Response, next: NextFunction) {
    let data: any;

    try {
      data = await fetchData(`${urls.BASE_ANIMEFLV}api/animes/list`, {
        parse: true,
        scrapy: false,
      });
    } catch (err) {
      return next(err);
    }

    const animes: Anime[] = data.map((item: any) => ({
      index: item[0],
      animeId: item[3],
      title: item[1],
      id: item[2],
      type: item[4],
    }));

    if (animes.length > 0) {
      res.status(200).send({ animes });
    } else {
      res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }

  async getLastEpisodes(req: Request, res: Response, next: NextFunction) {
    let $: cheerio.Root;

    try {
      $ = await fetchData(`${urls.BASE_MONOSCHINOS}`, {
        scrapy: true,
        parse: false,
      });
    } catch (err) {
      return next(err);
    }

    const animes: cheerio.Cheerio = $('div.animes');

    const episodeList: { id: string; title: string; episode: string }[] = animes
      .map((_index: number, element: cheerio.Element) => {
        const titleAndChapter: string[] = $(element.parent)
          .attr('href')
          ?.split('/')[4]
          .split('-episodio-')!;

        const formattedAnime: { id: string; title: string; episode: string } = {
          id: titleAndChapter[0],
          title: $(element).find('p.animetitles').text(),
          episode: titleAndChapter[1],
        };

        return formattedAnime;
      })
      .get();

    let listLastEpisodes: Episode[] = [];

    for (let i = 0; i < episodeList.length; i++) {
      listLastEpisodes.push({
        ...episodeList[i],
        servers: await videoServersMonosChinos(
          `${episodeList[i].id}-episodio-${episodeList[i].episode}`,
        ),
      });
    }

    if (listLastEpisodes.length > 0) {
      return res.status(200).json({
        lastEpisodes: listLastEpisodes,
      });
    } else {
      return res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }

  // async getContentTv(req: Request, res: Response, next: NextFunction) {
  //   const { type, page } = req.params;
  //   const url = 'tv';
  //   let data: any;

  //   try {
  //     data = await fetchData(
  //       `${urls.BASE_ANIMEFLV_JELU}${
  //         url.charAt(0).toUpperCase() + url.slice(1)
  //       }/${type}/${page}`,
  //       {
  //         parse: true,
  //         scrapy: false,
  //       },
  //     );
  //   } catch (err) {
  //     return next(err);
  //   }

  //   const animes: Movie[] = data[url].map((item: any) => {
  //     return {
  //       id: item.id,
  //       title: item.title,
  //       type: url,
  //       page: page,
  //       banner: item.banner,
  //       image: item.poster,
  //       synopsis: item.synopsis,
  //       status: item.debut,
  //       rate: item.rating,
  //       genres: item.genres.map((genre: any) => genre),
  //       episodes: item.episodes.map((episode: any) => episode),
  //     };
  //   });

  //   if (animes.length > 0) {
  //     res.status(200).json({
  //       animes,
  //     });
  //   } else {
  //     res.status(500).json({ message: 'We lost it... could not find anything :(' });
  //   }
  // }

  // async getContentSpecial(req: Request, res: Response, next: NextFunction) {
  //   const { type, page } = req.params;
  //   const url = 'special';
  //   let data: any;

  //   try {
  //     data = await fetchData(
  //       `${urls.BASE_ANIMEFLV_JELU}${
  //         url.charAt(0).toUpperCase() + url.slice(1)
  //       }/${type}/${page}`,
  //       {
  //         parse: true,
  //         scrapy: false,
  //       },
  //     );
  //   } catch (err) {
  //     return next(err);
  //   }

  //   const animes: Movie[] = data[url].map((item: any) => {
  //     return {
  //       id: item.id,
  //       title: item.title,
  //       type: url,
  //       page: page,
  //       banner: item.banner,
  //       image: item.poster,
  //       synopsis: item.synopsis,
  //       status: item.debut,
  //       rate: item.rating,
  //       genres: item.genres.map((genre: any) => genre),
  //       episodes: item.episodes.map((episode: any) => episode),
  //     };
  //   });

  //   if (animes.length > 0) {
  //     res.status(200).json({
  //       animes,
  //     });
  //   } else {
  //     res.status(500).json({ message: 'We lost it... could not find anything :(' });
  //   }
  // }

  // async getContentOva(req: Request, res: Response, next: NextFunction) {
  //   const { type, page } = req.params;
  //   const url = 'ova';
  //   let data: any;

  //   try {
  //     data = await fetchData(
  //       `${urls.BASE_ANIMEFLV_JELU}${
  //         url.charAt(0).toUpperCase() + url.slice(1)
  //       }/${type}/${page}`,
  //       {
  //         parse: true,
  //         scrapy: false,
  //       },
  //     );
  //   } catch (err) {
  //     return next(err);
  //   }

  //   const animes: Movie[] = data[url].map((item: any) => {
  //     return {
  //       id: item.id,
  //       title: item.title,
  //       type: url,
  //       page: page,
  //       banner: item.banner,
  //       image: item.poster,
  //       synopsis: item.synopsis,
  //       status: item.debut,
  //       rate: item.rating,
  //       genres: item.genres.map((genre: any) => genre),
  //       episodes: item.episodes.map((episode: any) => episode),
  //     };
  //   });

  //   if (animes.length > 0) {
  //     res.status(200).json({
  //       animes,
  //     });
  //   } else {
  //     res.status(500).json({ message: 'We lost it... could not find anything :(' });
  //   }
  // }

  // async getContentMovie(req: Request, res: Response, next: NextFunction) {
  //   const { type, page } = req.params;
  //   const url = 'movies';
  //   let data: any;

  //   try {
  //     if (redisClient.connected) {
  //       const resultQueryRedis: any = await redisClient.get(
  //         `contentMovie_${hashStringMd5(`${type}:${page}`)}`,
  //       );

  //       if (resultQueryRedis) {
  //         const resultRedis: any = JSON.parse(resultQueryRedis);

  //         return res.status(200).json(resultRedis);
  //       }
  //     }

  //     data = await fetchData(
  //       `${urls.BASE_ANIMEFLV_JELU}${
  //         url.charAt(0).toUpperCase() + url.slice(1)
  //       }/${type}/${page}`,
  //       {
  //         parse: true,
  //         scrapy: false,
  //       },
  //     );
  //   } catch (err) {
  //     return next(err);
  //   }

  //   const animes: Movie[] = data[url].map((item: any) => {
  //     return {
  //       id: item.id,
  //       title: item.title,
  //       type: url,
  //       page: page,
  //       banner: item.banner,
  //       image: item.poster,
  //       synopsis: item.synopsis,
  //       status: item.debut,
  //       rate: item.rating,
  //       genres: item.genres.map((genre: any) => genre),
  //       episodes: item.episodes.map((episode: any) => episode),
  //     };
  //   });

  //   if (animes.length > 0) {
  //     if (redisClient.connected) {
  //       /* Set the key in the redis cache. */

  //       redisClient.set(
  //         `contentMovie_${hashStringMd5(`${type}:${page}`)}`,
  //         JSON.stringify({ animes }),
  //       );

  //       /* After 24hrs expire the key. */

  //       redisClient.expireat(
  //         `contentMovie_${hashStringMd5(`${type}:${page}`)}`,
  //         parseInt(`${+new Date() / 1000}`, 10) + 7200,
  //       );
  //     }

  //     res.status(200).json({
  //       animes,
  //     });
  //   } else {
  //     res.status(500).json({ message: 'We lost it... could not find anything :(' });
  //   }
  // }

  async getEpisodes(req: Request, res: Response, next: NextFunction) {
    const { title } = req.params;
    let searchAnime: ModelA | null;
    let episodes: any;

    try {
      searchAnime = await AnimeModel.findOne({
        $or: [{ title: { $eq: title } }, { title: { $eq: `${title} (TV)` } }],
      });
    } catch (err) {
      return next(err);
    }

    switch (searchAnime?.source) {
      case 'jkanime':
        episodes = await jkanimeInfo(searchAnime?.id, searchAnime?.mal_id);
        break;
      case 'monoschinos':
        episodes = await monoschinosInfo(searchAnime?.id, searchAnime?.mal_id);
        break;
      case 'tioanime':
        episodes = await tioanimeInfo(searchAnime?.id, searchAnime?.mal_id);
        break;
      default:
        episodes = undefined;
        break;
    }

    if (episodes) {
      res.status(200).json({ episodes });
    } else {
      res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }

  async getServers(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    let data: any;

    try {
      let indicator = false;

      if (id.split('/')[0] === 'ver' && !indicator) {
        data = await videoServersTioAnime(id);

        if (!data.name) {
          indicator = true;
        }
      }

      if (id.split('/')[0] === 'ver' && !indicator) {
        data = await videoServersMonosChinos(id);

        if (!data.name) {
          console.log(data.name);
          indicator = true;
        }
      }

      if (!indicator) {
        data = undefined;

        indicator = true;

        /*
          This part is just for handling the error
          if the two above doesn't complete the operation
          does not make sense to have the getServers from
          JKAnime.
         */
      }

      if (data) {
        res.status(200).json({ servers: data });
      } else {
        res
          .status(500)
          .json({ message: 'We lost it... could not find anything :(' });
      }
    } catch (err) {
      return next(err);
    }
  }

  async getRandomAnime(req: Request, res: Response, next: NextFunction) {
    let animeQuery: ModelA[] | null;
    let animeResult: any;

    try {
      animeQuery = await AnimeModel.aggregate([{ $sample: { size: 1 } }]);
    } catch (err) {
      return next(err);
    }

    animeResult = {
      title: animeQuery[0].title || null,
      poster: animeQuery[0].poster || null,
      synopsis: animeQuery[0].description || null,
      type: animeQuery[0].type || null,
      rating: animeQuery[0].score || null,
      genres: animeQuery[0].genres || null,
      moreInfo: [await animeExtraInfo(animeQuery[0].mal_id)],
      promo: await getAnimeVideoPromo(animeQuery[0].mal_id),
      characters: await getAnimeCharacters(animeQuery[0].mal_id),
      related: await getRelatedAnimesMAL(animeQuery[0].mal_id),
    };

    if (animeResult) {
      res.set('Cache-Control', 'no-store');
      res.status(200).json(animeResult);
    } else {
      res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }
}
