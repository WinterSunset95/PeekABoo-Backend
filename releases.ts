import { Release } from "./types.ts";

export const data: { latest: Release, previous: Release[] } = {
	latest: {
		Version: "1.0.7",
		Apk: "/apk/peekaboo-1.0.7.apk",
		ChangeLogs: `
		- Fixed visual bugs in the MediaInfo page
		- Better error handling
		- Optimised the MediaInfo page
		`,
	},
	previous: [
		{
			Version: "1.0.6",
			Apk: "/apk/peekaboo-1.0.6.apk",
			ChangeLogs: `
			- Merged AnimeInfo, MovieInfo and TvInfo into one single MediaInfo page
			- Added support for a Vidsrc scraper
			- Ad-free streaming for movies (tv-shows not supported yet)
			- Added a scraper in the backend
			- Fixed the m3u8 proxy
			`,
		},

		{
			Version: "1.0.5",
			Apk: "/apk/peekaboo-1.0.5.apk",
			ChangeLogs: `
			- Changed the way socket connections are handled
			- Added a proper login page
			- Changed the user connection method
			- Fixed useState() bugs using useRef()
			`,
		},
		{
			Version: "1.0.1",
			Apk: "https://github.com/WinterSunset95/PeekABoo/releases/download/1.0.1/app-debug.apk",
			ChangeLogs: "Added support for sockets"
		},
		{
			Version: "1.0.0",
			Apk: "https://github.com/WinterSunset95/PeekABoo/releases/download/1.0.0/app-debug.apk",
			ChangeLogs: "Initial version of my app"
		}
	]
}
