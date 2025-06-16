import {
  Client,
  GatewayIntentBits,
  TextChannel,
  EmbedBuilder,
  ApplicationCommandType,
} from "discord.js";
import CONFIG from "../config.json" assert { type: "json" };
import { getOnlinePlayers } from "./bot.ts";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let logChannel: TextChannel | null = null;

export function initDiscord() {
  client.once("ready", async () => {
    console.log(`Discord bot logged in as ${client.user?.tag}`);

    client.user?.setPresence({
      status: "online",
      activities: [{ name: "StarkMC 👀", type: 3 }],
    });

    const channel = client.channels.cache.get(CONFIG.discord.discordLogChannelId);
    if (channel && channel.isTextBased()) {
      logChannel = channel as TextChannel;

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("🟢 Bot Active")
        .setDescription("The bot is active and the log channel is ready!")
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    } else {
      console.error("Log channel not found!");
    }

    // Slash komutları sıfırla ve yeniden oluştur
    try {
      const guild = client.guilds.cache.get(CONFIG.discord.guildId);
      if (!guild) throw new Error("Guild not found ‑ check CONFIG.discord.guildId");

      await guild.commands.set([]);

      await guild.commands.create({
        name: "onlineplayers",
        description: "List current online players on StarkMC",
        type: ApplicationCommandType.ChatInput,
      });

      console.log("Guild commands reset and /onlineplayers registered.");
    } catch (err) {
      console.error("Slash command register error:", err);
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "onlineplayers") return;

    // Oyuncu listesini bot’tan al
    const players = getOnlinePlayers();

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("🌐 Online Players in StarkMC")
      .setDescription(players.length ? players.join(", ") : "")
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false }).catch(console.error);
  });

  client.login(process.env.DISCORD_TOKEN);
}

export function sendDiscordLog(message: string) {
  if (logChannel) {
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setDescription(message)
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(console.error);
  } else {
    console.warn("The Discord log channel has not been set up yet.");
  }
}

export default client;
