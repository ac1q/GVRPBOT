const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "../data/startup_messages.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("cohost")
        .setDescription("Assign yourself as the session Co-Host."),

    async execute(interaction) {
        const host = interaction.user;

        
        if (!fs.existsSync(dataFile)) {
            return interaction.reply({ content: "❌ No startup sessions found.", flags: 64 });
        }

        const data = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
        const startupMessageId = data[interaction.channel.id];
        if (!startupMessageId) {
            return interaction.reply({ content: "❌ No startup session found in this channel.", flags: 64 });
        }

        
        let startupMessage;
        try {
            startupMessage = await interaction.channel.messages.fetch(startupMessageId);
        } catch {
            return interaction.reply({ content: "❌ Could not fetch the startup message.", flags: 64 });
        }

        
        await startupMessage.react("👍");

        
        const cohostEmbed = new EmbedBuilder()
            .setTitle("Kofu's Roleplay Group | Co-Host")
            .setDescription(
                `${host} is the session's **Co-Host** for this session.\n\n` +
                `If you have any immediate questions or require assistance during the host's temporary absences, please direct your inquiries to the co-host for support.`
            )
            .setColor("Red");

        
        await startupMessage.reply({ embeds: [cohostEmbed] });

        
        await interaction.reply({ content: "✅ You are now the Co-Host.", flags: 64 });
    }
};
