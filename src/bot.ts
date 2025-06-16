import Mineflayer from "mineflayer";
import { sleep, getRandom } from "./utils.ts";
import CONFIG from "../config.json" assert { type: "json" };
import { sendDiscordLog } from "./discord.ts";
import { EmbedBuilder } from "discord.js";

let loop: NodeJS.Timeout;
let bot: Mineflayer.Bot;

/* -------------------------------------------------------------------------- */
/*                               Bağlantı Yönetimi                            */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/*                               AFK Hareket Döngüsü                          */
/* -------------------------------------------------------------------------- */
const startAfkMovement = (): void => {
  const changePos = async (): Promise<void> => {
    const lastAction = getRandom(CONFIG.action.commands) as Mineflayer.ControlState;
    const halfChance = Math.random() < 0.5; // Rastgele sprint

    console.debug(`${lastAction}${halfChance ? " with sprinting" : ""}`);

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

  // Daha “insansı” aralıklarla döngü
  const loopAction = async (): Promise<void> => {
    await changeView();
    await changePos();
    setTimeout(
      loopAction,
      CONFIG.action.holdDuration + Math.random() * 2_000,
    ); // +0‑2 sn oynama
  };
  loopAction();
};

/* -------------------------------------------------------------------------- */
/*                                  Bot Kur                                   */
/* -------------------------------------------------------------------------- */
const createBot = (): void => {
  bot = Mineflayer.createBot({
    host: CONFIG.client.host,
    port: +CONFIG.client.port,
    username: CONFIG.client.username,
  } as const);

  /* ------------------------- Temel Olay Dinleyicileri ------------------------ */
  bot.once("error", (error) => {
    console.error(`StarkMC Admin got an error: ${error}`);
    sendDiscordLog(`❌ StarkMC Admin error: ${error.message || error}`);
  });

  bot.once("kicked", (rawResponse) => {
    console.error(`\nStarkMC Admin is disconnected: ${rawResponse}`);
    sendDiscordLog(`⚠️ StarkMC Admin kicked from server: ${rawResponse.toString()}`);
  });

  bot.once("end", () => {
    sendDiscordLog("❌ StarkMC Admin disconnected, reconnecting...");
    reconnect();
  });

  /* ----------------------------- Sunucuya Giriş ----------------------------- */
  bot.once("spawn", async () => {
    sendDiscordLog(`✅ StarkMC Admin joined: **${bot.username}**`);

    const password = CONFIG.client.password;
    bot.chat(`/register ${password} ${password}`);
    await sleep(3_000);
    bot.chat(`/login ${password}`);

    startAfkMovement();

    bot.on("playerJoined", (player) => {
      sendDiscordLog(`🟢 Player joined StarkMC: **${player.username}**`);
    });

    bot.on("playerLeft", (player) => {
      sendDiscordLog(`🔴 Player left StarkMC: **${player.username}**`);
    });
  });

  bot.once("login", () => {
    console.log(`StarkMC Manager logged in as ${bot.username}`);
    sendDiscordLog(`🟢 StarkMC Manager successfully logged in: **${bot.username}**`);
  });
};

/* -------------------------------------------------------------------------- */
/*                       ÇEVRİM‑İÇİ OYUNCU LİSTESİ API                         */
/* -------------------------------------------------------------------------- */
export const getOnlinePlayers = (): string[] => {
  if (!bot || !bot.players) return [];
  return Object.values(bot.players)
    .filter((p) => p.username && p.username !== bot.username)
    .map((p) => p.username as string);
};

/* -------------------------------------------------------------------------- */
/*                              Dışa Aktarılan Başlatıcı                      */
/* -------------------------------------------------------------------------- */
export default (): void => {
  createBot();
};
