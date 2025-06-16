import Mineflayer from "mineflayer";
import { sleep, getRandom } from "./utils.ts";
import CONFIG from "../config.json" assert { type: "json" };
import { sendDiscordLog } from "./discord.ts";

let loop: NodeJS.Timeout;
let bot: Mineflayer.Bot;

// Son alınan oyuncu listesi (son /list komutundan)
let lastOnlinePlayers: string[] = [];

// Bot oluşturma vs. (senin mevcut kodun)
const createBot = (): void => {
  bot = Mineflayer.createBot({
    host: CONFIG.client.host,
    port: +CONFIG.client.port,
    username: CONFIG.client.username,
  });

  bot.once("error", (error) => {
    console.error(`StarkMC Admin got an error: ${error}`);
    sendDiscordLog(`❌ StarkMC Admin error: ${error.message || error}`);
  });

  bot.once("kicked", (rawResponse) => {
    console.error(`StarkMC Admin is disconnected: ${rawResponse}`);
    sendDiscordLog(`⚠️ StarkMC Admin kicked from server: ${rawResponse.toString()}`);
  });

  bot.once("end", () => {
    sendDiscordLog("❌ StarkMC Admin disconnected, reconnecting...");
    reconnect();
  });

  bot.once("spawn", async () => {
    sendDiscordLog(`✅ StarkMC Admin joined: **${bot.username}**`);

    const password = CONFIG.client.password;
    bot.chat(`/register ${password} ${password}`);
    await sleep(3000);
    bot.chat(`/login ${password}`);

    startAfkMovement();

    bot.on("playerJoined", (player) => {
      sendDiscordLog(`🟢 Player joined StarkMC: **${player.username}**`);
    });

    bot.on("playerLeft", (player) => {
      sendDiscordLog(`🔴 Player left StarkMC: **${player.username}**`);
    });

    // Mesajları dinle, oyuncu listesi mesajı geldiğinde işle
    bot.on("message", (message) => {
      const text = message.toString();

      // Örnek mesaj formatı (senin sunucuna göre değişebilir!):
      // "Oyuncular (3): player1, player2, player3"
      // veya "There are 3 of a max 20 players online: player1, player2, player3"

      // Burada kendi sunucuna uygun mesaj kontrolü yap:
      if (text.startsWith("Oyuncular") || text.includes("players online")) {
        const parts = text.split(":");
        if (parts.length < 2) return;

        const playerListString = parts[1].trim();

        // Boş değilse, oyuncuları ayır
        if (playerListString.length > 0) {
          lastOnlinePlayers = playerListString.split(",").map((p) => p.trim());
        } else {
          lastOnlinePlayers = [];
        }

        // Discord'a direkt mesaj atabilirsin ya da bekleyebilirsin
        sendDiscordLog(`🌐 Current Online Players: ${lastOnlinePlayers.join(", ") || "Yok"}`);
      }
    });
  });

  bot.once("login", () => {
    console.log(`StarkMC Manager logged in as ${bot.username}`);
    sendDiscordLog(`🟢 StarkMC Manager successfully logged in: **${bot.username}**`);
  });
};

// Reconnect fonksiyonu senin kodda var, onu kullan
const disconnect = (): void => {
  clearInterval(loop);
  bot?.quit?.();
  bot?.end?.();
};

const reconnect = async (): Promise<void> => {
  console.log(`Trying to reconnect in ${CONFIG.action.retryDelay / 1000} seconds...\n`);
  disconnect();
  await sleep(CONFIG.action.retryDelay);
  createBot();
};

// AFK hareket kodun senin kodunla aynı
const startAfkMovement = (): void => {
  // (Senin mevcut kodu buraya ekle)
  const changePos = async (): Promise<void> => {
    const lastAction = getRandom(CONFIG.action.commands) as Mineflayer.ControlState;
    const halfChance = Math.random() < 0.5;

    bot.setControlState("sprint", halfChance);
    bot.setControlState(lastAction, true);
    await sleep(CONFIG.action.holdDuration);
    bot.clearControlStates();
  };

  const changeView = async (): Promise<void> => {
    const yaw = Math.random() * Math.PI - 0.5 * Math.PI;
    const pitch = Math.random() * Math.PI - 0.5 * Math.PI;
    await bot.look(yaw, pitch, false);
  };

  const loopAction = async (): Promise<void> => {
    await changeView();
    await changePos();
    setTimeout(loopAction, CONFIG.action.holdDuration + Math.random() * 2000);
  };
  loopAction();
};

// Bu fonksiyon Discord’a oyuncu listesi istendiğinde çağrılacak
export const getOnlinePlayers = (): string[] => {
  return lastOnlinePlayers;
};

export default (): void => {
  createBot();
};
