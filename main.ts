// @deno-types="@oak/oak"
import { oakCors, Route } from "https://deno.land/x/cors/mod.ts";
import { serve } from "https://deno.land/std@0.166.0/http/server.ts";
import { Application, Router } from "@oak/oak"
import type { RouterContext } from "@oak/oak/router";
import { AnimeProviderKey, AnimeProviders } from "./anime/anime.ts";
import "jsr:@std/dotenv/load";
import { Gogo, AnimePahe, Zoro, TMDB, vidsrcScrape, OpenRoom, PeekABoo, Release, io, rooms, checkIfRoomExists } from "peek-a-boo.ts"
import { MovieProviderKey, MovieProviders } from "./movies/movie.ts";
import { data } from "./releases.ts";

const app = new Application()
const router = new Router()

//const SERVER = "http://localhost:3000"
//const SERVER = "http://65.1.92.65"
const SERVER = Deno.env.get("SERVER")
let port = Deno.env.get("PORT")!
if (!port) {
	port = "80"
}
console.log(SERVER)

///////////////////////////////////////////////////////
// Get anime provider object from the providers list //
///////////////////////////////////////////////////////
function getAnimeProvider(provider: string): Gogo | AnimePahe | Zoro | null {
	if (provider in AnimeProviders) {
		return AnimeProviders[provider as AnimeProviderKey]
	}
	return null;
}

function getMovieProvider(provier: string): TMDB | null {
	if (provier in MovieProviders) {
		return MovieProviders[provier as MovieProviderKey]
	}
	return null
}
///////////////////////////////////////////////////////
///////////////////////////////////////////////////////

////////////////////
// Error handling //
////////////////////
app.use(async (ctx, next) => {
	try {
		await next()
	} catch (err) {
		console.log(err)
	}
})

//////////////////////////////////////////////////////////////////////////////////////////////////
// DO NOT CHANGE ANYTHING IN THE NEXT THREE BLOCKS!! /////////////////////////////////////////////
// They are responsible for all the proxying work, in order to be able to stream the m3u8 files //
//////////////////////////////////////////////////////////////////////////////////////////////////
router.get("/proxy", async (ctx) => {
	const url = ctx.request.url.searchParams.get("url") as string
	const originalQueryParams = new URLSearchParams(ctx.request.url.searchParams)
	originalQueryParams.delete("url")
	const finalUrl = new URL(url)
	originalQueryParams.forEach((value, key) => {
		finalUrl.searchParams.append(key, value)
	})

	if (!finalUrl) {
		const errorRes: PeekABoo<string> = {
			peek: false,
			boo: "no url detected"
		}
		ctx.response.body = errorRes
	}
	console.log("Proxying: " + finalUrl)

	try {
		const response = await fetch(finalUrl)
		if (!response.ok) {
			throw new Error("failed to fetch " + response.statusText)
		}
		ctx.response.headers = response.headers
		ctx.response.type = response.type
		ctx.response.body = response.body
	} catch (e: unknown) {
		ctx.response.body = e as string
	}
})

router.get("/helpers/moviem3u8", async (ctx) => {
	const url = ctx.request.url.searchParams.get("url") as string
	if (!url) {
		const errorRes: PeekABoo<string> = {
			peek: false,
			boo: "no url detected"
		}
		ctx.response.body = errorRes
	}

	console.log(`URL: ${url}`)

	try {
		const response = await fetch(url)
		if (!response.ok) {
			throw new Error('Failed to fetch ' + response.statusText)
		}
		const m3u8Content = await response.text();
		let modifiedm3u8: string;
		if (m3u8Content.includes('.ts')) {
			modifiedm3u8 = m3u8Content.replace(
				/(.*\.ts)/g,
				(segment) => `${SERVER}/helpers/segment?url=${encodeURIComponent(url + segment)}`
			)
		} else if (m3u8Content.includes('.html')) {
			modifiedm3u8 = m3u8Content.replace(
				/(.*\.html)/g,
				(segment) => `${SERVER}/helpers/segment?url=${encodeURIComponent(url + segment)}`
			)
		} else {
			modifiedm3u8 = m3u8Content.replace(
				/(.*\.m3u8)/g,
				(segment) => `${SERVER}/helpers/moviem3u8?url=${encodeURIComponent(url + segment)}`
			)
		}

		ctx.response.headers.set("Content-Type", response.headers.get("content-type") || "application/vnd.apple.mpegurl");
		ctx.response.headers.set("Access-Control-Allow-Origin", "*");
		ctx.response.body = modifiedm3u8
	} catch (e) {
		const errorRes: PeekABoo<string> = {
			peek: false,
			boo: e as string
		}
		ctx.response.body = errorRes
	}
})

