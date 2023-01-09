import {EmbedBuilder, TextBasedChannel, VoiceBasedChannel} from "discord.js";
import {AudioPlayerStatus, AudioResource, createAudioPlayer, VoiceConnection} from "@discordjs/voice";
import {YouTubeVideo} from "play-dl";

export interface Song {
	video: YouTubeVideo,
	audioSource: AudioResource
}

const queues: Song[] = [];
let isAdding = false;

const player = createAudioPlayer();
let globalVoiceChannel: VoiceBasedChannel|null = null;
let globalTextChannel: TextBasedChannel|null = null;
let globalConnection: VoiceConnection|null = null;

player.on("stateChange", async (oldState, newState) => {
	if(globalVoiceChannel === null || globalTextChannel === null || globalConnection === null) return;
	if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
		queues.shift();
		if (queues.length > 0) {
			await playSong(globalVoiceChannel, globalTextChannel, globalConnection);
		} else {
			if (globalConnection.disconnect()) {
				const embed = new EmbedBuilder()
					.setTitle('노래를 전부 재생했어!')
					.setColor('#fbb753');
				globalTextChannel.send({embeds: [embed]});
				globalConnection.destroy();
			}
		}
	}
});
player.on("stateChange", async (oldState, newState) => {
	if(globalVoiceChannel === null || globalTextChannel === null || globalConnection === null) return;
	if (newState.status === AudioPlayerStatus.AutoPaused) {
		queues.splice(0)
		await eventSocket(null, null, null);
	}
});
player.on("error", () => {
	queues.splice(0);
});

export function getIsAdding() {
	return isAdding;
}

export async function addSongToQueue(song: Song, voiceChannel: VoiceBasedChannel, textChannel: TextBasedChannel, connection: VoiceConnection) {
	queues.push(song);
	if (queues.length <= 1) {
		isAdding = true;
		await playSong(voiceChannel, textChannel, connection);
		isAdding = false;
		await eventSocket(voiceChannel, textChannel, connection);
	}
}

async function eventSocket(voiceChannel: VoiceBasedChannel|null, textChannel: TextBasedChannel|null, connection: VoiceConnection|null) {
	globalVoiceChannel = voiceChannel;
	globalTextChannel = textChannel;
	globalConnection = connection;
}

export function getQueue() {
	return queues;
}

export async function skipSong() {
	player.stop();
}

export async function playSong(voiceChannel: VoiceBasedChannel, textChannel: TextBasedChannel, connection: VoiceConnection) {
	await connection.subscribe(player);
	const video = queues[0].video;
	const resource = queues[0].audioSource;
	await player.play(resource);

	const successEmbed = new EmbedBuilder()
		.setAuthor({
			name: '지금 노래 재생중 !',
		})
		.setURL(video.url)
		.setTitle(`${video.title}`)
		.setColor('Red')
		.setThumbnail(video.thumbnails[0].url)
		.setDescription(`**YOUTUBE** | \`${getTime(video)}\``)
	await textChannel.send({embeds: [successEmbed]});
}

export function getTime(video: YouTubeVideo): string {
	const seconds = video.durationInSec;
	const hour = Math.floor(seconds / 3600) < 10 ? '0' + Math.floor(seconds / 3600) : Math.floor(seconds / 3600);
	const min = Math.floor((seconds % 3600) / 60) < 10 ? '0' + Math.floor((seconds % 3600) / 60) : Math.floor((seconds % 3600) / 60);
	const sec = seconds % 60 < 10 ? '0' + seconds % 60 : seconds % 60;
	return `${hour}:${min}:${sec}`;
}