import { Client, IntentsBitField, Partials } from "discord.js";
import WOK from "wokcommands";
import path from "path";
import mongoose from "mongoose";
require("dotenv/config");

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.DirectMessages,
    IntentsBitField.Flags.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.login(process.env.TOKEN);

client.on("ready", () => {

  console.log("The bot is ready");

  mongoose.connect(process.env.mongodb || "", {
    keepAlive: true
  })

  new WOK({
    // The client for your bot. This is the only required property
    client,
    // Path to your commands folder
    commandsDir: path.join(__dirname, "/src/commands"),
    // Path to your features folder
    featuresDir: path.join(__dirname, "/src/features"),
    // Configure your event handlers
    events: {
      // Where your events are located. This is required if you
      // provide this events object
      dir: path.join(__dirname, "/src/events"),
      // To learn how to properly configure your events please see
      // https://docs.wornoffkeys.com/events/what-is-a-feature
    },
    mongoUri: process.env.MONGODB || '',
    testServers: ["940446029436821514"],
    botOwners: ["203932549746130944"],
    disabledDefaultCommands: [
    ],
    // Configure the cooldowns for your commands and features
    cooldownConfig: {
      errorMessage: "Please wait {TIME} before doing that again.",
      botOwnersBypass: false,
      // The amount of seconds required for a cooldown to be
      // persistent via MongoDB.
      dbRequired: 300,
    },
  });
});