const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const infractionsFile = path.join(dataDir, 'infractions.json');
if (!fs.existsSync(infractionsFile)) fs.writeFileSync(infractionsFile, '{}');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('infract')
        .setDescription('Issue an infraction to a user')
        .addUserOption(opt => opt.setName('user').setDescription('User to infract').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the infraction').setRequired(true))
        .addStringOption(opt => opt.setName('evidence').setDescription('Evidence / links (required)').setRequired(true)),

    async execute(interaction) {
        try {
            const STAFF_ROLE = '1416869930199945381';

            if (!interaction.member || !interaction.member.roles.cache.has(STAFF_ROLE)) {
                return interaction.reply({ content: '❌ You do not have permission to use this command.', flags: 64 });
            }

            const target = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const evidence = interaction.options.getString('evidence') || 'No evidence provided';

            const embed = new EmbedBuilder()
                .setTitle('KRG | Moderation Action')
                .setColor('Red')
                .setDescription(`*You have been given __1 Infraction__ in Kofu's Roleplay Group*\n\n` +
                    `**Reason(s): ** __${reason}__\n\n` +
                    `**Evidence: ** __${evidence}__\n\n` +
                    `**We DON'T tolerate this behavior at __Kofu's Roleplay Group__**.\n` +
                    `**If you belive that this moderation is false, please open a ticket and wait for a __High Command__ member to assist you.**\n\n` +
                    `*-Signed, ${interaction.user.tag}`)
                .setTimestamp();

            
            try {
                let infractionsData = {};
                try { infractionsData = JSON.parse(fs.readFileSync(infractionsFile, 'utf8') || '{}'); } catch (e) { infractionsData = {}; }
                if (!Array.isArray(infractionsData[target.id])) infractionsData[target.id] = [];
                const entry = {
                    id: Date.now().toString(),
                    issuerId: interaction.user.id,
                    issuerTag: interaction.user.tag,
                    reason,
                    evidence,
                    date: new Date().toISOString()
                };
                infractionsData[target.id].push(entry);
                fs.writeFileSync(infractionsFile, JSON.stringify(infractionsData, null, 2));

                
                try {
                    const MOD_LOG_CHANNEL = '1416869933207519308';
                    const logChannel = interaction.guild.channels.cache.get(MOD_LOG_CHANNEL) || interaction.client.channels.cache.get(MOD_LOG_CHANNEL);
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('Infraction Issued')
                            .setColor('Red')
                            .addFields(
                                { name: 'Target', value: `${target.tag} (${target.id})`, inline: true },
                                { name: 'Issued by', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                                { name: 'ID', value: entry.id, inline: true },
                                { name: 'Reason', value: reason },
                                { name: 'Evidence', value: evidence }
                            )
                            .setTimestamp();
                        logChannel.send({ embeds: [logEmbed] }).catch(() => {});
                    }
                } catch (e) { console.error('Failed to send mod log', e); }
            } catch (e) {
                console.error('Failed to persist infraction', e);
            }

            
            let sent = true;
            try {
                await target.send({ embeds: [embed] });
            } catch (err) {
                sent = false;
            }

            await interaction.reply({ content: sent ? `✅ Infraction DM sent to ${target.tag}` : `⚠️ Could not DM ${target.tag}. They may have DMs disabled. Infraction was recorded.`, flags: 64 });
        } catch (err) {
            console.error('infract command error', err);
            if (!interaction.replied) await interaction.reply({ content: '❌ Error issuing infraction.', flags: 64 });
        }
    }
};
