import { IAnimeInfo, IAnimeResult, ISearch } from "@consumet/extensions";
import { AnimeInfo, MediaInfo, MovieSearchResult, TvInfo } from "../types.ts";

////////////////////////////////////////////////////////////
// Convert ISearch<IAnimeResult> into MovieSearchResult[] //
////////////////////////////////////////////////////////////
export const animeSearchResult_to_MovieSearchResult = (input: ISearch<IAnimeResult>): MovieSearchResult[] => {
	const list: MovieSearchResult[] = [];
	input.results.forEach((item) => {
		list.push({
			Id: item.id,
			Title: item.title as string,
			Poster: item.image as string,
			Type: "anime"
		})
	})
	return list
}

export const iAnimeInfo_to_AnimeInfo = (input: IAnimeInfo): AnimeInfo => {
	const result = input
	return {
		// The "id" field of anime.fetchAnimeInfo always returns the word "category" for some reaosn
		Id: result.id,
		Title: result.title as string,
		Poster: result.image as string,
		Overview: result.description as string,
		Year: result.releaseDate as string,
		Duration: result.totalEpisodes ? result.totalEpisodes + " episodes" : "Unknown",
		Genres: result.genres ? result.genres : [],
		Languages: [],
		Type: "anime",
		Episodes: result.episodes ? result.episodes : []
	}
}

export const iAnimeInfo_to_MediaInfo = (input: IAnimeInfo): MediaInfo => {
	const result = input
	return {
		// The "id" field of anime.fetchAnimeInfo always returns the word "category" for some reaosn
		Id: result.id,
		Title: result.title as string,
		Poster: result.image as string,
		Overview: result.description as string,
		Year: result.releaseDate as string,
		Duration: result.totalEpisodes ? result.totalEpisodes + " episodes" : "Unknown",
		Genres: result.genres ? result.genres : [],
		Languages: [],
		Type: "anime",
		AnimeEpisodes: result.episodes ? result.episodes : []
	}
}

export const defaultAnimeInfo: AnimeInfo = {
	Id: "unknown",
	Title: "Not Found",
	Poster: "Not Found",
	Overview: "none",
	Year: "none",
	Duration: "none",
	Genres: [],
	Languages: [],
	Type: "unknown",
	Episodes: []
}

export const defaultTvInfo: TvInfo = {
	Id: "unknown",
	Title: "Not Found",
	Poster: "Not Found",
	Overview: "none",
	Year: "none",
	Duration: "none",
	Genres: [],
	Languages: [],
	Type: "unknown",
	Season: []
}
