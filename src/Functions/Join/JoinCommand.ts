import {EmbedBuilder, GuildMember, SlashCommandBuilder} from "discord.js";
import {joinVoiceChannel} from "@discordjs/voice";
import SlashCommand from "../../Structures/SlashCommand";

const slashCommandBuilder = new SlashCommandBuilder()
	.setName('join')
	.setDescription('음성채널에 들어가는 명령어야!')

const JoinCommand = new SlashCommand(slashCommandBuilder, ['j'], async (bot, interaction) => {
	if (!(!(interaction.member instanceof GuildMember) || interaction.member.partial)) {
		const channel = interaction.member?.voice.channel;
		if (!channel) {
			const embed = new EmbedBuilder()
				.setTitle('먼저 음성채널에 들어가야해!')
				.setColor('#fbb753')
			await interaction.reply({embeds: [embed]});
			return;
		}
		joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator
		});
		const embed = new EmbedBuilder()
			.setTitle('음성채널에 들어갔어!')
			.setColor('#fbb753')
		await interaction.reply({embeds: [embed]});
	}
});

export default JoinCommand;