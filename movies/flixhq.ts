import { MOVIES } from "@consumet/extensions";
import { MovieSearchResult, PeekABoo } from "../types.ts";
import { ITitle } from "@consumet/extensions";

const movie = new MOVIES.FlixHQ()

export class FlixHq {

	async getTrendingMovies(): Promise<PeekABoo<MovieSearchResult[]>> {
		const defaultResult: PeekABoo<MovieSearchResult[]> = {
			peek: false,
			boo: []
		}

		const res = await movie.fetchTrendingMovies()
		const list: MovieSearchResult[] = []
		res.forEach(movie => {
			const item: MovieSearchResult = {
				Id: movie.id,
				Title: movie.title as string,
				Poster: movie.image as string,
				Type: "movie"
			}
			list.push(item)
		})

		return defaultResult
	}

	async searchMovie(query: string): Promise<PeekABoo<MovieSearchResult[] | string>> {

		try {
			const res = await movie.search(query)
			const list: MovieSearchResult[] = []
			res.results.forEach(movie => {
				const item: MovieSearchResult = {
					Id: movie.id,
					Title: movie.title as string,
					Poster: movie.image as string,
					Type: "movie"
				}
				list.push(item)
			})

			return {
				peek: true,
				boo: list
			}
		} catch (e) {
			return {
				peek: false,
				boo: e as string,
			}
		}

	}
}
