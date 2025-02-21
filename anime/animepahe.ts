import { ANIME, IAnimeInfo, IAnimeResult, IEpisodeServer, ISearch, ISource } from "@consumet/extensions";
import { AnimeInfo, MovieSearchResult, PeekABoo } from "../types.ts";
import { animeSearchResult_to_MovieSearchResult, defaultAnimeInfo, iAnimeInfo_to_AnimeInfo } from "../utilities/typeconverter.ts";

const anime = new ANIME.AnimePahe()

export class AnimePahe {

	async getTrending(): Promise<PeekABoo<MovieSearchResult[]>> {
		const defaultRes: PeekABoo<MovieSearchResult[]> = {
			peek: false,
			boo: []
		}

		const res: ISearch<IAnimeResult> = await anime.search("");
		if (!res || res.totalPages == 0) return defaultRes;

		const list = animeSearchResult_to_MovieSearchResult(res)

		return {
			peek: true,
			boo: list
		}
	}

	async getEpisodeSources(id: string): Promise<PeekABoo<ISource | undefined>> {
		const defaultRes: PeekABoo<undefined> = {
			peek: false,
			boo: undefined
		}
		const res: ISource = await anime.fetchEpisodeSources(id)
		if (!res || res.sources.length == 0) return defaultRes;

		return {
			peek: true,
			boo: res
		}
	}

	async getAnimeInfo(id: string): Promise<PeekABoo<AnimeInfo>> {
		const defaultResult: PeekABoo<AnimeInfo> = {
			peek: false,
			boo: defaultAnimeInfo
		}

		const result: IAnimeInfo = await anime.fetchAnimeInfo(id)
		if (!result) return defaultResult;
		result.id = id

		return {
			peek: true,
			boo: iAnimeInfo_to_AnimeInfo(result)
		}
	}

	async getEpisodeServers(id: string): Promise<PeekABoo<IEpisodeServer[]>> {
		const defaultRes: PeekABoo<IEpisodeServer[]> = {
			peek: false,
			boo: []
		}

		const res = await anime.fetchEpisodeServers(id)
		if (!res || res.length == 0) return defaultRes;
		console.log(res)

		return {
			peek: true,
			boo: res
		}
	}

	async getTopAiring(): Promise<PeekABoo<AnimeInfo>> {
		const defaultResult: PeekABoo<AnimeInfo> = {
			peek: false,
			boo: defaultAnimeInfo
		}

		const result = await anime.search("")
		if (!result || result.totalPages == 0) return defaultResult;
		const top = result.results[0]
		const topInfo = await anime.fetchAnimeInfo(top.id)
		// For some reason, the "id" from anime.fetchAnimeInfo always returns "category"
		topInfo.id = top.id

		return {
			peek: true,
			boo: iAnimeInfo_to_AnimeInfo(topInfo)
		}
	}

	async searchAnime(query: string): Promise<PeekABoo<MovieSearchResult[]>> {
		const defaultResult: PeekABoo<MovieSearchResult[]> = {
			peek: false,
			boo: []
		}

		const res = await anime.search(query)
		if (!res || res.totalPages == 0) return defaultResult;

		const list: MovieSearchResult[] = animeSearchResult_to_MovieSearchResult(res)

		return {
			peek: true,
			boo: list
		}
	}

}
