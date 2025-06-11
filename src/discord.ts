import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from "discord.js";
import CONFIG from "../config.json" assert { type: "json" };
import dotenv from 'dotenv';
dotenv.config();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let logChannel: TextChannel | null = null;



export function initDiscord() {
  client.once("ready", () => {
    console.log(`Discord bot logged in as ${client.user?.tag}`);

    client.user?.setPresence({
      status: 'online',
      activities: [
        {
          name: 'StarkMC 👀',
          type: 3,
        },
      ],
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
