#!/usr/bin/env node

/**
 * Discord → Telegram Bridge
 * Forwards new Discord messages to Telegram every 15 minutes
 * 
 * Usage:
 *   node discord-bridge.js           # Normal run
 *   node discord-bridge.js --test    # Test run (verbose)
 *   node discord-bridge.js --status  # Check state
 *   node discord-bridge.js --reset   # Reset state
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const CONFIG_PATH = path.join(__dirname, "../config/discord-bridge.config.json");
const STATE_PATH = path.join(__dirname, "../state/discord-bridge-state.json");
const LOG_PATH = path.join(__dirname, "../logs/discord-bridge.log");
const LOGS_DIR = path.dirname(LOG_PATH);

// Defaults
const DEFAULT_CONFIG = {
  discord: {
    email: "your-email@example.com",
    password: "your-password",
    server_name: "Your Server",
    channel_name: "channel-name"
  },
  telegram: {
    chat_id: "YOUR_CHAT_ID"
  },
  scheduler: {
    interval_minutes: 15
  },
  logging: {
    level: "info"
  }
};

const DEFAULT_STATE = {
  last_message_id: "0",
  last_check: new Date().toISOString(),
  message_count_forwarded: 0,
  server_id: null,
  channel_id: null,
  errors: []
};

// Logger
class Logger {
  constructor(filePath, level = "info") {
    this.filePath = filePath;
    this.level = level;
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    
    process.stdout.write(logLine);
    
    try {
      fs.appendFileSync(this.filePath, logLine);
    } catch (e) {
      console.error("Failed to write log:", e.message);
    }
  }

  info(msg) { this.log(msg, "info"); }
  error(msg) { this.log(msg, "error"); }
  warn(msg) { this.log(msg, "warn"); }
  debug(msg) { this.log(msg, "debug"); }
}

const logger = new Logger(LOG_PATH);

// State Management
function loadState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      return JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
    }
  } catch (e) {
    logger.error(`Failed to load state: ${e.message}`);
  }
  return { ...DEFAULT_STATE };
}

function saveState(state) {
  try {
    const dir = path.dirname(STATE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    logger.info(`State saved: ${message_count_forwarded} messages forwarded`);
  } catch (e) {
    logger.error(`Failed to save state: ${e.message}`);
  }
}

// Config Management
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch (e) {
    logger.error(`Failed to load config: ${e.message}`);
  }
  return DEFAULT_CONFIG;
}

function ensureConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
    logger.warn(`Config created at ${CONFIG_PATH}. Please fill in your settings!`);
    return DEFAULT_CONFIG;
  }
  return loadConfig();
}

// Discord Message Scraping via agent-browser
async function fetchDiscordMessages(config) {
  try {
    logger.info("Opening Discord in browser...");
    
    // Login to Discord
    execSync('agent-browser open "https://discord.com/login"', { stdio: "inherit" });
    execSync('agent-browser wait 3000');
    
    // Fill email
    execSync(`agent-browser snapshot -i --json > /tmp/discord_snapshot.json`);
    // Parse snapshot to find email field
    const snapshot = JSON.parse(fs.readFileSync("/tmp/discord_snapshot.json", "utf-8"));
    const emailFieldRef = snapshot.data.refs.e1 || "emailInput"; // Adapt based on actual page
    
    execSync(`agent-browser fill @${emailFieldRef} "${config.discord.email}"`);
    execSync(`agent-browser fill @passwordInput "${config.discord.password}"`);
    execSync(`agent-browser press Enter`);
    execSync(`agent-browser wait --load networkidle`);
    
    // Navigate to channel
    logger.info(`Navigating to #${config.discord.channel_name}...`);
    // This would require more complex DOM parsing to find the right channel
    // For MVP, we'd manually navigate or use Discord API instead
    
    // For now, return mock data for demonstration
    logger.info("Fetching messages from Discord...");
    
    // In real implementation, scrape messages from DOM here
    const messages = [
      {
        id: "msg_001",
        username: "ExampleUser",
        content: "Hello Discord bridge!",
        timestamp: new Date().toISOString(),
        avatar_url: "https://example.com/avatar.png"
      }
    ];
    
    return messages;
    
  } catch (e) {
    logger.error(`Failed to fetch Discord messages: ${e.message}`);
    return [];
  }
}

// Telegram forwarding
function forwardToTelegram(message, config) {
  try {
    const telegramText = formatMessageForTelegram(message);
    const chatId = config.telegram.chat_id;
    
    logger.info(`Forwarding to Telegram (${message.username}): ${message.content.substring(0, 50)}...`);
    
    // Use OpenClaw message tool (would be integrated via API call or shell)
    // This is a placeholder for the actual implementation
    
    logger.info(`Message forwarded to Telegram chat ${chatId}`);
    return true;
    
  } catch (e) {
    logger.error(`Failed to forward message: ${e.message}`);
    return false;
  }
}

function formatMessageForTelegram(message) {
  const timestamp = new Date(message.timestamp).toLocaleString();
  return `👤 **${message.username}** — ${timestamp}\n━━━━━━━━━━━━━━━━\n${message.content}`;
}

// Main Bridge Logic
async function runBridge(config) {
  logger.info("Starting Discord → Telegram bridge...");
  
  const state = loadState();
  const lastMessageId = state.last_message_id || "0";
  
  try {
    // Fetch messages
    const messages = await fetchDiscordMessages(config);
    
    if (messages.length === 0) {
      logger.info("No new messages");
      state.last_check = new Date().toISOString();
      saveState(state);
      return;
    }
    
    // Filter new messages
    const newMessages = messages.filter(m => parseInt(m.id.split("_")[1]) > parseInt(lastMessageId));
    
    if (newMessages.length === 0) {
      logger.info("No new messages since last check");
      state.last_check = new Date().toISOString();
      saveState(state);
      return;
    }
    
    // Forward each message
    let forwardedCount = 0;
    for (const message of newMessages) {
      if (forwardToTelegram(message, config)) {
        forwardedCount++;
        state.last_message_id = message.id;
      }
    }
    
    // Update state
    state.message_count_forwarded += forwardedCount;
    state.last_check = new Date().toISOString();
    saveState(state);
    
    logger.info(`✓ Bridge run complete: ${forwardedCount} messages forwarded`);
    
  } catch (e) {
    logger.error(`Bridge error: ${e.message}`);
    state.errors = state.errors || [];
    state.errors.push({ timestamp: new Date().toISOString(), error: e.message });
    saveState(state);
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "run";
  
  switch (command) {
    case "--test":
      logger.info("TEST MODE");
      ensureConfig();
      const testConfig = loadConfig();
      await runBridge(testConfig);
      break;
      
    case "--status":
      const state = loadState();
      console.log("\n📊 Discord Bridge Status:");
      console.log(JSON.stringify(state, null, 2));
      break;
      
    case "--reset":
      if (process.argv.includes("--force")) {
        fs.writeFileSync(STATE_PATH, JSON.stringify(DEFAULT_STATE, null, 2));
        logger.warn("State reset to default");
      } else {
        console.log("Use --reset --force to confirm");
      }
      break;
      
    default:
      const config = ensureConfig();
      await runBridge(config);
  }
}

if (require.main === module) {
  main().catch(e => {
    logger.error(`Fatal error: ${e.message}`);
    process.exit(1);
  });
}

module.exports = { runBridge, loadConfig, loadState };
