import { TMDB, FlixHq, FMovies } from "peek-a-boo.ts"

export const MovieProviders = {
	tmdb: new TMDB(Deno.env.get("TMDB_API_KEY") as string, Deno.env.get("PROXY") as string),
}

export type MovieProviderKey = keyof typeof MovieProviders;
