require("dotenv").config();
 
process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('beforeExit', (code) => {
    console.log('Process beforeExit with code', code);
});
 
const _origConsoleWarn = console.warn.bind(console);
console.warn = (...args) => {
    try {
        const msg = args.join(' ');
        if (String(msg).includes('ready event has been renamed')) return;
    } catch (e) {}
    _origConsoleWarn(...args);
};

process.on('warning', (warning) => {
    try {
        if (warning && warning.name === 'DeprecationWarning' && String(warning.message).includes('ready event has been renamed')) {
            return; // ignore this specific deprecation
        }
    } catch (e) {}
    console.warn(warning.stack || warning);
});

 
async function bootloader() {
    try {
        console.clear();

        const banner = [
            '██████╗ ██╗   ██╗ ██████╗ ██████╗ ',
            '██╔══██╗██║   ██║██╔════╝██╔═══██╗',
            '██████╔╝██║   ██║██║     ██║   ██║',
            '██╔═══╝ ██║   ██║██║     ██║   ██║',
            '██║     ╚██████╔╝╚██████╗╚██████╔╝',
            '╚═╝      ╚═════╝  ╚═════╝ ╚═════╝ '
        ].join('\n');

        const krgMark = `\n\x1b[36mKRG — Kofu's Roleplay Group\x1b[0m\n`;

        

        const steps = [
            'Loading configuration',
            'Initializing Discord client',
            'Registering slash commands',
            'Attaching interaction handlers',
            'Finalizing startup'
        ];

        for (let i = 0; i < steps.length; i++) {
            const stepLabel = `[${i + 1}/${steps.length}] ${steps[i]}`;
            process.stdout.write(`\x1b[2m${stepLabel}...\x1b[0m `);
            await new Promise(res => setTimeout(res, 300));
            console.log('\x1b[32m✔\x1b[0m');
        }

        
    } catch (e) {
        
    }
}
const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection,
    REST,
    Routes,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User
    ]
});

 
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const sessionFile = path.join(dataDir, "session_times.json");
if (!fs.existsSync(sessionFile)) fs.writeFileSync(sessionFile, "{}");

 
client.commands = new Collection();
const commandsToSync = [];

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (!command.data) continue; // skip files without data
    client.commands.set(command.data.name, command);
    commandsToSync.push(command.data.toJSON());
}

 
async function onReady() {
    
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandsToSync });
    } catch (err) {
        console.error("❌ Failed to sync commands:", err);
    }

    
    const statuses = [
        "Kofu's Roleplay Group",
        "Playing Roblox",
        "https://discord.gg/49x8X6umn5",
        "Playing a Kofu's Roleplay Group Session"
    ];
    let i = 0;
    setInterval(() => {
        client.user.setActivity(statuses[i], { type: 3 });
        i = (i + 1) % statuses.length;
    }, 10000);

    
    try {
        const tpPath = path.join(__dirname, 'commands', 'ticketpanel.js');
        if (fs.existsSync(tpPath)) {
            require(tpPath)(client);
        }
    } catch (err) {
        console.error('❌ Error initializing ticketpanel module:', err);
    }
}

client.once('clientReady', onReady);

 
client.on("guildMemberAdd", async member => {
    try {
        const welcomeChannel = member.guild.channels.cache.get("1416869933207519310");
        if (!welcomeChannel) return;

        const serverIcon = member.guild.iconURL({ dynamic: true });
        const embed = new EmbedBuilder()
            .setTitle(`Welcome to ${member.guild.name}, ${member.user.username}!`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `Welcome ${member} to **${member.guild.name}**!\n\n` +
                `• **Verify** in <#1416869933207519312> to access full server features.\n` +
                `• **Server Information & Rules:** <#1416869931395580115>\n` +
                `• **Join your first session in:** <#1416869931395580120> or <#1416869931701502004>\n\n` +
                `**Total Members:** ${member.guild.memberCount}`
            )
            .setColor("Green")
            .setFooter({ text: "Kofu's Roleplay Group", iconURL: serverIcon })
            .setTimestamp();

        await welcomeChannel.send({ content: `${member}`, embeds: [embed] });
    } catch (err) {
        console.error("❌ Error sending welcome message:", err);
    }
});

 
client.on("guildMemberRemove", async member => {
    try {
        const welcomeChannel = member.guild.channels.cache.get("1416869933207519310");
        if (!welcomeChannel) return;

        const serverIcon = member.guild.iconURL({ dynamic: true });
        const embed = new EmbedBuilder()
            .setTitle(`Member Left: ${member.user.username}`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `${member.user.tag} has left **${member.guild.name}**.\n\n` +
                `We now have **${member.guild.memberCount - 1} members** remaining.`
            )
            .setColor("Red")
            .setFooter({ text: "Kofu's Roleplay Group", iconURL: serverIcon })
            .setTimestamp();

        await welcomeChannel.send({ embeds: [embed] });
    } catch (err) {
        console.error("❌ Error sending leave message:", err);
    }
});

 
client.on("interactionCreate", async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction);
        }

        
        if (interaction.isButton() && interaction.customId.startsWith("rate_session_")) {
            const hostId = interaction.customId.split("_")[2];
            const ratingModal = new ModalBuilder()
                .setCustomId(`session_rating_modal_${hostId}_${interaction.user.id}`)
                .setTitle("Rate Session");

            ratingModal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("session_rating_input")
                        .setLabel("Rating (1-5)")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("Enter 1-5")
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("session_feedback_input")
                        .setLabel("Feedback")
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder("How was the session?")
                        .setRequired(true)
                )
            );

            await interaction.showModal(ratingModal);
        }

        
        if (interaction.isModalSubmit() && interaction.customId.startsWith("session_rating_modal_")) {
            const fields = interaction.fields;
            const rating = fields.getTextInputValue("session_rating_input");
            const feedback = fields.getTextInputValue("session_feedback_input");
            const hostId = interaction.customId.split("_")[3];

            const logChannel = client.channels.cache.get("1416869933207519303");
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle("Session Rating")
                    .setColor("Red")
                    .setDescription(
                        `**Host ID:** ${hostId}\n**Rated by:** ${interaction.user}\n**Rating:** ${rating}\n**Feedback:** ${feedback}`
                    );
                logChannel.send({ embeds: [logEmbed] });
            }

            await interaction.reply({ content: "✅ Thank you for your rating!", flags: 64 });
        }
    } catch (error) {
        console.error(error);
            if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: "❌ Error processing interaction.", flags: 64 });
        }
    }
});

 
(async () => {
    await bootloader();
    client.login(process.env.TOKEN);
})();
