import { TMDB } from "./tmdb.ts"
import { FlixHq } from "./flixhq.ts";
import { FMovies } from "./fmovie.ts";

export const MovieProviders = {
	tmdb: new TMDB,
}

export type MovieProviderKey = keyof typeof MovieProviders;
