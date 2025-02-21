import { ANIME, IAnimeInfo, IEpisodeServer, ISource } from "@consumet/extensions";
import { AnimeInfo, MediaInfo, MovieSearchResult, PeekABoo } from "../types.ts";
import { animeSearchResult_to_MovieSearchResult, defaultAnimeInfo, iAnimeInfo_to_AnimeInfo, iAnimeInfo_to_MediaInfo } from "../utilities/typeconverter.ts";

const anime = new ANIME.Gogoanime();

export class Gogo {

	async getTrending (): Promise<PeekABoo<MovieSearchResult[]>> {
		const defaultResult: PeekABoo<MovieSearchResult[]> = {
			peek: false,
			boo: []
		}

		try {
			const result = await anime.fetchPopular();
			if (!result || result.totalPages == 0) return defaultResult;

			const list: MovieSearchResult[] = animeSearchResult_to_MovieSearchResult(result)

			return {
				peek: true,
				boo: list
			};
		} catch (e) {
			console.error(e)
			return {
				peek: false,
				boo: e as MovieSearchResult[]
			}
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

	async getAnimeInfo(id: string): Promise<PeekABoo<MediaInfo | string>> {
		const defaultResult: PeekABoo<MediaInfo | string> = {
			peek: false,
			boo: "Error getting anime info"
		}

		try {
			const result: IAnimeInfo = await anime.fetchAnimeInfo(id)
			if (!result) return defaultResult;
			result.id = id

			console.log(result)
			return {
				peek: true,
				boo: iAnimeInfo_to_MediaInfo(result)
			}
		} catch (err) {
			console.error(err)
			return {
				peek: false,
				boo: err as string
			}
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

	async getTopAiring(): Promise<PeekABoo<MediaInfo | string>> {
		const defaultResult: PeekABoo<MediaInfo | string> = {
			peek: false,
			boo: "Error! Failed to get the top airing anime"
		}

		try {
			const result = await anime.fetchTopAiring()
			if (!result || result.totalPages == 0) return defaultResult;
			console.log(result.results.length)
			const top = result.results[0]
			const topInfo = await anime.fetchAnimeInfo(top.id)
			// For some reason, the "id" from anime.fetchAnimeInfo always returns "category"
			topInfo.id = top.id

			return {
				peek: true,
				boo: iAnimeInfo_to_MediaInfo(topInfo)
			}
		} catch (e) {
			console.error(e)
			return {
				peek: false,
				boo: e as string,
			}
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

