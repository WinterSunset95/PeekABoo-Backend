import { MediaInfo, MovieInfo, MovieSearchResult, PeekABoo, TvInfo, TvSeason } from "../types.ts";
import { defaultAnimeInfo, defaultTvInfo } from "../utilities/typeconverter.ts";
import { vidsrcScrape }  from "../vidsrc.ts"
import { ISource, IVideo, IEpisodeServer } from "@consumet/extensions"

export class TMDB {

	tmdbApiKey = Deno.env.get("TMDB_API_KEY");
	appProxy =	Deno.env.get("PROXY");

	movieTrending = `${this.appProxy}https://api.themoviedb.org/3/trending/movie/day?api_key=${this.tmdbApiKey}`
	moviePopular = `${this.appProxy}https://api.themoviedb.org/3/movie/popular?api_key=${this.tmdbApiKey}`
	movieSearch = `${this.appProxy}https://api.themoviedb.org/3/search/movie?api_key=${this.tmdbApiKey}&query=`
	movieInfo = (id: string): string => `${this.appProxy}https://api.themoviedb.org/3/movie/${id}?api_key=${this.tmdbApiKey}`;
	tvTrending = `${this.appProxy}https://api.themoviedb.org/3/trending/tv/day?api_key=${this.tmdbApiKey}`
	tvPopular = `${this.appProxy}https://api.themoviedb.org/3/tv/popular?api_key=${this.tmdbApiKey}`
	tvSearch = `${this.appProxy}https://api.themoviedb.org/3/search/tv?api_key=${this.tmdbApiKey}&query=`
	tvInfo = (id: string): string => `${this.appProxy}https://api.themoviedb.org/3/tv/${id}?api_key=${this.tmdbApiKey}`;

	async getTrendingMovies(): Promise<PeekABoo<MovieSearchResult[]>> {
		const defaultResult: PeekABoo<MovieSearchResult[]> = {
			peek: false,
			boo: []
		}

		const response = await fetch(this.movieTrending);
		const data = await response.json();
		const array: MovieSearchResult[] = []

		if (data == undefined) return defaultResult;

		data.results.forEach((item: any) => {
			const arrItem: MovieSearchResult = {
				Id: item.id,
				Title: item.original_title as string,
				Poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
				Type: "movie"
			}
			array.push(arrItem)
		})

		return {
			peek: true,
			boo: array
		}
	}

	async getTrendingTv(): Promise<PeekABoo<MovieSearchResult[]>> {
		const defaultResult: PeekABoo<MovieSearchResult[]> = {
			peek: false,
			boo: []
		}

		const response = await fetch(this.tvTrending);
		const data = await response.json();
		const array: MovieSearchResult[] = []

		if (data == undefined) return defaultResult;

		data.results.forEach((item: any) => {
			const arrItem: MovieSearchResult = {
				Id: item.id,
				Title: item.original_name as string,
				Poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
				Type: "tv"
			}
			array.push(arrItem)
		})

		return {
			peek: true,
			boo: array
		}
	}

	async searchMovie(query: string): Promise<PeekABoo<MovieSearchResult[]>> {
		const defaultResult: PeekABoo<MovieSearchResult[]> = {
			peek: false,
			boo: []
		}

		console.log(this.movieSearch, query)
		const response = await fetch(`${this.movieSearch}${query}`)
		const data = await response.json();
		const array: MovieSearchResult[] = [];

		if (data == undefined) return defaultResult;

		data.results.forEach((item: any) => {
			const arrItem: MovieSearchResult = {
				Id: item.id,
				Title: item.original_title,
				Poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
				Type: "movie"
			}
			array.push(arrItem)
		})

		return {
			peek: true,
			boo: array
		};
	}

	async searchTv(query: string): Promise<PeekABoo<MovieSearchResult[]>> {
		const defaultResult: PeekABoo<MovieSearchResult[]> = {
			peek: false,
			boo: []
		}

		console.log(this.movieSearch, query)
		const response = await fetch(`${this.tvSearch}${query}`)
		const data = await response.json();
		const array: MovieSearchResult[] = [];

		if (data == undefined) return defaultResult;

		data.results.forEach((item: any) => {
			const arrItem: MovieSearchResult = {
				Id: item.id,
				Title: item.original_name,
				Poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
				Type: "tv"
			}
			array.push(arrItem)
		})

		return {
			peek: true,
			boo: array
		};
	}

	async getMovieInfo(id: string): Promise<PeekABoo<MediaInfo | string>> {
		const response = await fetch(`${this.movieInfo(id)}`)
		const data = await response.json();
		if (data == undefined) {
			return {
				peek: false,
				boo: `Failed to get Movie Info ${id}`
			}
		}

		return {
			peek: true,
			boo: {
				Id: data.id,
				Title: data.original_title,
				Poster: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
				Type: "movie",
				Overview: data.overview,
				Year: data.release_date,
				Duration: data.runtime,
				Genres: [],
				Languages: []
			}
		}
	}

