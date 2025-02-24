import { AnimePahe, Gogo, Zoro } from "peek-a-boo.ts";

export const AnimeProviders = {
	gogo: new Gogo,
	animepahe: new AnimePahe,
	zoro: new Zoro
}

export type AnimeProviderKey = keyof typeof AnimeProviders;

