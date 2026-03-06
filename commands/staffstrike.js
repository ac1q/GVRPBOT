const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const strikesFile = path.join(dataDir, 'staff_strikes.json');

const ALLOWED_ROLE = '1416869930187489356'; // high-command role

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staffstrike')
        .setDescription('Issue a staff strike to a user (DM + record).')
        .addUserOption(opt => opt.setName('user').setDescription('User to strike').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the strike').setRequired(true))
        .addStringOption(opt => opt.setName('evidence').setDescription('Evidence URL / notes').setRequired(false)),

    async execute(interaction) {
        if (!interaction.member.roles.cache.has(ALLOWED_ROLE)) {
            return interaction.reply({ content: '❌ You do not have permission to issue a staff strike.', flags: 64 });
        }

        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const evidence = interaction.options.getString('evidence') || 'None provided';
        const issuer = interaction.user;

        const strike = {
            id: Date.now().toString(),
            userId: target.id,
            issuerId: issuer.id,
            issuerTag: issuer.tag,
            reason,
            evidence,
            date: new Date().toISOString()
        };

        
        try {
            let arr = [];
            if (fs.existsSync(strikesFile)) arr = JSON.parse(fs.readFileSync(strikesFile, 'utf8')) || [];
            arr.unshift(strike);
            if (arr.length > 2000) arr.length = 2000;
            fs.writeFileSync(strikesFile, JSON.stringify(arr, null, 2));
        } catch (err) {
            console.error('Failed to write strike file', err);
        }

        
        const embed = new EmbedBuilder()
            .setTitle("Kofu's Roleplay Group | Staff Strike")
            .setColor('Red')
            .setDescription(
                '<:hi:1420894625840889967> We regret to inform you that you have received a **STAFF STRIKE** in Kofu\'s Roleplay Group. ' +
                'Any information regarding the reason for the staff strike, also with any evidence that may be needed, will be provided below.'
            )
            .addFields(
                { name: 'Issued By', value: `${issuer.tag}`, inline: true },
                { name: 'Date', value: new Date(strike.date).toUTCString(), inline: true }
            )
            .setFooter({ text: 'If you believe this was issued in error, DM a high command member.' })
            .setTimestamp();

        const reasonButton = new ButtonBuilder()
            .setCustomId(`staffstrike_reason_${strike.id}`)
            .setLabel('View Strike Reason')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(reasonButton);

        
        let dmSuccess = true;
        try {
            const dm = await target.send({ embeds: [embed], components: [row] });

            
            const collector = dm.createMessageComponentCollector({ time: 1000 * 60 * 15 });
            collector.on('collect', async i => {
                if (!i.isButton()) return;
                if (i.customId !== `staffstrike_reason_${strike.id}`) return i.reply({ content: 'Unknown action.', flags: 64 });

                
                const detail = new EmbedBuilder()
                    .setTitle('Strike Reason')
                    .setColor('Red')
                    .addFields(
                        { name: 'Reason', value: reason || 'No reason provided' },
                        { name: 'Evidence', value: evidence || 'None' },
                        { name: 'Date', value: new Date(strike.date).toUTCString() }
                    )
                    .setTimestamp();

                try {
                    await target.send({ embeds: [detail] });
                    await i.reply({ content: 'Strike details sent to your DMs.', flags: 64 });
                } catch (err) {
                    await i.reply({ content: 'Failed to send strike details via DM.', flags: 64 });
                }
            });

            collector.on('end', () => {
                try { dm.edit({ components: [] }).catch(() => {}); } catch (e) {}
            });
        } catch (err) {
            dmSuccess = false;
        }

        await interaction.reply({ content: dmSuccess ? `✅ Strike issued to ${target.tag}.` : `⚠️ Strike recorded but I couldn't DM ${target.tag}.`, flags: 64 });
    }
};
