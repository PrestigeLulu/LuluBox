import {EmbedBuilder, TextBasedChannel, VoiceBasedChannel} from "discord.js";
import {AudioPlayerStatus, createAudioPlayer, VoiceConnection} from "@discordjs/voice";
import {YouTubeVideo} from "play-dl";
import {Song} from "./Interface/Song";

const queues: { [key: string]: Song[] } = {};

let globalVoiceChannel: { [key: string]: VoiceBasedChannel | null } = {};
let globalTextChannel: { [key: string]: TextBasedChannel | null } = {};
let globalConnection: { [key: string]: VoiceConnection | null } = {};


export async function addSongToQueue(guildId: string, song: Song, voiceChannel: VoiceBasedChannel, textChannel: TextBasedChannel, connection: VoiceConnection) {
	issetInfo(guildId);
	queues[guildId].push(song);
	if (getQueue(guildId) <= 1) {
		await playSong(guildId, voiceChannel, textChannel, connection);
		await setChannel(guildId, voiceChannel, textChannel, connection);
	}
}

export function skipSong(guildId: string) {
	issetInfo(guildId);
	if (getQueue(guildId) === 0) return;
	queues[guildId][0].audioSource.audioPlayer?.stop();
}

function issetInfo(guildId: string) {
	if (!Object.keys(queues).includes(guildId)) {
		queues[guildId] = [];
	}
	if (!Object.keys(globalVoiceChannel).includes(guildId)) {
		globalVoiceChannel[guildId] = null;
	}
	if (!Object.keys(globalTextChannel).includes(guildId)) {
		globalTextChannel[guildId] = null;
	}
	if (!Object.keys(globalConnection).includes(guildId)) {
		globalConnection[guildId] = null;
	}
}

export function getQueue(guildId: string): number {
	issetInfo(guildId);
	return Object.keys(queues[guildId]).length;
}

async function setChannel(guildId: string, voiceChannel: VoiceBasedChannel | null, textChannel: TextBasedChannel | null, connection: VoiceConnection | null) {
	issetInfo(guildId);
	globalVoiceChannel[guildId] = voiceChannel;
	globalTextChannel[guildId] = textChannel;
	globalConnection[guildId] = connection;
}

export async function playSong(guildId: string, voiceChannel: VoiceBasedChannel, textChannel: TextBasedChannel, connection: VoiceConnection) {
	issetInfo(guildId);
	const resource = queues[guildId][0].audioSource;
	const player = createAudioPlayer();
	const video = queues[guildId][0].video;

	player.on("stateChange", async (oldState, newState) => {
		if (globalVoiceChannel[guildId] === null || globalTextChannel[guildId] === null || globalConnection[guildId] === null) return;
		if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
			queues[guildId].shift();
			if (getQueue(guildId) > 0) {
				await playSong(guildId, globalVoiceChannel[guildId]!, globalTextChannel[guildId]!, globalConnection[guildId]!);
				return;
			}
			const embed = new EmbedBuilder()
				.setTitle('노래를 전부 재생했어!')
				.setDescription('노래가 5분동안 추가되지 않으면 자동으로 나갈게!')
				.setColor('#fbb753');
			globalTextChannel[guildId]?.send({embeds: [embed]});
			setTimeout(() => {
				if (getQueue(guildId) !== 0) return;
				if (globalConnection[guildId]?.state?.status === "ready") {
					const embed = new EmbedBuilder()
						.setTitle('노래를 전부 재생했어!')
						.setDescription('노래가 5분동안 추가되지 않아서 나갈게!')
						.setColor('#fbb753');
					globalTextChannel[guildId]?.send({embeds: [embed]});
					globalConnection[guildId]?.destroy();
				}
			}, 5000 * 60);
		}
	});
	player.on("stateChange", async (oldState, newState) => {
		if (globalVoiceChannel[guildId] === null || globalTextChannel[guildId] === null || globalConnection[guildId] === null) return;
		if (newState.status !== AudioPlayerStatus.AutoPaused) return;
		queues[guildId].splice(0)
		await setChannel(guildId, null, null, null);
	});
	player.on("error", () => {
		queues[guildId].splice(0);
	});
	connection?.subscribe(player);
	player.play(resource);

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