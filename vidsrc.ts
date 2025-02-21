import { accepts } from "jsr:@std/http@1/negotiation";
import * as cheerio from "npm:cheerio"
import { decrypt } from "./decrypt.ts";

let BASEURL = "https://example.com";

interface Servers {
	name?: string,
	dataHash?: string 
}

interface ApiRes {
	name?: string,
	image?: string,
	mediaId?: string,
	stream?: string,
	referer: string
}

interface RcpRes {
	metadata: {
		image: string
	},
	data: string
}

const loadServers = (rawHtml: string): { servers: Servers[]; title: string } => {
	const $ = cheerio.load(rawHtml)
	const serversArr: Servers[] = [];
	const title = $("title").text() ?? "";
	const base = $("iframe").attr("src") ?? ""
	BASEURL = new URL(base.startsWith("//") ? `https:${base}` : base).origin ?? BASEURL;
	console.log(BASEURL)
	$(".serversList .server").each((index, element) => {
		const server = $(element)
		serversArr.push({
			name: server.text().trim(),
			dataHash: server.attr("data-hash")
		})
	})

	return {
		servers: serversArr,
		title: title
	}
}

const getProrcp = async (rcpUrl: string): Promise<string | undefined> => {
	console.log(rcpUrl)
	const res = await fetch("http://localhost:8000/vidsrc", {
		method: "POST",
		body: JSON.stringify({ url: rcpUrl }),
		headers: {
			"content-type": "application/json"
		}
	})
	const data = await res.json()
	const html = data.result
	const regex = /src:\s*'([^']*)'/
	const match = html.match(regex)
	console.log(match)
	if (!match) return undefined
	return match[1]
}

const getM3u8FromProrcp = async (prorcp: string): Promise<string | undefined> => {
	console.log(`getM3u8FromProrcp: ${prorcp}`)
	const url = `${BASEURL}${prorcp}`

	console.log(url)
	const res = await fetch(url, {
		redirect: "follow"
	})

	const resText = await res.text();
	console.log(resText)

	const scripts = resText.match(/<script\s+src="\/([^"]*\.js)\?\_=([^"]*)"><\/script>/gm);
	const script = (scripts?.[scripts.length - 1].includes("cpt.js"))
		? scripts?.[scripts.length - 2].replace(/.*src="\/([^"]*\.js)\?\_=([^"]*)".*/, "$1?_=$2")
		: scripts?.[scripts.length - 1].replace(/.*src="\/([^"]*\.js)\?\_=([^"]*)".*/, "$1?_=$2");
	const jsFileReq = await fetch(
		`${BASEURL}/${script}`,
		{
			"headers": {
				"accept": "*/*",
				"accept-language": "en-US,en;q=0.9",
					"priority": "u=1",
					"sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
					"sec-ch-ua-mobile": "?0",
				"sec-ch-ua-platform": "\"Windows\"",
				"sec-fetch-dest": "script",
				"sec-fetch-mode": "no-cors",
				"sec-fetch-site": "same-origin",
				"Referer": `${BASEURL}/`,
				"Referrer-Policy": "origin",
			},
			"body": null,
			"method": "GET",
		},
	);
	const jsCode = await jsFileReq.text();
	const decryptRegex = /{}\}window\[([^"]+)\("([^"]+)"\)/;
	const decryptMatches = jsCode.match(decryptRegex);
	// ^ this func is the decrypt function (fn name)
	// List of examples
	// window[bMGyx71TzQLfdonN("C66jPHx8qu")] = C66jPHx8qu(document.getElementById(bMGyx71TzQLfdonN("C66jPHx8qu")).innerHTML);
	// function bMGyx71TzQLfdonN() will split the argument into groups of three, reverse the order of those groups, and rejoin them to get the <div> that contains the encrypted m3u8 ilnk
	// eg: C66jPHx8qu -> ["C66","jPH","x8q","u"] -> ["u","x8q","jPH","C66"] -> ux8qjPHC66
	//		Which is the id of the <div> that contains the encrypted link
	const $ = cheerio.load(resText);
	if (!decryptMatches || decryptMatches?.length < 3) return undefined;
	const id = decrypt(decryptMatches[2].toString().trim(), decryptMatches[1].toString().trim());
	console.log(id)
	const data = $("#" + id);
	const result = await decrypt(data.text(), decryptMatches[2].toString().trim());
	return result;
}

export const vidsrcScrape = async (tmdbId: string, type: "movie" | "tv", season?: number, episode?: number): Promise<ApiRes[]> => {
	const url = (type === "movie")
		? `https://vidsrc.net/embed/${type}?tmdb=${tmdbId}`
		: `https://vidsrc.net/embed/${type}?tmdb=${tmdbId}&season=${season}&episode=${episode}`
	//const url = (type === "movie")
	//	? `https://vidsrc.net/embed/${type}?tmdb=${tmdbId}`
	//	: `https://vidsrc.to/embed/${type}?tmdb=${tmdbId}&season=${season}&episode=${episode}`
	// Get the raw html from the links above
	console.log(url)
	const embed = await fetch(url);
	const embedRes = await embed.text()

	const apiResponse: ApiRes[] = []
	// Load a list of servers and the title from the raw html
	const { servers, title } = loadServers(embedRes)
	console.log("Movie title: " + title)

	// Vidsrc has an iframe which embeds from /rcp/<server hash>
	// Which in turn has another iframe which embeds from /prorcp/<some random hash>
	// To get that /prorcp/<hash>, we will use puppeteer to open up the link in
	// A headless browser, and grab the html
	const proRcpArr = await Promise.all(servers.map(server => {
		return getProrcp(`${BASEURL}/rcp/${server.dataHash}`)
	}))

	for (const item of proRcpArr) {
		if (!item) continue;
		apiResponse.push({
			name: title,
			image: "",
			mediaId: tmdbId,
			stream: await getM3u8FromProrcp(item),
			referer: BASEURL
		})
	}

	return apiResponse
}
