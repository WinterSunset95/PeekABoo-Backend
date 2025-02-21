import { IAnimeEpisode } from "@consumet/extensions";

export const mediaTypes = [ "anime", "movie", "tv", "unknown" ] as const
export type MediaTypes = typeof mediaTypes[number]

export interface MovieSearchResult {
	Id: string;
	Title: string;
	Poster: string;
	Type: "anime" | "movie" | "tv" | "unknown";
}

export interface MovieInfo extends MovieSearchResult {
	Overview: string;
	Year: string;
	Duration: string;
	Genres: string[];
	Languages: string[];
}

export interface AnimeInfo extends MovieInfo {
	Episodes: IAnimeEpisode[]
}

export interface TvSeason {
	AirDate: string,
	EpisodeCount: number,
	Id: number,
	Name: string,
	Poster: string,
	Overview: string,
	SeasonNumber: string
}

export interface TvInfo extends MovieInfo {
	Season: TvSeason[]
}

export interface MediaInfo extends MovieInfo {
	AnimeEpisodes?: IAnimeEpisode[],
	TvShowSeason?: TvSeason[],
}

export interface User {
	UserId: string,
	UserName: string,
	UserImage: string
}

export interface RoomCreate extends User {
	MediaId: string,
}

export interface OpenRoom extends User {
	RoomId: string,
	RoomName: string,
	Participants: User[],
	CurrentMedia?: MovieSearchResult,
	Messages: ChatMessage[],
}

export interface ActiveAnimeRoom extends OpenRoom {
	EpisodeId: string,
	Playing: boolean,
	TimeStamp: number
}

export interface ChatMessage extends User {
	MessageType: "text" | "sticker" | "media",
	Message: string
}

export interface RoomMessage<T> {
	RoomId: string,
	SenderId: string,
	Payload: T
}

export interface Release {
	Version: string,
	Apk: string,
	ChangeLogs: string
}

// When user requests to join a room
// Should recieve OpenRoom as result
export interface RoomRequest {
	RoomId: string,
	RequesterId: string,
}

export interface PeekABoo<T> {
	peek: boolean;
	boo: T;
}
