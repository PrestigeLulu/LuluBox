import {YouTubeVideo} from "play-dl";
import {AudioResource} from "@discordjs/voice";

export interface Song {
	video: YouTubeVideo,
	audioSource: AudioResource
}