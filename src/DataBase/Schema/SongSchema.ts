import * as mongoose from "mongoose";
import {ISong, Song} from "../Interface/Song";

const keySchema = new mongoose.Schema<ISong>({
	guildId: {type: String, required: true},
	queue: {type: Array<Song>(), required: true},
	voiceChannel: {type: Object, required: true},
	textChannel: {type: Object, required: true},
});

const SongModel: mongoose.Model<ISong> = mongoose.model('Song', keySchema);

export default SongModel;