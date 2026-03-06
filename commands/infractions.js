const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const infractionsFile = path.join(dataDir, 'infractions.json');
if (!fs.existsSync(infractionsFile)) fs.writeFileSync(infractionsFile, '{}');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('infractions')
        .setDescription('View a user\'s infractions')
        .addUserOption(opt => opt.setName('user').setDescription('User to view infractions for').setRequired(true)),

    async execute(interaction) {
        try {
            const STAFF_ROLE = '1416869930199945381';
            if (!interaction.member || !interaction.member.roles.cache.has(STAFF_ROLE)) {
                return interaction.reply({ content: '❌ You do not have permission to use this command.', flags: 64 });
            }

            const target = interaction.options.getUser('user');

            let infractionsData = {};
            try { infractionsData = JSON.parse(fs.readFileSync(infractionsFile, 'utf8') || '{}'); } catch (e) { infractionsData = {}; }

            const entries = Array.isArray(infractionsData[target.id]) ? infractionsData[target.id] : [];

            if (entries.length === 0) {
                return interaction.reply({ content: `✅ ${target.tag} has no recorded infractions.`, flags: 64 });
            }

            const embed = new EmbedBuilder()
                .setTitle(`Infractions — ${target.tag}`)
                .setColor('Red')
                .setTimestamp();

            const lines = entries.slice().reverse().map(e => {
                const date = new Date(e.date).toLocaleString();
                const short = e.reason.length > 120 ? e.reason.slice(0, 117) + '...' : e.reason;
                return `• ${date} — by ${e.issuerTag}\nReason: ${short}`;
            });

            
            const chunk = lines.join('\n\n');
            embed.setDescription(`**Total infractions:** ${entries.length}\n\n${chunk}`);

            await interaction.reply({ embeds: [embed], flags: 64 });
        } catch (err) {
            console.error('infractions command error', err);
            if (!interaction.replied) await interaction.reply({ content: '❌ Error fetching infractions.', flags: 64 });
        }
    }
};