router.get("/helpers/m3u8", async (ctx) => {
	const url = ctx.request.url.searchParams.get("url") as string
	if (!url) {
		const errorRes: PeekABoo<string> = {
			peek: false,
			boo: "no url detected"
		}
		ctx.response.body = errorRes
	}

	let urlArray = url.split("/")
	console.log(urlArray)
	urlArray.pop()
	let newUrl = ""
	for (let i=0; i<urlArray.length; i++) {
		newUrl = newUrl + urlArray[i] + "/"
	}
	console.log(`New url after splitting: ${newUrl}`)

	try {
		const response = await fetch(url)
		if (!response.ok) {
			throw new Error('Failed to fetch ' + response.statusText)
		}
		const m3u8Content = await response.text();
		let modifiedm3u8: string;
		if (m3u8Content.includes('.ts')) {
			modifiedm3u8 = m3u8Content.replace(
				/(.*\.ts)/g,
				(segment) => `${SERVER}/helpers/segment?url=${encodeURIComponent(newUrl + segment)}`
			)
		} else if (m3u8Content.includes('.html')) {
			modifiedm3u8 = m3u8Content.replace(
				/(.*\.html)/g,
				(segment) => `${SERVER}/helpers/segment?url=${encodeURIComponent(segment)}`
			)
		} else {
			modifiedm3u8 = m3u8Content.replace(
				/(.*\.m3u8)/g,
				(segment) => `${SERVER}/helpers/m3u8?url=${encodeURIComponent(segment)}`
			)
		}

		ctx.response.headers.set("Content-Type", response.headers.get("content-type") || "application/vnd.apple.mpegurl");
		ctx.response.headers.set("Access-Control-Allow-Origin", "*");
		ctx.response.body = modifiedm3u8
	} catch (e) {
		const errorRes: PeekABoo<string> = {
			peek: false,
			boo: e as string
		}
		ctx.response.body = errorRes
	}
})

router.get("/helpers/segment", async (ctx) => {
	const url = ctx.request.url.searchParams.get("url") as string
	if (!url) {
		const errorRes: PeekABoo<string> = {
			peek: false,
			boo: "No url detected"
		}
		ctx.response.body = errorRes
	}

	try {
		const response = await fetch(url)
		if (!response.ok) {
			throw new Error("failed to fetch " + response.statusText)
		}
		ctx.response.headers.set("Content-Type", response.headers.get("content-type") || "video/mp2t");
		ctx.response.headers.set("Access-Control-Allow-Origin", "*")
		ctx.response.body = response.body
	} catch (e: unknown) {
		ctx.response.body = e as string
	}
})
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////
// Scraper section //
/////////////////////
router.get("/scraper/vidsrc/movie/:id", async (ctx: RouterContext<"/scraper/vidsrc/movie/:id">) => {
	const id = ctx.params.id
	const result = await vidsrcScrape(id, "movie")
	ctx.response.body = result
})

///////////////////
// Movie section //
///////////////////
router.get("/movie/trending", async (ctx) => {
	const movieProvider = getMovieProvider("tmdb")
	const res = await movieProvider?.getTrendingMovies()
	ctx.response.body = res
})

router.get("/movie/:provider/trending", async (ctx: RouterContext<"/movie/:provider/trending">) => {
	const provider = ctx.params.provider
	const movieProvider = getMovieProvider(provider)
	const result = await movieProvider?.getTrendingMovies()
	ctx.response.body = result
})

router.get("/movie/:provider/search/:query", async (ctx: RouterContext<"/movie/:provider/search/:query">) => {
	const provider = ctx.params.provider
	const query = ctx.params.query
	const movieProvider = getMovieProvider(provider)
	const result = await movieProvider?.searchMovie(query)
	ctx.response.body = result
})

