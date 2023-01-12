import {EmbedBuilder, GuildMember, SlashCommandBuilder} from "discord.js";
import {createAudioPlayer, getVoiceConnection, NoSubscriberBehavior} from "@discordjs/voice";
import SlashCommand from "../../Structures/SlashCommand";
import {skipSong} from "../../Queue";

const slashCommandBuilder = new SlashCommandBuilder()
	.setName('skip')
	.setDescription('노래를 넘겨주는 명령어야!')

const SkipCommand = new SlashCommand(slashCommandBuilder, ['s'], async (bot, interaction) => {
	if (!(!(interaction.member instanceof GuildMember) || interaction.member.partial)) {
		const channel = interaction.member?.voice.channel;
		await createAudioPlayer({
			behaviors: {
				noSubscriber: NoSubscriberBehavior.Pause
			}
		});
		if (!channel) {
			const embed = new EmbedBuilder()
				.setTitle('먼저 음성채널에 들어가줘!')
				.setColor('#fbb753')
			await interaction.reply({embeds: [embed]});
			return;
		}
		let connection = await getVoiceConnection(interaction.guildId!);
		if (!connection) {
			const embed = new EmbedBuilder()
				.setTitle('먼저 노래를 틀어야해!')
				.setColor('#fbb753')
			await interaction.reply({embeds: [embed]});
			return;
		}
		/*if(getQueue() < 1) {
			const embed = new EmbedBuilder()
				.setTitle('대기열에 노래가 없어!')
				.setColor('#fbb753')
			await interaction.reply({embeds: [embed]});
			return;
		}*/
		const embed = new EmbedBuilder()
			.setTitle('노래를 넘겼어!')
			.setColor('#fbb753')
		await interaction.reply({embeds: [embed]}).catch((error: any) => {
			console.log(error)
		});
		skipSong(interaction.guildId!);
	}
});

export default SkipCommand;