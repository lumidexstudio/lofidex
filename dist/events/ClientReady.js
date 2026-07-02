"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const config_1 = __importDefault(require("../config"));
const restoreSessions_1 = __importDefault(require("../lib/voice/restoreSessions"));
const rest = new discord_js_1.REST({ version: "10" }).setToken(config_1.default.token);
module.exports = {
    name: discord_js_1.Events.ClientReady,
    once: true,
    async execute(client) {
        const slash = { data: [] };
        client.slash.forEach((value) => {
            slash.data.push(value.data);
        });
        console.log(`Ready! Logged in as ${client.user.tag}`);
        try {
            console.log(`Started refreshing ${slash.data.length} application (/) commands.`);
            const data = (await rest.put(discord_js_1.Routes.applicationCommands(client.config.clientID), { body: slash.data }));
            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        }
        catch (error) {
            console.error(error);
        }
        try {
            await (0, restoreSessions_1.default)(client);
        }
        catch (error) {
            console.error("Failed to restore 24/7 sessions:", error);
        }
    },
};
//# sourceMappingURL=ClientReady.js.map