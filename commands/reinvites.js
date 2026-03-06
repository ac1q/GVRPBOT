const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const dataFile = path.join(dataDir, "reinvites_messages.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reinvites")
        .setDescription("Start a Re-Invites session.")
        .addIntegerOption(option =>
            option.setName("reactions")
                .setDescription("Reactions needed to release reinvites.")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("frp_speed")
                .setDescription("FRP Speed")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("leo_status")
                .setDescription("LEO Status")
                .addChoices({ name: "Online", value: "Online" }, { name: "Offline", value: "Offline" })
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("peacetime_status")
                .setDescription("Peacetime Status")
                .addChoices(
                    { name: "Normal", value: "Normal" },
                    { name: "Off", value: "Off" },
                    { name: "Strict", value: "Strict" }
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("link")
                .setDescription("Session link")
                .setRequired(true)
        ),

    async execute(interaction) {
        const allowedRole = "1416869930229301316";
        const pingRole = `<@&${allowedRole}>`;

        if (!interaction.member.roles.cache.has(allowedRole)) {
            return interaction.reply({ content: "❌ You do not have permission.", flags: 64 });
        }

        const reqReact = interaction.options.getInteger("reactions");
        const host = interaction.user;
        const frp = interaction.options.getInteger("frp_speed");
        const leo = interaction.options.getString("leo_status");
        const peacetime = interaction.options.getString("peacetime_status");
        const link = interaction.options.getString("link");

        await interaction.reply({ content: "✅ Reinvites message created!", flags: 64 });

        const startupEmbed = new EmbedBuilder()
            .setTitle(`Kofu's Roleplay Group | Re-Invites`)
            .setColor("Red")
            .setDescription(
                `${host} wants to start **Re-Invites**. We need **${reqReact} reactions** to begin.\n\n` +
                `> Mandatory Advisory:\n` +
                `> If you were previously kicked from the experience, do not attempt to react/rejoin unless you have received explicit instruction from ${host} or another staff member co-hosting the session.\n\n` +
                `React below if you plan on joining!`
            );

        const msg = await interaction.channel.send({ content: pingRole, embeds: [startupEmbed] });
        await msg.react("👍");

        let data = {};
        if (fs.existsSync(dataFile)) data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
        data[interaction.channel.id] = msg.id;
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

        const interval = setInterval(async () => {
            try {
                const reaction = msg.reactions.cache.get("👍");
                if (!reaction) return;

                const users = await reaction.users.fetch();
                const count = users.filter(u => !u.bot).size;

                if (count >= reqReact) {
                    clearInterval(interval);
                    await msg.reactions.removeAll();

                    const finalEmbed = new EmbedBuilder()
                        .setTitle("Kofu's Roleplay Group | Session Reinvites")
                        .setColor("Red")
                        .setImage("https://cdn.discordapp.com/attachments/1407237867075403776/1442239120163344547/Session_Startup_1_2.png")
                        .setDescription(
                            `<:hi:1442179421506375742> ${host} has reached the required reactions.\n\n` +
                            `**Please Note:** Before accepting the link and joining, ensure that you have reviewed and will follow the information below.\n\n` +
                            `> Session Information\n` +
                            `<:hi:1442179421506375742> Peacetime Status: **${peacetime}**\n` +
                            `<:hi:1442179421506375742> FRP Speed: **${frp}**\n` +
                            `<:hi:1442179421506375742> LEO Status: **${leo}**\n\n` +
                            `> Mandatory Advisory:\n` +
                            `> If you were previously kicked from the experience, do not attempt to rejoin unless you have received explicit instruction from ${host} or another staff member co-hosting the session.`
                        );

                    const button = new ButtonBuilder()
                        .setCustomId("reinvites_link_button")
                        .setLabel("Re-Invites Link")
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji("<:hi:1420894649274466450>");

                    const row = new ActionRowBuilder().addComponents(button);

                    await msg.edit({ content: pingRole, embeds: [finalEmbed], components: [row] });

                    const collector = msg.createMessageComponentCollector({
                        filter: i => i.member.roles.cache.has(allowedRole)
                    });

                    collector.on("collect", async i => {
                        if (i.customId === "reinvites_link_button") {
                            await i.reply({ content: `**Session Link:** ${link}`, flags: 64 });
                        }
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }, 1200);
    }
};
