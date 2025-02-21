import { MOVIES } from "@consumet/extensions"
import { MovieSearchResult, PeekABoo } from "../types.ts";

const movie = new MOVIES.Fmovies()

export class FMovies {

	async getTrendingMovies(): Promise<PeekABoo<MovieSearchResult[] | string>> {

		try {

			const res = await movie.search("")
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
				boo: e as string
			}
		}

	}

}