router.get("/movie/:provider/:movieid/info", async (ctx: RouterContext<"/movie/:provider/:movieid/info">) => {
	const provider = ctx.params.provider
	const movieid = ctx.params.movieid
	const movieProvider = getMovieProvider(provider)
	const result = await movieProvider?.getMovieInfo(movieid)
	ctx.response.body = result
})

router.get("/movie/:provider/search", async (ctx: RouterContext<"/movie/:provider/search">) => {
	const provider = ctx.params.provider
	const movieProvider = getMovieProvider(provider)
	const result = await movieProvider?.searchMovie("a")
	ctx.response.body = result
})

router.get("/movie/:provider/:movieid/embed", (ctx: RouterContext<"/movie/:provider/:movieid/embed">) => {
	const provider = ctx.params.provider
	const movieid = ctx.params.movieid
	const movieProvider = getMovieProvider(provider)
	const result = movieProvider?.getMovieEmbeds(movieid)
	ctx.response.body = result
})

router.get("/movie/:provider/:movieid/sources", async (ctx: RouterContext<"/movie/:provider/:movieid/sources">) => {
	const provider = ctx.params.provider
	const movieid = ctx.params.movieid
	const movieProvider = getMovieProvider(provider)
	const result = await movieProvider?.getMovieSources(movieid)
	ctx.response.body = result
})

////////////////
// TV section //
////////////////
router.get("/tv/:provider/trending", async (ctx: RouterContext<"/tv/:provider/trending">) => {
	const provider = ctx.params.provider
	const movieProvider = getMovieProvider(provider)
	const result = await movieProvider?.getTrendingTv()
	ctx.response.body = result
})

router.get("/tv/:provider/search/:query", async (ctx: RouterContext<"/tv/:provider/search/:query">) => {
	const provider = ctx.params.provider
	const query = ctx.params.query
	const movieProvider = getMovieProvider(provider)
	const result = await movieProvider?.searchTv(query)
	ctx.response.body = result
})

router.get("/tv/:provider/:movieid/info", async (ctx: RouterContext<"/tv/:provider/:movieid/info">) => {
	const provider = ctx.params.provider
	const movieid = ctx.params.movieid
	const movieProvider = getMovieProvider(provider)
	const result = await movieProvider?.getTvInfo(movieid)
	ctx.response.body = result
})

router.get("/tv/:provider/search", async (ctx: RouterContext<"/tv/:provider/search">) => {
	const provider = ctx.params.provider
	const movieProvider = getMovieProvider(provider)
	const result = await movieProvider?.searchTv("a")
	ctx.response.body = result
})

router.get("/tv/:provider/:tvid/:season/:episode/embed", (ctx: RouterContext<"/tv/:provider/:tvid/:season/:episode/embed">) => {
	const provider = ctx.params.provider
	const tvid = ctx.params.tvid
	const season = ctx.params.season
	const episode = ctx.params.season
	console.log(provider, tvid, season, episode)
	const movieProvider = getMovieProvider(provider)
	const result = movieProvider?.getTvEmbeds(tvid, parseInt(season), parseInt(episode))
	ctx.response.body = result
})

router.get("/tv/:provider/:tvid/:season/:episode/sources", async (ctx: RouterContext<"/tv/:provider/:tvid/:season/:episode/sources">) => {
	const provider = ctx.params.provider
	const tvid = ctx.params.tvid
	const season = ctx.params.season
	const episode = ctx.params.season
	const movieProvider = getMovieProvider(provider)
	const result = await movieProvider?.getEpisodeSources(tvid, parseInt(season), parseInt(episode))
	ctx.response.body = result
})


///////////////////
// Anime section //
///////////////////
router.get("/anime/:provider/trending", async (ctx: RouterContext<"/anime/:provider/trending">) => {
	const provider = ctx.params.provider
	const animeProvider = getAnimeProvider(provider)
	try {
		const result = await animeProvider?.getTrending()
		ctx.response.body = result
	} catch {
		ctx.response.body = {
			peek: false,
			boo: "Lol get fucked",
		}
	}
})

router.get("/anime/:provider/episode/:epid/sources", async (ctx: RouterContext<"/anime/:provider/episode/:epid/sources">) => {
	const id = ctx.params.epid
	const provider = ctx.params.provider
	const animeProvider = getAnimeProvider(provider)
	const result = await animeProvider?.getEpisodeSources(id)
	ctx.response.body = result
})

