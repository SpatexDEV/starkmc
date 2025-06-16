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

/* -------------------------------------------------------------------------- */
/*                              Discord Başlatıcı                             */
/* -------------------------------------------------------------------------- */
export function initDiscord() {
  client.once("ready", async () => {
    console.log(`Discord bot logged in as ${client.user?.tag}`);

    client.user?.setPresence({
      status: "online",
      activities: [{ name: "StarkMC 👀", type: 3 }],
    });

    /* --------------------------- Log Kanalı Ayarı -------------------------- */
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

    /* -------------------- Slash Komutları Temizle & Ekle ------------------- */
    try {
      const guild = client.guilds.cache.get(CONFIG.discord.guildId);
      if (!guild) throw new Error("Guild not found ‑ check CONFIG.discord.guildId");

      // Tüm mevcut guild komutlarını sil -> "bozuk" komutlar kalmasın
      await guild.commands.set([]);

      // Ardından ihtiyaç duyulan komutları tekrar ekle
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

  /* --------------------- Slash Komut Etkileşimi Dinleyicisi -------------------- */
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "onlineplayers") return;

    const players = getOnlinePlayers();

    // Boş veya sadece boş isimlerden oluşan liste için güvenlik
    const validPlayers = players.filter(p => p.trim().length > 0);
    const description =
      validPlayers.length > 0
        ? validPlayers.join(", ")
        : "Şu anda sunucuda kimse çevrim‑içi değil.";

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("🌐 StarkMC’de Çevrim‑İçi Oyuncular")
      .setDescription(description)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false }).catch(console.error);
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
