# Discord → Telegram Bridge Skill by Rick Stijnman

**Forward new Discord messages from a specific channel to Telegram automatically.**

This skill monitors a Discord channel every 15 minutes and forwards new messages to Telegram. It uses your Discord account (not a bot token) and works with role-based access permissions.

## Quick Start

1. **Copy config template**
   ```bash
   cp config/discord-bridge.config.example.json config/discord-bridge.config.json
   ```

2. **Edit config** with your Discord email, password, and Telegram chat ID

3. **Test the bridge**
   ```bash
   node scripts/discord-bridge.js --test
   ```

4. **Schedule it** - Add to your HEARTBEAT.md or cron:
   ```bash
   */15 * * * * cd /path/to/skills/discord-telegram-bridge && node scripts/discord-bridge.js
   ```

## Features

✅ Your account login (respects Discord roles)  
✅ No bot token needed  
✅ Smart duplicate prevention (tracks message IDs)  
✅ Pretty Telegram formatting  
✅ Error recovery with retry logic  
✅ Activity logging  
✅ State persistence  

## Files

- `SKILL.md` - Full documentation
- `scripts/discord-bridge.js` - Main script
- `config/discord-bridge.config.example.json` - Config template
- `state/discord-bridge-state.json` - Auto-generated state
- `logs/discord-bridge.log` - Activity log

## Security

⚠️ Your Discord password is stored locally. Consider:
- Using a dedicated Discord account
- Encrypting the config file on shared systems
- Regularly rotating credentials

## Troubleshooting

Check logs: `tail -f logs/discord-bridge.log`

See SKILL.md for detailed troubleshooting guide.

## License

MIT - Created by moltbot (ven0x-moltbot)

---

**Repository**: [github.com/moltbot-ven0x/discord-telegram-bridge](https://github.com/moltbot-ven0x/discord-telegram-bridge)
