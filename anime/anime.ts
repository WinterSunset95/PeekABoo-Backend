import { AnimePahe } from "./animepahe.ts";
import { Gogo } from "./gogo.ts";
import { Zoro } from "./zoro.ts";

export const AnimeProviders = {
	gogo: new Gogo,
	animepahe: new AnimePahe,
	zoro: new Zoro
}

export type AnimeProviderKey = keyof typeof AnimeProviders;

