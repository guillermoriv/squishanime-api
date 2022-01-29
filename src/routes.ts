import { Router, Request, Response, NextFunction } from 'express';
import AnimeController from './controllers/AnimeController';
import DirectoryController from './controllers/DirectoryController';

const routes = Router();
const animeController = new AnimeController();
const directoryController = new DirectoryController();

/*
  Routes - JSON
  Message with the JSON of all the routes in the
  /api, parameters and some examples, how to call the
  endpoints of the /api.
*/

routes.get('/', (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    message: 'SquishAnime-Api - 🎏',
    author: '@guillermoriv',
    version: '1.0.0',
    entries: [
      {
        Schedule: '/schedule/:day',
        Top: '/top/:type/:page/:subtype',
        RandomAnime: '/randomAnime',
        Season: '/season/:year/:type',
        'All Seasons': '/allSeasons',
        'All Directory': '/allDirectory/:page?',
        'Directory Count': '/directoryCount',
        'Get Anime Score': '/getScore/:malid',
        Genres: '/getByGenres/:genre?/:order?/:page?',
        lastEpisodes: '/lastEpisodes',
        MoreInfo: '/moreInfo/:title',
        GetEpisodes: '/getEpisodes/:title',
        GetAnimeServers: '/getAnimeServers/:id',
        Search: '/search/:title',
      },
    ],
  });
});

/* Anime Controller */
routes.get('/schedule/:day', animeController.schedule);
routes.get('/top/:type/:subtype?/:page', animeController.top);
routes.get('/lastEpisodes', animeController.getLastEpisodes);
routes.get('/getEpisodes/:id', animeController.getEpisodes);
routes.get('/getAnimeServers/:id([^/]+/[^/]+)', animeController.getServers);
routes.get('/randomAnime', animeController.getRandomAnime);

/* Directory Controller */
routes.get('/allDirectory/:page?', directoryController.getAllDirectory);
routes.get('/getScore/:malid', directoryController.getScore);
routes.get('/season/:year/:type', directoryController.getSeason);
routes.get('/allSeasons', directoryController.allSeasons);
routes.get('/laterSeasons', directoryController.laterSeasons);
routes.get('/moreInfo/:id', directoryController.getMoreInfo);
routes.get('/directoryCount', directoryController.getDirectoryCount);
routes.get('/search/:title', directoryController.search);
routes.get('/genres', directoryController.getGenres);
routes.get(
  '/getByGenres/:genre?/:order?/:page?',
  directoryController.getAnimeGenres,
);

export default routes;
