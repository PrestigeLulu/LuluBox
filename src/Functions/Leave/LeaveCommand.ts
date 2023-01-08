import {EmbedBuilder, GuildMember, SlashCommandBuilder} from "discord.js";
import {getVoiceConnection} from "@discordjs/voice";
import SlashCommand from "../../Structures/SlashCommand";

const slashCommandBuilder = new SlashCommandBuilder()
	.setName('leave')
	.setDescription('음성채널을 나가는 명령어야!')

const LeaveCommand = new SlashCommand(slashCommandBuilder, ['l'], async (bot, interaction) => {
	if (!(!(interaction.member instanceof GuildMember) || interaction.member.partial)) {
		const connection = getVoiceConnection(interaction.guildId!);
		if (!connection) {
			const embed = new EmbedBuilder()
				.setTitle('음성채널에 들어가있지 않아!')
				.setColor('#fbb753')
			await interaction.reply({embeds: [embed]});
			return;
		}
		connection.destroy();
		const embed = new EmbedBuilder()
			.setTitle('음성 채널에서 나갔어!')
			.setColor('#fbb753')
		await interaction.reply({embeds: [embed]});
	}
});

export default LeaveCommand;