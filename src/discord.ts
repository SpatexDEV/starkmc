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
/*                               BOT BAŞLATICI                                */
/* -------------------------------------------------------------------------- */
export function initDiscord() {
  client.once("ready", async () => {
    console.log(`Discord bot logged in as ${client.user?.tag}`);

    /* ----------------------------- Durum Mesajı ---------------------------- */
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

    /* -------------------- /onlineplayers Slash Komutu Kayıt ------------------- */
    try {
      const guild = client.guilds.cache.get(CONFIG.discord.guildId);
      if (!guild) throw new Error("Guild not found ‑ guildId yanlış mı?");
      // Eğer komut zaten varsa tekrar eklemez
      if (!guild.commands.cache.find((c) => c.name === "onlineplayers")) {
        await guild.commands.create({
          name: "onlineplayers",
          description: "List current online players on StarkMC",
          type: ApplicationCommandType.ChatInput,
        });
        console.log("Slash command /onlineplayers registered (guild scoped).");
      }
    } catch (err) {
      console.error("Slash command register error:", err);
    }
  });

  /* --------------------- Slash Komut Etkileşimi Dinleyicisi -------------------- */
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "onlineplayers") return;

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

    await interaction.reply({ embeds: [embed], ephemeral: false }).catch(console.error);
  });

  client.login(process.env.DISCORD_TOKEN);
}

/* -------------------------------------------------------------------------- */
/*                         LOG MESAJI YARDIMCI FONKSİYONU                      */
/* -------------------------------------------------------------------------- */
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
