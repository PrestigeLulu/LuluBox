import {EmbedBuilder, GuildMember, SlashCommandBuilder} from "discord.js";
import {addSongToQueue, getIsAdding, getQueueLengthPlus, getTime} from '../../Queue';
import SlashCommand from "../../Structures/SlashCommand";
import play from 'play-dl';
import {createAudioResource, joinVoiceChannel} from "@discordjs/voice";
import {Song} from "../../DataBase/Schema/Song";

const slashCommandBuilder = new SlashCommandBuilder()
	.setName('play')
	.setDescription('노래를 트는 명령어야!')
	.addStringOption(option =>
		option
			.setName('song')
			.setDescription('노래 이름이나 유튜브 링크를 입력해줘!')
			.setRequired(true)
	)

const PlayCommand = new SlashCommand(slashCommandBuilder, ['p'], async (bot, interaction) => {
	const song = interaction.options.getString('song', true);
	if (getIsAdding()) {
		const embed = new EmbedBuilder()
			.setTitle('너무 빠른것같아! 잠시만 기다려줘!')
			.setColor('#fbb753');
		await interaction.reply({embeds: [embed]});
		return;
	}
	if (!(!(interaction.member instanceof GuildMember) || interaction.member.partial)) {
		const channel = interaction.member?.voice.channel;
		if (!channel) {
			const embed = new EmbedBuilder()
				.setTitle('먼저 음성채널에 들어가줘!')
				.setColor('#fbb753')
			await interaction.reply({embeds: [embed]});
			return;
		}
		const connection = await joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator
		});
		if (song.startsWith('https://youtu.be/watch?v=') || song.startsWith('https://www.youtu.be/watch?v=') || song.startsWith('https://youtube.com/watch?v=') || song.startsWith('https://www.youtube.com/watch?v=')) {
			if (!(await play.validate(song))) {
				const embed = new EmbedBuilder()
					.setTitle('유효하지 않은 링크야!')
					.setColor('#fbb753')
				await interaction.reply({embeds: [embed]});
				return;
			}
			await play.video_info(song)
				.then(async (yt_info) => {
					const video = yt_info.video_details;
					if (video.live) {
						const embed = new EmbedBuilder()
							.setTitle('라이브는 지원하지 않아!')
							.setColor('#fbb753')
						await interaction.reply({embeds: [embed]});
						return;
					}
					const embed = new EmbedBuilder()
						.setAuthor({
							name: (getQueueLengthPlus()) + '번 대기열에 추가됨!',
						})
						.setURL(video.url)
						.setTitle(`${video.title}`)
						.setColor('#fbb753')
						.setThumbnail(video.thumbnails[0].url)
						.setDescription(`**YOUTUBE** | \`${getTime(video)}\``)
					await interaction.reply({embeds: [embed]}).catch((error: any) => console.log(error));
					const stream = await play.stream_from_info(yt_info);
					const resource = await createAudioResource(stream.stream, {inputType: stream.type});
					const songI: Song = {
						video: video,
						audioSource: resource,
					}
					await addSongToQueue(interaction.guildId!, songI, channel, interaction.channel!, connection);
				})
				.catch(async (err: any) => {
					const embed = new EmbedBuilder()
						.setTitle('알수없는 오류야!')
						.setColor('#fbb753')
					await interaction.reply({embeds: [embed]});
				})
		} else {
			const yt_info = await play.search(song, {limit: 1});
			if (!yt_info || yt_info.length < 1) {
				const embed = new EmbedBuilder()
					.setTitle('노래를 찾을 수 없어!')
					.setColor('#fbb753')
				await interaction.reply({embeds: [embed]});
				return;
			}
			const video = yt_info[0];
			const embed = new EmbedBuilder()
				.setAuthor({
					name: (getQueueLengthPlus()) + '번 대기열에 추가됨!',
				})
				.setURL(video.url)
				.setTitle(`${video.title}`)
				.setColor('#fbb753')
				.setThumbnail(video.thumbnails[0].url)
				.setDescription(`**YOUTUBE** | \`${getTime(video)}\``)
			await interaction.reply({embeds: [embed]}).catch((error: any) => console.log(error));
			const stream = await play.stream(video.url, {discordPlayerCompatibility: true});
			const resource = await createAudioResource(stream.stream, {inputType: stream.type});
			const songI: Song = {
				video: video,
				audioSource: resource,
			}
			await addSongToQueue(interaction.guildId!, songI, channel, interaction.channel!, connection);
		}
	}
});

export default PlayCommand;