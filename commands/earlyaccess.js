const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("earlyaccess")
        .setDescription("Send an Early Access session announcement.")
        .addStringOption(option =>
            option.setName("link")
                .setDescription("The Early Access session link.")
                .setRequired(true)
        ),

    async execute(interaction) {
        const allowedRoles = [
            "1416869930237825076",
            "1416869930199945381",
            "1416869930199945386",
            "1416869930212790395"
        ];

        const hasRole = interaction.member.roles.cache.some(r => allowedRoles.includes(r.id));
        if (!hasRole) {
            return interaction.reply({
                content: "❌ You do not have permission to run this command.",
                flags: 64
            });
        }

        const link = interaction.options.getString("link");
        const pingString =
            "<@&1416869930237825076> <@&1416869930199945381> <@&1416869930199945386> <@&1416869930212790395>";

        await interaction.reply({ content: "✅ Early Access message sent!", flags: 64 });

        const embed = new EmbedBuilder()
            .setTitle("Kofu's Roleplay Group | Early Access")
            .setDescription(
                `<:hi:1442179421506375742> ${interaction.user}, Early access to the experience is now available. Upon entering the session, please proceed to the designated area and **park your vehicle.**\n\n` +
                `<:hu:1420894625840889967> We kindly request that you **wait patiently** in this holding area, the start of the experience will commence soon after the last of preparations are complete. Your cooperation in following this entry protocol is essential and greatly appreciated.`
            )
            .setColor("Red");

        const button = new ButtonBuilder()
            .setCustomId("ea_link_button")
            .setLabel("Experience Link")
            .setStyle(ButtonStyle.Danger) 
            .setEmoji("<:hi:1420894649274466450>");

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.channel.send({
            content: pingString,
            embeds: [embed],
            components: [row]
        });

        const collector = interaction.channel.createMessageComponentCollector();

        collector.on("collect", async i => {
            const memberHasRole = i.member.roles.cache.some(r => allowedRoles.includes(r.id));

            if (!memberHasRole) {
                return i.reply({
                    content: "You do not have any required roles to use this button. You can obtain Early Access roles by buying a shirt, boosting, becoming staff, or joining the public services team.",
                    flags: 64
                });
            }

            if (i.customId === "ea_link_button") {
                const replyEmbed = new EmbedBuilder()
                    .setTitle("Session Link")
                    .setDescription(`${link}`)
                    .setColor("Red");

                await i.reply({
                    embeds: [replyEmbed],
                    flags: 64
                });
            }
        });
    }
};
