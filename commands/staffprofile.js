const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");


const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const statsFile = path.join(dataDir, "session_stats.json");
const entriesFile = path.join(dataDir, "session_entries.json");
const strikesFile = path.join(dataDir, "staff_strikes.json");

const STAFF_REQUIRED_ROLE = "1416869930199945381";
const IGNORED_ROLE_IDS = new Set([
    "1416869929793355891",
    "1451581862907478087",
    "1451581719164489870",
    "1416869929793355893",
    "1416869930187489356",
    "1416869930199945381"
]);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("staffprofile")
        .setDescription("Show a staff member's profile and activity.")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("User to view (defaults to you)")
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser("user") || interaction.user;
        const guild = interaction.guild;
        const member = await guild.members.fetch(targetUser.id).catch(() => null);

        
        const isStaff = member?.roles.cache.has(STAFF_REQUIRED_ROLE);

        
        let highestRoleName = null;
        if (member) {
            const roles = member.roles.cache
                .filter(r => r.id !== guild.id && !IGNORED_ROLE_IDS.has(r.id));
            const sorted = roles.sort((a, b) => b.position - a.position);
            const top = sorted.first();
            if (top) highestRoleName = top.name;
        }

        
        let stats = {};
        if (fs.existsSync(statsFile)) stats = JSON.parse(fs.readFileSync(statsFile, "utf8"));
        const userStats = stats[targetUser.id] || { host: 0, cohost: 0 };

        

        const profileEmbed = new EmbedBuilder()
            .setTitle("Kofu's Roleplay Group | Staff Profile")
            .setColor("Red")
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "User", value: `${targetUser}`, inline: true },
                { name: "Staff Rank", value: isStaff ? (highestRoleName || "Staff") : "This User isn't staff", inline: false },
                { name: "Sessions Hosted", value: `${userStats.host} (host) • ${userStats.cohost} (co-host)`, inline: true }
            )
            .setTimestamp();

        const sessionsButton = new ButtonBuilder()
            .setCustomId(`staffprofile_sessions_${targetUser.id}`)
            .setLabel("Sessions")
            .setStyle(ButtonStyle.Danger);

        const punishButton = new ButtonBuilder()
            .setCustomId(`staffprofile_punishments_${targetUser.id}`)
            .setLabel("Punishments")
            .setStyle(ButtonStyle.Secondary);

        const absencesButton = new ButtonBuilder()
            .setCustomId(`staffprofile_absences_${targetUser.id}`)
            .setLabel("Absences")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(sessionsButton, punishButton, absencesButton);

        const reply = await interaction.reply({ embeds: [profileEmbed], components: [row], fetchReply: true });

        
        const collector = reply.createMessageComponentCollector({ time: 60_000 });

        collector.on("collect", async i => {
            if (!i.isButton()) return;
            const [_, action, userId] = i.customId.split("_");

            if (userId !== targetUser.id) {
                return i.reply({ content: "This button is not for that user.", flags: 64 });
            }

            if (action === "sessions") {
                await i.deferReply({ flags: 64 });

                
                try {
                    console.log(`[staffprofile] loading entriesFile=${entriesFile}`);
                    if (fs.existsSync(entriesFile)) {
                        let allEntries = [];
                        try {
                            allEntries = JSON.parse(fs.readFileSync(entriesFile, 'utf8')) || [];
                        } catch (e) { allEntries = []; }
                        if (!Array.isArray(allEntries)) allEntries = [];
                        const userEntries = allEntries.filter(e => e.userId === targetUser.id);
                        if (userEntries.length > 0) {
                            const embeds = userEntries.slice(0, 10).map(en => {
                                return new EmbedBuilder()
                                    .setTitle(`Session — ${en.type === 'host' ? 'Host' : 'Co-Host'}`)
                                    .setColor('Red')
                                    .setDescription(`**Date:** ${en.date}\n**Duration:** ${en.duration}\n**Recorded By:** ${en.recordedBy}`)
                                    .setTimestamp(new Date(en.recordedAt));
                            });
                            await i.editReply({ embeds });
                            if (userEntries.length > embeds.length) {
                                await i.followUp({ content: `Showing ${embeds.length}/${userEntries.length} entries.`, flags: 64 }).catch(() => {});
                            }
                            return;
                        }
                    }
                } catch (err) {
                    
                }

                
                const statsChannel = guild.channels.cache.get("1416869933207519304");
                if (!statsChannel) return i.editReply({ content: "Session log channel not found." });
                const messages = await statsChannel.messages.fetch({ limit: 200 }).catch(() => null);
                if (!messages) return i.editReply({ content: "Failed to fetch session logs." });

                const matches = [];
                messages.forEach(msg => {
                    try {
                        const content = msg.content || "";
                        const mentionForms = [`<@${targetUser.id}>`, `<@!${targetUser.id}>`, `${targetUser.id}`];
                        const usernameForms = [`${targetUser.username}`, `${targetUser.tag}`];

                        const anyMention = mentionForms.some(m => content.includes(m));
                        const anyName = usernameForms.some(n => content.includes(n));
                        if (anyMention || anyName) {
                            const e = msg.embeds[0];
                            const out = new EmbedBuilder()
                                .setTitle(e?.title || "Session Entry")
                                .setDescription(e?.description || content || "(no description)")
                                .setColor("Red")
                                .setTimestamp(e?.timestamp ? new Date(e.timestamp) : undefined);
                            matches.push(out);
                            return;
                        }

                        if (!msg.embeds || msg.embeds.length === 0) return;
                        for (const e of msg.embeds) {
                            let text = "";
                            if (e.title) text += e.title + "\n";
                            if (e.description) text += e.description + "\n";
                            if (e.author?.name) text += e.author.name + "\n";
                            if (e.footer?.text) text += e.footer.text + "\n";
                            if (e.fields && e.fields.length) {
                                for (const f of e.fields) text += (f.name || "") + " " + (f.value || "") + "\n";
                            }

                            const found = mentionForms.some(m => text.includes(m)) || usernameForms.some(n => text.includes(n)) || text.includes(targetUser.id);
                            if (found) {
                                const out = new EmbedBuilder()
                                    .setTitle(e.title || "Session Entry")
                                    .setDescription(e.description || "(no description)")
                                    .setColor("Red")
                                    .setTimestamp(e.timestamp ? new Date(e.timestamp) : undefined);
                                matches.push(out);
                            }
                        }
                    } catch (err) {
                        
                    }
                });

                if (matches.length === 0) {
                    return i.editReply({ content: "No session log entries found for this user." });
                }

                const toSend = matches.slice(0, 10);
                try {
                    await i.editReply({ embeds: toSend });
                } catch (err) {
                    await i.followUp({ embeds: toSend });
                }

                if (matches.length > toSend.length) {
                    await i.followUp({ content: `Showing ${toSend.length}/${matches.length} entries.`, flags: 64 }).catch(() => {});
                }
            } else if (action === "punishments") {
                await i.deferReply({ flags: 64 });
                try {
                    console.log(`[staffprofile] punishments pressed for ${targetUser.id} (strikesFile=${strikesFile})`);
                    if (!fs.existsSync(strikesFile)) {
                        console.log('[staffprofile] strikesFile does not exist');
                        return i.editReply({ content: "No staff strikes recorded for this user." });
                    }
                    const raw = fs.readFileSync(strikesFile, 'utf8');
                    let all = [];
                    try { all = JSON.parse(raw) || []; } catch (e) { console.error('[staffprofile] failed parsing strikesFile', e); }
                    console.log(`[staffprofile] loaded ${all.length} strikes from file`);
                    const userStrikes = all.filter(s => s.userId === targetUser.id);
                    console.log(`[staffprofile] found ${userStrikes.length} strikes for ${targetUser.id}`);
                    if (!userStrikes || userStrikes.length === 0) return i.editReply({ content: "No staff strikes recorded for this user." });

                    const embeds = userStrikes.slice(0, 10).map(s => {
                        return new EmbedBuilder()
                            .setTitle("Kofu's Roleplay Group | Staff Strike")
                            .setColor('Red')
                            .setDescription(`<:hi:1420894625840889967> **This user has received a staff strike.**`)
                            .addFields(
                                { name: 'Reason', value: s.reason || 'No reason provided', inline: false },
                                { name: 'Evidence', value: s.evidence || 'None', inline: false },
                                { name: 'Issued By', value: s.issuerTag || s.issuerId || 'Unknown', inline: true },
                                { name: 'Date', value: new Date(s.date).toUTCString(), inline: true }
                            )
                            .setTimestamp(new Date(s.date));
                    });

                    await i.editReply({ embeds: embeds });
                    if (userStrikes.length > embeds.length) {
                        await i.followUp({ content: `Showing ${embeds.length}/${userStrikes.length} strikes.`, flags: 64 }).catch(() => {});
                    }
                } catch (err) {
                    console.error('[staffprofile] error while fetching strikes', err);
                    await i.editReply({ content: "Failed to fetch strikes." });
                }
            } else if (action === "absences") {
                await i.reply({ content: "Absences data not available.", flags: 64 });
            } else {
                await i.reply({ content: "Unknown action.", flags: 64 });
            }
        });

        collector.on("end", () => {
            
            const disabledRow = new ActionRowBuilder().addComponents(
                sessionsButton.setDisabled(true),
                punishButton.setDisabled(true),
                absencesButton.setDisabled(true)
            );
            reply.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};
