import {EmbedBuilder, TextBasedChannel, VoiceBasedChannel} from "discord.js";
import {
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	getVoiceConnection,
	VoiceConnection
} from "@discordjs/voice";
import {YouTubeVideo} from "play-dl";
import {Song} from "./DataBase/Interface/Song";
import SongModel from "./DataBase/Schema/SongSchema";

const queues: Song[] = [];

let globalVoiceChannel: VoiceBasedChannel | null = null;
let globalTextChannel: TextBasedChannel | null = null;
let globalConnection: VoiceConnection | null = null;


export async function addSongToQueue(guildId: string, song: Song, voiceChannel: VoiceBasedChannel, textChannel: TextBasedChannel) {
	await SongModel.create({
		guildId: guildId,
		queue: [],
		voiceChannel: '',
		textChannel: '',
	}).catch((error:any)=>{
		console.log(error)
	});
	/*await SongModel.updateOne({guildId: guildId}, {
		$push: {song: song},
		upsert: true
	})*/
	// if (0 <= 1) {
		await playSong(guildId, voiceChannel, textChannel);
	// }
}

export async function getQueue(guildId: string) {
	let result;
	await SongModel.find({guildId: guildId}).then((song) => {
		result = song;
		console.log(result)
	});
	return result;
}

export function skipSong(guildId: string) {
	queues[0].audioSource.audioPlayer?.stop();
}

async function setChannel(guildId: string, voiceChannel: VoiceBasedChannel | null, textChannel: TextBasedChannel | null, connection: VoiceConnection | null) {
	SongModel.updateOne({guildId: guildId}, {
		voiceChannel: voiceChannel,
		textChannel: textChannel,
		connection: connection,
		upsert: true
	})
}

export async function playSong(guildId:string, voiceChannel: VoiceBasedChannel, textChannel: TextBasedChannel) {
	const resource = createAudioResource('https://www.youtube.com/watch?v=QH2-TGUlwu4');
	const player = createAudioPlayer();

	player.on("stateChange", async (oldState, newState) => {
		if (globalVoiceChannel === null || globalTextChannel === null || globalConnection === null) return;
		if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
			queues.shift();
			if (queues.length > 0) {
				await playSong(guildId, globalVoiceChannel, globalTextChannel);
				return;
			}
			const embed = new EmbedBuilder()
				.setTitle('노래를 전부 재생했어!')
				.setDescription('노래가 1분동안 추가되지 않으면 자동으로 나갈게!')
				.setColor('#fbb753');
			globalTextChannel.send({embeds: [embed]});
			setTimeout(() => {
				if (queues.length !== 0) return;
				const embed = new EmbedBuilder()
					.setTitle('노래를 전부 재생했어!')
					.setDescription('노래가 1분동안 추가되지 않아서 나갈게!')
					.setColor('#fbb753');
				globalTextChannel?.send({embeds: [embed]});
				globalConnection?.destroy();
			}, 1000 * 60);
		}
	});
	player.on("stateChange", async (oldState, newState) => {
		if (globalVoiceChannel === null || globalTextChannel === null || globalConnection === null) return;
		if (newState.status !== AudioPlayerStatus.AutoPaused) return;
		queues.splice(0)
		await setChannel(guildId, null, null, null);
	});
	player.on("error", () => {
		queues.splice(0);
	});
	getVoiceConnection(guildId)?.subscribe(player);

	const video = queues[0].video;
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