const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const startupFile = path.join(dataDir, "startup_messages.json");
const sessionTimesFile = path.join(dataDir, "session_times.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("startup")
        .setDescription("Start a Kofu Roleplay Group session.")
        .addIntegerOption(option =>
            option.setName("reactions")
                .setDescription("Number of reactions required to start the session")
                .setRequired(true)
        ),

    async execute(interaction) {
        const allowedRole = "1416869930199945381";
        const pingRole = "<@&1416869930229301316>";

        if (!interaction.member.roles.cache.has(allowedRole)) {
            return interaction.reply({ content: "❌ You do not have permission.", flags: 64 });
        }

        const requiredReactions = interaction.options.getInteger("reactions");
        const host = interaction.user;

        
        let sessionData = {};
        if (fs.existsSync(sessionTimesFile)) sessionData = JSON.parse(fs.readFileSync(sessionTimesFile, "utf8"));
        sessionData[host.id] = Math.floor(Date.now() / 1000);
        fs.writeFileSync(sessionTimesFile, JSON.stringify(sessionData, null, 2));

        await interaction.reply({ content: "✅ Session startup created!", flags: 64 });

        const startupEmbed = new EmbedBuilder()
            .setTitle("Kofu's Roleplay Group Session!")
            .setDescription(
                `<:hi:1420907999379066880> ${host} is now hosting a Kofu Roleplay Group session.\n\n` +
                `Before attending, please ensure you have read and understood our **Server Information**.\n\n` +
                `For this session to officially begin, we must get **__${requiredReactions} reactions__**.\n\n` +
                `**Before Attending:**\n` +
                `<:hu:1420894625840889967> Ensure you are not using banned vehicles unless permitted.\n` +
                `<:hu:1420894625840889967> Verify your Roblox account to prevent random checkpoint kicks.\n` +
                `<:hu:1420894625840889967> Ensure all vehicles are registered here: <#1416869931701502011> with the \`/register\` command.`
            )
            .setImage("https://cdn.discordapp.com/attachments/1407237867075403776/1441876969951072337/Session_Startup_1.png")
            .setColor("Red");

        const msg = await interaction.channel.send({ content: pingRole, embeds: [startupEmbed] });
        await msg.react("👍");

        
        let msgData = {};
        if (fs.existsSync(startupFile)) msgData = JSON.parse(fs.readFileSync(startupFile, "utf-8"));
        msgData[interaction.channel.id] = msg.id;
        fs.writeFileSync(startupFile, JSON.stringify(msgData, null, 2));

        const filter = (reaction, user) =>
            reaction.emoji.name === "👍" && !user.bot;

        const collector = msg.createReactionCollector({ filter, dispose: true });

        collector.on("collect", async () => {
            const count = msg.reactions.cache.get("👍")?.count || 0;
            if (count >= requiredReactions + 1) collector.stop("reached");
        });

        collector.on("end", async (_, reason) => {
            if (reason !== "reached") return;

            const prepEmbed = new EmbedBuilder()
                .setTitle("Kofu's Greenville Group | Session Preparation")
                .setDescription(
                    `<:hi:1420907999379066880> The session hosted by ${host} is now **undergoing preparation**.\n\n` +
                    `<:hu:1420894625840889967> Early Access Members may now prepare to join.\n` +
                    `<:hu:1420894625840889967> Please allow **3–8 minutes** for release.`
                )
                .setColor("Red");

            await msg.reply({ content: pingRole, embeds: [prepEmbed] });
        });
    }
};
