import {EmbedBuilder, TextBasedChannel, VoiceBasedChannel} from "discord.js";
import {
	AudioPlayerStatus,
	AudioResource,
	createAudioPlayer,
	PlayerSubscription,
	VoiceConnection
} from "@discordjs/voice";
import {YouTubeVideo} from "play-dl";

export interface Song {
	video: YouTubeVideo,
	audioSource: AudioResource
}

const queues: Song[] = [];
const player = createAudioPlayer();
let isAdding = false;

export function getIsAdding() {
	return isAdding;
}

export async function addSongToQueue(song: Song, voiceChannel: VoiceBasedChannel, textChannel: TextBasedChannel, connection: VoiceConnection) {
	queues.push(song);
	if (queues.length <= 1) {
		isAdding = true;
		await playSong(voiceChannel, textChannel, connection);
		isAdding = false;
		const socket = connection.subscribe(player)
		await eventSocket(socket!, voiceChannel, textChannel, connection);
	}
}

async function eventSocket(socket: PlayerSubscription, voiceChannel: VoiceBasedChannel, textChannel: TextBasedChannel, connection: VoiceConnection) {
	socket.player.on("stateChange", (oldState, newState) => {
		if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
			console.log("재생이 끝났어!");
			queues.shift();
			if (queues.length > 0) {
				playSong(voiceChannel, textChannel, connection);
			} else {
				if (connection.disconnect()) {
					const embed = new EmbedBuilder()
						.setTitle('노래를 전부 재생했어!')
						.setColor('#fbb753');
					textChannel.send({embeds: [embed]});
					connection.destroy();
				}
			}
		}
	});
	socket.player.on("stateChange", async (oldState, newState) => {
		if (newState.status === AudioPlayerStatus.AutoPaused) {
			queues.splice(0)
			socket.unsubscribe();
		}
	});
	socket.player.on("error", () => {
		queues.splice(0);
		player.removeAllListeners('error');
		player.removeAllListeners('stateChange');
	});
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