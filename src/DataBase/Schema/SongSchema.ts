import {VoiceConnection} from "@discordjs/voice";
import mongoose, {Model, model, Schema} from 'mongoose';
import {TextBasedChannel, VoiceBasedChannel} from "discord.js";
import {Song} from "./Song";

mongoose.connect('mongodb://127.0.0.1:27017/LuluBox')
	.then(() => console.log('Connected to MongoDB'));

export interface ISong {
	queues: Song[];
	voiceChannel: VoiceBasedChannel | null;
	textChannel: TextBasedChannel | null;
	connection: VoiceConnection | null;
	guildId: string;
}

const songSchema = new Schema<ISong>({
	queues: {type: Array<Song>(), required: true},
	voiceChannel: {type: Object, required: true},
	textChannel: {type: Object, required: true},
	connection: {type: Object, required: true},
	guildId: {type: String, required: true},
});

const SongModel: Model<ISong> = model('Song', songSchema);

export function getQueue(guild: string) {
	return SongModel.find({guildId: guild});
}

export async function addQueue(guild: string, song: Song, voiceChannel: VoiceBasedChannel, textChannel: TextBasedChannel, connection: VoiceConnection) {
	await SongModel.updateOne({guildId: guild}, {
		$pull: {queues: song},
		voiceChannel: voiceChannel,
		textChannel: textChannel,
		connection: connection,
		upsert: true
	});
}

export function getQueueLength(guild: string) {
	const queues = SongModel.find({
		guildId: guild
	});
	// return queues.queue.length;
}

export default SongModel;