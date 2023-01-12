import {YouTubeVideo} from "play-dl";
import {AudioResource, VoiceConnection} from "@discordjs/voice";
import {TextBasedChannel, VoiceBasedChannel} from "discord.js";

export interface Song {
	video: YouTubeVideo,
	audioSource: AudioResource
}

export interface ISong{
	guildId: string;
	queue: Song[];
	voiceChannel: VoiceBasedChannel;
	textChannel: TextBasedChannel;
}