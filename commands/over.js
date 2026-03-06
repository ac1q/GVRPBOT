
const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ModalBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    Events
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const sessionFile = path.join(dataDir, "session_times.json");
const statsFile = path.join(dataDir, "session_stats.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("over")
        .setDescription("Conclude the current session and provide notes."),

    async execute(interaction) {
        const allowedRole = "1416869930229301316"; // Host role
        if (!interaction.member.roles.cache.has(allowedRole)) {
            return interaction.reply({ content: "❌ You do not have permission.", flags: 64 });
        }

        
        const modal = new ModalBuilder()
            .setCustomId(`session_notes_modal_${interaction.user.id}`)
            .setTitle("Session Conclusion");

        const notesInput = new TextInputBuilder()
            .setCustomId("session_notes_input")
            .setLabel("Session Notes")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Enter notes about this session...")
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(notesInput));
        await interaction.showModal(modal);

        const client = interaction.client;

        const listener = async i => {
            if (i.isModalSubmit() && i.customId === `session_notes_modal_${interaction.user.id}`) {
                const notes = i.fields.getTextInputValue("session_notes_input");

                
                const fetchedMessages = await i.channel.messages.fetch({ limit: 100 });
                const botMessages = fetchedMessages.filter(msg => msg.author.id === client.user.id);
                for (const msg of botMessages.values()) await msg.delete().catch(() => {});

                
                let sessionData = {};
                if (fs.existsSync(sessionFile)) sessionData = JSON.parse(fs.readFileSync(sessionFile, "utf8"));
                const startTime = sessionData[i.user.id] || Math.floor(Date.now() / 1000);
                const endTime = Math.floor(Date.now() / 1000);

                const embed = new EmbedBuilder()
                    .setTitle("Kofu's Roleplay Group | Session Conclusion")
                    .setColor("Red")
                    .setImage("https://cdn.discordapp.com/attachments/1407237867075403776/1442652136163905646/Session_Startup_1_3.png")
                    .setDescription(
                        `Thank you for joining the **Kofu's Roleplay Group** session, hosted by ${i.user}!\n` +
                        `We hope you had an amazing time!\n\n` +
                        `**Session Host:** ${i.user}\n` +
                        `**Start Time:** <t:${startTime}:F>\n` +
                        `**End Time:** <t:${endTime}:F>\n` +
                        `**Session Notes:** ${notes}`
                    );

                const rateButton = new ButtonBuilder()
                    .setCustomId(`rate_session_${i.user.id}`)
                    .setLabel("Rate Session")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("<:hi:1420894525471195266>");

                const row = new ActionRowBuilder().addComponents(rateButton);

                await i.reply({ embeds: [embed], components: [row], ephemeral: false });

                
                const statsChannel = i.guild.channels.cache.get("1416869933207519304");
                if (statsChannel) {
                    try {
                        await statsChannel.send({ embeds: [embed] });
                    } catch (err) {}
                }

                
                try {
                    let stats = {};
                    if (fs.existsSync(statsFile)) stats = JSON.parse(fs.readFileSync(statsFile, "utf8"));
                    if (!stats[i.user.id]) stats[i.user.id] = { host: 0, cohost: 0 };
                    stats[i.user.id].host = (stats[i.user.id].host || 0) + 1;
                    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
                } catch (err) {}

                
                delete sessionData[i.user.id];
                fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
            }

            
            if (i.isButton() && i.customId.startsWith("rate_session_")) {
                const hostId = i.customId.replace("rate_session_", "");
                await i.reply({ content: `Please rate the session hosted by <@${hostId}> (1-5) and provide feedback.`, flags: 64 });

                const logChannel = i.guild.channels.cache.get("1416869933207519303");
                if (logChannel) logChannel.send(`<@${i.user.id}> is rating the session hosted by <@${hostId}>.`);
            }
        };

        client.on(Events.InteractionCreate, listener);

        
        setTimeout(() => client.removeListener(Events.InteractionCreate, listener), 1000 * 60 * 15);
    }
};
