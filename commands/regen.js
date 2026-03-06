const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('regen')
        .setDescription('Post a roleplay link regeneration notice (staff only)'),

    async execute(interaction) {
        try {
            const STAFF_ROLE = '1416869930199945381';
            if (!interaction.member || !interaction.member.roles.cache.has(STAFF_ROLE)) {
                return interaction.reply({ content: '❌ You do not have permission to use this command.', flags: 64 });
            }

            const embed = new EmbedBuilder()
                .setTitle('Kofu\'s Roleplay Group — Link Regeneration')
                .setColor('Red')
                .setDescription(
                    '<:hi:1420907999379066880> **This message confirms that the current roleplay session is at maximum capacity.**\n' +
                    'The previous invitation link has been automatically regenerated and is now invalid. As a result, you will be unable to join the ongoing session at this time.\n\n' +
                    '<:hi:1420907999379066880> **To maintain an organized queue, please adhere to the following rule:**\n' +
                    'Re-invitations and new invites are processed automatically every 20–30 minutes. Any direct requests or pings to the host regarding invitations or reinvites during this waiting period will result in an immediate mute.'
                )
                .setFooter({ text: `Issued by ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.channel.send({ embeds: [embed] });
            await interaction.reply({ content: '✅ Regeneration notice posted.', flags: 64 });
        } catch (err) {
            console.error('regen command error', err);
            if (!interaction.replied) await interaction.reply({ content: '❌ Error posting regeneration notice.', flags: 64 });
        }
    }
};
