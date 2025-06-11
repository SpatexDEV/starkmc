import Mineflayer from 'mineflayer';
import { sleep, getRandom } from "./utils.ts";
import CONFIG from "../config.json" assert {type: 'json'};
import { sendDiscordLog } from "./discord.ts";
import { EmbedBuilder } from "discord.js";
let loop: NodeJS.Timeout;
let bot: Mineflayer.Bot;

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

const startAfkMovement = (): void => {
	const changePos = async (): Promise<void> => {
		const lastAction = getRandom(CONFIG.action.commands) as Mineflayer.ControlState;
		const halfChance: boolean = Math.random() < 0.5;

		console.debug(`${lastAction}${halfChance ? " with sprinting" : ''}`);

		bot.setControlState('sprint', halfChance);
		bot.setControlState(lastAction, true);

		await sleep(CONFIG.action.holdDuration);
		bot.clearControlStates();
	};
	const changeView = async (): Promise<void> => {
		const yaw = (Math.random() * Math.PI) - (0.5 * Math.PI);
		const pitch = (Math.random() * Math.PI) - (0.5 * Math.PI);

		await bot.look(yaw, pitch, false);
	};

	loop = setInterval(() => {
		changeView();
		changePos();
	}, CONFIG.action.holdDuration);
};

const createBot = (): void => {
	bot = Mineflayer.createBot({
		host: CONFIG.client.host,
		port: +CONFIG.client.port,
		username: CONFIG.client.username
	} as const);

	bot.once('error', error => {
		console.error(`StarkMC Admin got an error: ${error}`);
		sendDiscordLog(`❌ StarkMC Admin error: ${error.message || error}`);
	});
	bot.once('kicked', rawResponse => {
		console.error(`\n\StarkMC Admin is disconnected: ${rawResponse}`);
		sendDiscordLog(`⚠️ StarkMC Admin kicked from server: ${rawResponse.toString()}`);
	});
	bot.once('end', () => {
		sendDiscordLog(`❌ StarkMC Admin disconnected, reconnecting...`);
		reconnect();
	});


	
	bot.once('spawn', async () => {
		sendDiscordLog(`✅ StarkMC Admin Joined StarkMC Successuflly: **${bot.username}**`);

		const password = CONFIG.client.password;
		bot.chat(`/register ${password} ${password}`);

		await sleep(3000);
		bot.chat(`/login ${password}`);

		startAfkMovement();

		// Oyuncu giriş çıkışlarını takip et
		bot.on("playerJoined", (player) => {
			sendDiscordLog(`🟢 Player logged to starkmc: **${player.username}**`);
		});
		bot.on("playerLeft", (player) => {
			sendDiscordLog(`🔴 Player left from starkmc **${player.username}**`);
		});
	});

	bot.once('login', () => {
		console.log(`StarkMC Manger logged in as ${bot.username}`);
		sendDiscordLog(`🟢 StarkMC Manger successfully logged in: **${bot.username}**`);
	});
};

export default (): void => {
	createBot();
};
