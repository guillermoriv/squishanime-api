import { NextFunction, Request, Response } from 'express';
import { fetchData } from '../utils/request';
import AnimeModel, { Anime } from '../database/models/anime.model';
import util from 'util';
import { hashStringMd5 } from '../utils/util';
import {
  animeExtraInfo,
  getAnimeVideoPromo,
  getAnimeCharacters,
  getRelatedAnimesMAL,
} from '../utils/util';
import urls from '../utils/urls';
import GenreModel, { Genre } from '../database/models/genre.model';

/*
  DirectoryController - async functions controlling the directory
  in the database of MongoDB, functions like getAllDirectory from the DB
  other functions with realation to the directory, like the season and stuff.
*/

interface TypeAnime {
  title: string;
  image: string;
  genres: string[];
}

interface Season {
  title: string;
  image: string;
  malink: string;
}

interface Archive {
  year: string;
  seasons: string[];
}

export default class DirectoryController {
  async getAllDirectory(req: Request, res: Response, next: NextFunction) {
    const { page: actuallyPage } = req.query;
    const page = actuallyPage ? actuallyPage : '1';
    let resultAnimes: Anime[];
    let animes: any[] = [];

    try {
      resultAnimes = await AnimeModel.find({})
        .sort({ _id: -1 })
        .limit(24)
        .skip(24 * Number(page));
    } catch (err) {
      return next(err);
    }

    for (let i = 0; i < resultAnimes.length; i++) {
      animes.push({
        genres: resultAnimes[i].genres,
        id: resultAnimes[i].id,
        title: resultAnimes[i].title,
        mal_id: resultAnimes[i].mal_id,
        poster: resultAnimes[i].poster,
        type: resultAnimes[i].type,
        source: resultAnimes[i].source,
        description: resultAnimes[i].description,
      });
    }

    if (animes.length > 0) {
      res.status(200).json({ animes });
    } else {
      res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }

  async getScore(req: Request, res: Response, next: NextFunction) {
    const { malid } = req.params;
    let score: string;

    try {
      const $: cheerio.Root = await fetchData(
        `${urls.BASE_MAL}anime/${malid}`,
        {
          scrapy: true,
          parse: false,
        },
      );

      score = $('div.score-label').text();
    } catch (err) {
      return next(err);
    }

    if (score) {
      res.status(200).json({ score });
    } else {
      res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }

  async getGenres(req: Request, res: Response, next: NextFunction) {
    let result: Genre[];

    try {
      result = await GenreModel.find();
    } catch (err) {
      return next(err);
    }

    if (result.length > 0) {
      res.status(200).json({ genres: result });
    } else {
      res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }

  async getDirectoryCount(req: Request, res: Response, next: NextFunction) {
    let result: number = 0;

    try {
      result = await AnimeModel.count();
    } catch (err) {
      return next(err);
    }

    if (result !== 0) {
      res.status(200).json({ directoryCount: result });
    } else {
      res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }

  async getSeason(req: Request, res: Response, next: NextFunction) {
    const { year, type } = req.params;
    let data: any;

    try {
      data = await fetchData(`${urls.BASE_JIKAN}season/${year}/${type}`, {
        scrapy: false,
        parse: true,
      });
    } catch (err) {
      return next(err);
    }

    const season: TypeAnime[] = data.anime.map((item: any) => {
      return {
        title: item.title,
        image: item.image_url,
        genres: item.genres.map((genre: any) => genre.name),
      };
    });

    if (season.length > 0) {
      res.status(200).json({
        season,
      });
    } else {
      res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }

  async allSeasons(req: Request, res: Response, next: NextFunction) {
    let data: any;

    try {
      data = await fetchData(`${urls.BASE_JIKAN}season/archive`, {
        parse: true,
        scrapy: false,
      });
    } catch (err) {
      return next(err);
    }

    const archive: Archive[] = data.archive.map((item: any) => {
      return {
        year: item.year,
        seasons: item.seasons,
      };
    });

    if (archive.length > 0) {
      res.status(200).json({ archive });
    } else {
      res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }

  async laterSeasons(req: Request, res: Response, next: NextFunction) {
    let data: any;

    try {
      data = await fetchData(`${urls.BASE_JIKAN}season/later`, {
        parse: true,
        scrapy: false,
      });
    } catch (err) {
      return next(err);
    }

    const future: Season[] = data.anime.map((item: any) => {
      return {
        title: item.title,
        image: item.image_url,
        malink: item.url,
      };
    });

    if (future.length > 0) {
      res.status(200).json({ future });
    } else {
      res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }

  async getMoreInfo(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    let resultQuery: Anime | null;
    let resultAnime: any;

    try {
      resultQuery = await AnimeModel.findOne({
        $or: [{ id: { $eq: id } }, { id: { $eq: `${id}-sub-espanol` } }],
      });

      const extraInfo: any = await animeExtraInfo(resultQuery!.mal_id);

      resultAnime = {
        title: resultQuery?.title,
        poster: urls.BASE_STORAGE + resultQuery?.poster,
        synopsis: resultQuery?.description,
        status: !extraInfo.aired.to ? 'En emisi??n' : 'Finalizado',
        type: resultQuery?.type,
        rating: extraInfo.score,
        genres: resultQuery?.genres,
        moreInfo: extraInfo,
        related: await getRelatedAnimesMAL(resultQuery!.mal_id),
      };
    } catch (err) {
      return next(err);
    }

    if (resultAnime) {
      res.status(200).json(resultAnime);
    } else {
      res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    const { title } = req.params;
    let results: Anime[] | null;

    try {
      results = await AnimeModel.find({
        title: { $regex: new RegExp(title, 'i') },
      });
    } catch (err) {
      return next(err);
    }

    const resultAnimes: any[] = results.map((item: any) => {
      return {
        id: item.id,
        title: item.title,
        type: item.type,
        image: urls.BASE_STORAGE + item.poster,
      };
    });

    if (resultAnimes.length > 0) {
      res.status(200).json({ search: resultAnimes });
    } else {
      res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }

  async getAnimeGenres(req: Request, res: Response, next: NextFunction) {
    const { genre, order, page } = req.params;
    let result: any;

    const genres: any = {
      accion: 'Acci??n',
      'artes-marciales': 'Artes Marciales',
      aventura: 'Aventuras',
      carreras: 'Carreras',
      'ciencia-ficcion': 'Ciencia Ficci??n',
      comedia: 'Comedia',
      demencia: 'Demencia',
      demonios: 'Demonios',
      deportes: 'Deportes',
      drama: 'Drama',
      ecchi: 'Ecchi',
      escolares: 'Escolares',
      espacial: 'Espacial',
      fantasia: 'Fantas??a',
      harem: 'Harem',
      historico: 'Historico',
      infantil: 'Infantil',
      josei: 'Josei',
      juegos: 'Juegos',
      magia: 'Magia',
      mecha: 'Mecha',
      militar: 'Militar',
      misterio: 'Misterio',
      musica: 'M??sica',
      parodia: 'Parodia',
      policia: 'Polic??a',
      psicologico: 'Psicol??gico',
      'recuentos-de-la-vida': 'Recuentos de la vida',
      romance: 'Romance',
      samurai: 'Samurai',
      seinen: 'Seinen',
      shoujo: 'Shoujo',
      shounen: 'Shounen',
      sobrenatural: 'Sobrenatural',
      superpoderes: 'Superpoderes',
      suspenso: 'Suspenso',
      terror: 'Terror',
      vampiros: 'Vampiros',
      yaoi: 'Yaoi',
      yuri: 'Yuri',
    };

    try {
      if (genre === undefined && order === undefined && page === undefined) {
        result = await AnimeModel.aggregate([{ $sample: { size: 25 } }]);
      } else {
        // eslint-disable-next-line no-prototype-builtins
        if (genres.hasOwnProperty(genre)) {
          if (page !== undefined && parseInt(page) > 1) {
            if (order === 'asc') {
              result = await AnimeModel.find({ genres: genres[genre] })
                .limit(25)
                .skip(25 * parseInt(page))
                .sort({ title: 'ascending' });
            } else if (order === 'desc') {
              result = await AnimeModel.find({ genres: genres[genre] })
                .limit(25)
                .skip(25 * parseInt(page))
                .sort({ title: 'descending' });
            } else {
              result = await AnimeModel.find({ genres: genres[genre] })
                .limit(25)
                .skip(25 * parseInt(page));
            }
          } else {
            if (order === 'asc') {
              result = await AnimeModel.find({ genres: genres[genre] })
                .limit(25)
                .sort({ title: 'ascending' });
            } else if (order === 'desc') {
              result = await AnimeModel.find({ genres: genres[genre] })
                .limit(25)
                .sort({ title: 'descending' });
            } else {
              result = await AnimeModel.find({ genres: genres[genre] }).limit(
                25,
              );
            }
          }
        } else {
          return res
            .status(500)
            .json({ message: 'We lost it... could not find anything :(' });
        }
      }
    } catch (err) {
      return next(err);
    }

    const animes: any[] = result.map((item: any) => {
      return {
        id: item.id,
        title: item.title.trim(),
        mention: genre,
        page: page,
        poster: item.poster,
        banner: item.banner,
        synopsis: item.synopsis,
        type: item.type,
        rating: item.rating,
        genre: item.genre,
      };
    });

    if (animes.length > 0) {
      res.status(200).json({ animes });
    } else {
      res
        .status(500)
        .json({ message: 'We lost it... could not find anything :(' });
    }
  }
}
