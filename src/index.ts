import dotenv from 'dotenv';
dotenv.config();
import initBot from "./bot.ts";
import initWeb from "./web.ts";
import { initDiscord } from "./discord.ts";

initBot();
initWeb();
initDiscord();
