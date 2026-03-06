const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("release")
        .setDescription("Send a session release announcement.")
        .addIntegerOption(option =>
            option.setName("frp_speed")
                .setDescription("FRP Speed")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("leo_status")
                .setDescription("LEO Status")
                .addChoices(
                    { name: "Online", value: "Online" },
                    { name: "Offline", value: "Offline" }
                )
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
        const roles = [
            "1416869930237825076",
            "1416869930199945381",
            "1416869930199945386",
            "1416869930212790395",
            "1416869930229301316"
        ];

        const ok = interaction.member.roles.cache.some(r => roles.includes(r.id));
        if (!ok) {
            return interaction.reply({
                content: "❌ You do not have permission to run this command.",
                flags: 64
            });
        }

        const frp = interaction.options.getInteger("frp_speed");
        const leo = interaction.options.getString("leo_status");
        const peace = interaction.options.getString("peacetime_status");
        const link = interaction.options.getString("link");

        await interaction.reply({ content: "✅ Session Release message sent!", flags: 64 });

        const embed = new EmbedBuilder()
            .setTitle("Kofu's Roleplay Group | Session Release")
            .setDescription(
                `<:hi:1442179421506375742> ${interaction.user}, The session is now released!\n\n` +
                `> **Important Material**\n` +
                `<:hi:1420894625840889967> Before joining, please ensure you thoroughly review and follow all provided guidelines to ensure a smooth and enjoyable experience for all members.\n` +
                `<:hi:1420894625840889967> If you encounter any technical issues during the session, please report them **IMMEDIATELY** to Server Staff for support in <#1416869932074799199>.\n\n` +
                `> **Experience Information**\n` +
                `<:hi:1442179421506375742> Peacetime Status: **${peace}**\n` +
                `<:hi:1442179421506375742> FRP Speeds: **${frp}**\n` +
                `<:hi:1442179421506375742> LEO Status: **${leo}**`
            )
            .setImage("https://cdn.discordapp.com/attachments/1407237867075403776/1442237009883303997/Session_Startup_1_1.png?ex=6924b362&is=692361e2&hm=85f08421442f1d0ba38ed0ebb9d429d5bce40633870b2f393c60e3aa85357689&")
            .setColor("Red");

        const btn = new ButtonBuilder()
            .setCustomId("session_link_button")
            .setLabel("Session Link")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("<:hi:1420894649274466450>");

        const row = new ActionRowBuilder().addComponents(btn);

        const msg = await interaction.channel.send({
            content: "<@&1416869930237825076> <@&1416869930199945381> <@&1416869930199945386> <@&1416869930212790395> <@&1416869930229301316>",
            embeds: [embed],
            components: [row]
        });

        const collector = msg.createMessageComponentCollector();

        collector.on("collect", async i => {
            if (!roles.some(r => i.member.roles.cache.has(r))) {
                return i.reply({ content: "❌ You do not have permission to use this button.", flags: 64 });
            }

            if (i.customId === "session_link_button") {
                return i.reply({
                    content: `**Session Link:** ${link}`,
                    flags: 64
                });
            }
        });
    }
};