////////////////////////////////////////
// Legacy, for backward compatibility //
////////////////////////////////////////
router.get("/anime/episode/:epid", async (ctx: RouterContext<"/anime/episode/:epid">) => {
	const id = ctx.params.epid
	const animeProvider = getAnimeProvider("gogo")
	const result = await animeProvider?.getEpisodeSources(id)
	ctx.response.body = result
})
////////////////////////////////////////

router.get("/anime/:provider/episode/:epid/servers", async (ctx: RouterContext<"/anime/:provider/episode/:epid/servers">) => {
	const id = ctx.params.epid
	const provider = ctx.params.provider
	const animeProvider = getAnimeProvider(provider)
	const result = await animeProvider?.getEpisodeServers(id)
	ctx.response.body = result
})

router.get("/anime/:provider/:animeid/info", async (ctx: RouterContext<"/anime/:provider/:animeid/info">) => {
	const provider = ctx.params.provider
	const animeid = ctx.params.animeid
	const animeProvider = getAnimeProvider(provider)
	const result = await animeProvider?.getAnimeInfo(animeid)
	ctx.response.body = result
})

router.get("/anime/:provider/topairing", async (ctx: RouterContext<"/anime/:provider/topairing">) => {
	const provider = ctx.params.provider
	const animeProvider = getAnimeProvider(provider)
	const result = await animeProvider?.getTopAiring()
	ctx.response.body = result
})

router.get("/anime/:provider/search/:query", async (ctx: RouterContext<"/anime/:provider/search/:query">) => {
	const provider = ctx.params.provider
	const query = ctx.params.query
	const animeProvider = getAnimeProvider(provider)
	const result = await animeProvider?.searchAnime(query)
	ctx.response.body = result
})

router.get("/anime/:provider/search", async (ctx: RouterContext<"/anime/:provider/search">) => {
	const provider = ctx.params.provider
	const animeProvider = getAnimeProvider(provider)
	const result = await animeProvider?.searchAnime("")
	ctx.response.body = result
})

///////////
// Rooms //
///////////
router.post("/rooms/create", async (ctx) => {
	const reqBody = ctx.request.body
	const data = await reqBody.json() as OpenRoom
	const room = checkIfRoomExists({ RoomId: data.RoomId, RequesterId: data.UserId })
	if (!room) {
		rooms.push(data)
	}
	const toReturn: PeekABoo<OpenRoom> = {
		// If room does not already exist, return true
		peek: room ? false : true,
		boo: data
	}
	console.log(rooms)
	io.emit("getRooms", rooms)
	ctx.response.body = toReturn
})

router.get("/rooms/list", (ctx) => {
	const res: PeekABoo<OpenRoom[]> = {
		peek: true,
		boo: rooms
	}
	console.log(rooms)
	io.emit("getRooms", rooms)
	ctx.response.body = res
})

router.get("/rooms/get/:roomid", (ctx: RouterContext<"/rooms/get/:roomid">) => {
	const roomid = ctx.params.roomid
	const requester = ctx.request.url.searchParams.get("requester") as string
	const room = checkIfRoomExists({ RoomId: roomid, RequesterId: requester })
	const toReturn: PeekABoo<OpenRoom | undefined> = {
		// If room exists, return true
		peek: room ? true : false,
		boo: room
	}
	ctx.response.body = toReturn
})

//////////////////
// New releases //
//////////////////
let release: any;
router.post("/releases", async (ctx) => {
	const reqBody = ctx.request.body
	const data = await reqBody.json()
	release = data
	ctx.response.body = data
})
router.get("/releases", async (ctx) => {
	ctx.response.body = release
})

router.get("/updates", (ctx) => {
	ctx.response.body = data
})

app.use(oakCors({
	origin: "*"
}))
app.use(router.routes())
app.use(router.allowedMethods())
app.use(async (ctx, next) => {
	const root = `${Deno.cwd()}/static`
	try {
		await ctx.send({ root })
	} catch {
		next()
	}
})

const handler = io.handler(async (req) => {
	return await app.handle(req) || new Response(null, { status: 404 })
})

await serve(handler, {
	hostname:  "0.0.0.0",
	port: parseInt(port),
})
