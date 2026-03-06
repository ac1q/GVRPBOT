
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const statsFile = path.join(dataDir, "session_stats.json");
const entriesFile = path.join(dataDir, "session_entries.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sessionlog")
        .setDescription("Log a completed session (host or co-host).")
        .addStringOption(option =>
            option.setName("type")
                .setDescription("Type of session")
                .setRequired(true)
                .addChoices(
                    { name: "Host", value: "host" },
                    { name: "Co-Host", value: "cohost" }
                )
        )
        .addStringOption(option =>
            option.setName("duration")
                .setDescription("Duration of the session (e.g., 1h 2m)")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("date")
                .setDescription("Date of the session (MM/DD/YYYY)")
                .setRequired(true)
        ),

    async execute(interaction) {
        const allowedRole = "1416869930199945381";
        if (!interaction.member.roles.cache.has(allowedRole)) {
            return interaction.reply({
                content: "❌ You do not have permission to use this command.",
                flags: 64
            });
        }

        const type = interaction.options.getString("type"); // host / cohost
        const duration = interaction.options.getString("duration");
        const date = interaction.options.getString("date");

        
        let stats = {};
        if (fs.existsSync(statsFile)) {
            stats = JSON.parse(fs.readFileSync(statsFile, "utf8"));
        }

        const userId = interaction.user.id;
        if (!stats[userId]) stats[userId] = { host: 0, cohost: 0 };

        if (type === "host") stats[userId].host += 1;
        else stats[userId].cohost += 1;

        fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));

        
        try {
            let entries = [];
            if (fs.existsSync(entriesFile)) {
                try {
                    entries = JSON.parse(fs.readFileSync(entriesFile, 'utf8')) || [];
                    if (!Array.isArray(entries)) entries = [];
                } catch (e) {
                    entries = [];
                }
            }
            const entry = {
                userId: userId,
                type: type, // 'host' or 'cohost'
                duration: duration,
                date: date,
                recordedAt: new Date().toISOString(),
                recordedBy: `${interaction.user.tag}`
            };
            entries.unshift(entry); // newest first
            
            if (entries.length > 1000) entries.length = 1000;
            fs.writeFileSync(entriesFile, JSON.stringify(entries, null, 2));
        } catch (err) {
            
        }

        
        const statsEmbed = new EmbedBuilder()
            .setTitle("KRG | Session Log")
            .setColor("Red")
            .setDescription(
                `**User:** ${interaction.user}\n` +
                `**Date:** ${date}\n` +
                `**Duration:** ${duration}\n\n` +
                `**This user has co-hosted:** ${stats[userId].cohost} times\n` +
                `**This user has hosted:** ${stats[userId].host} times`
            )
            .setTimestamp();

        const statsChannel = interaction.guild.channels.cache.get("1416869933207519304");
        if (statsChannel) await statsChannel.send({ embeds: [statsEmbed] });

        await interaction.reply({ content: "✅ Session logged successfully.", flags: 64 });
    }
};
