import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from "discord.js";
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

/* -------------------------------------------------------------------------- */
/*                              Discord Başlatıcı                             */
/* -------------------------------------------------------------------------- */
export function initDiscord() {
  client.once("ready", () => {
    console.log(`Discord bot logged in as ${client.user?.tag}`);

    client.user?.setPresence({
      status: "online",
      activities: [
        {
          name: "StarkMC 👀",
          type: 3, // Playing
        },
      ],
    });

    const channel = client.channels.cache.get(
      CONFIG.discord.discordLogChannelId,
    );
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
  });

  /* ------------------------- /onlineplayers komutu ------------------------ */
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return; // Diğer botları yoksay
    if (message.content.trim().toLowerCase() !== "/onlineplayers") return;

    const players = getOnlinePlayers();

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("🌐 StarkMC’de Çevrim‑İçi Oyuncular")
      .setDescription(
        players.length
          ? players.join(", ")
          : "Şu anda sunucuda kimse çevrim‑içi değil.",
      )
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  });

  client.login(process.env.DISCORD_TOKEN);
}

/* --------------------------- Log Mesajı Gönderici -------------------------- */
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