	async getTvInfo(id: string): Promise<PeekABoo<MediaInfo | string>> {
		const response = await fetch(`${this.tvInfo(id)}`)
		const data = await response.json();
		if (data == undefined) {
			return {
				peek: false,
				boo: `Failed to get Show ${id}`
			}
		}

		const seasons: TvSeason[] = []
		const seasonsList = data.seasons
		if (!seasonsList) return {
			peek: false,
			boo: `No seasons available for ${id}`
		}
		seasonsList.forEach((item: any) => {
			const season: TvSeason = {
				Id: item.id,
				AirDate: item.air_date,
				EpisodeCount: item.episode_count,
				Name: item.name,
				Overview: item.overview,
				Poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
				SeasonNumber: item.season_number
			}
			seasons.push(season)
		})

		return {
			peek: true,
			boo: {
				Id: data.id,
				Title: data.original_name,
				Poster: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
				Type: "tv",
				Overview: data.overview,
				Year: data.release_date,
				Duration: data.runtime,
				Genres: [],
				Languages: [],
				TvShowSeason: seasons
			}
		}
	}

	async getMovieSources(id: string): Promise<PeekABoo<ISource | string>> {
		try {
			const res = await vidsrcScrape(id, "movie")
			const sourcesList: IVideo[] = []
			res.forEach(item => {
				const source: IVideo = {
					url: item.stream ?? "",
					isM3U8: true
				}
				sourcesList.push(source)
			})

			const toReturn: ISource = {
				sources: sourcesList,
				embedURL: `https://vidsrc.net/embed/movie?tmdb=${id}`
			}
			
			return {
				peek: true,
				boo: toReturn
			}
		} catch (e) {
			return {
				peek: false,
				boo: e as string
			}
		}
	}

	getMovieEmbeds(id: string): PeekABoo<IEpisodeServer[] | string> {
		try {
			const servers: IEpisodeServer[] = [
				{
					name: "VidSrc Net",
					url: `https://vidsrc.net/embed/movie?tmdb=${id}`
				},
				{
					name: "VidSrc Icu",
					url: `https://vidsrc.icu/embed/movie/${id}`
				},
				{
					name: "Super Embed",
					url: `https://multiembed.mov/?video_id=${id}&tmdb=1`
				},
				{
					name: "VidPro",
					url: `https://vidsrc.pro/embed/movie/${id}`
				},
				{
					name: "VidSrc In",
					url: `https://vidsrc.in/embed/movie/${id}`
				},
				{
					name: "VidSrc VIP",
					url: `https://vidsrc.vip/embed/movie/${id}`
				},
				{
					name: "VidSrc To",
					url: `https://vidsrc.to/embed/movie/${id}`
				}
			]
			return {
				peek: true,
				boo: servers
			}
		} catch (e) {
			return {
				peek: false,
				boo: e as string,
			}
		}
	}

	async getEpisodeSources(id: string, season: number, episode: number): Promise<PeekABoo<ISource | string>> {
		console.log(id, season, episode)
		try {
			const res = await vidsrcScrape(id, "tv", season, episode)

			const sourcesList: IVideo[] = []
			res.forEach(item => {
				const source: IVideo = {
					url: item.stream ?? "",
					isM3U8: true
				}
				sourcesList.push(source)
			})

			const toReturn: ISource = {
				sources: sourcesList,
				embedURL: `https://vidsrc.net/embed/movie?tmdb=${id}`
			}
			
			return {
				peek: true,
				boo: toReturn
			}
		} catch (e) {
			console.log(e)
			return {
				peek: false,
				boo: "Couldn't get the sources!"
			}
		}
	}

	getTvEmbeds(id: string, season: number, episode: number): PeekABoo<IEpisodeServer[] | string> {
		const serversList: IEpisodeServer[] = [
			{
				name: "VidSrc Net",
				url: `https://vidsrc.net/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`
			},
			{
				name: "VidSrc Icu",
				url: `https://vidsrc.icu/embed/tv/${id}/${season}/${episode}`
			},
			{
				name: "Super Embed",
				url: `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`
			},
			{
				name: "VidPro",
				url: `https://vidsrc.pro/embed/tv/${id}/${season}/${episode}`
			},
			{
				name: "VidSrc In",
				url: `https://vidsrc.in/embed/tv/${id}/${season}/${episode}`
			},
			{
				name: "VidSrc VIP",
				url: `https://vidsrc.vip/embed/tv/${id}/${season}/${episode}`
			},
			{
				name: "VidSrc To",
				url: `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`
			}
		]
		return {
			peek: true,
			boo: serversList,
		}
	}
}
