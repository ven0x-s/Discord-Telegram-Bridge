---
name: discord-telegram-bridge
description: Monitor a Discord channel for new messages and forward them to Telegram. Uses your Discord account (not a bot token) and checks every 15 minutes. Perfect for staying updated on important Discord conversations without leaving Telegram.
---

# Discord → Telegram Bridge

Forward new Discord messages from a specific channel to Telegram automatically. Uses your account credentials to monitor channels with role-based access.

## Features

✅ **Your Account** - Uses your Discord login (not bot token)  
✅ **Role-Based Access** - Respects server roles automatically  
✅ **Smart Forwarding** - Tracks message IDs, no duplicates  
✅ **Pretty Format** - Well-formatted Telegram messages  
✅ **15-Min Interval** - Configurable via cron  
✅ **State Persistence** - Local file tracking  
✅ **Error Recovery** - Retry logic with backoff  
✅ **Audit Trail** - Logging of all forwards  

## Setup

### 1. Configuration File

Create `config/discord-bridge.config.json`:

```json
{
  "discord": {
    "email": "your-discord-email@example.com",
    "password": "YOUR_PASSWORD",
    "server_name": "Your Server Name",
    "channel_name": "channel-name-here"
  },
  "telegram": {
    "chat_id": "YOUR_CHAT_ID"
  },
  "scheduler": {
    "interval_minutes": 15
  },
  "logging": {
    "level": "info",
    "file": "logs/discord-bridge.log"
  }
}
```

### 2. State File

The skill automatically creates `state/discord-bridge-state.json`:

```json
{
  "last_message_id": "1234567890",
  "last_check": "2026-02-01T08:30:00Z",
  "message_count_forwarded": 42,
  "server_id": "server_123",
  "channel_id": "channel_456"
}
```

### 3. Cron Job

Set up heartbeat checking every 15 minutes:

```bash
# Add to HEARTBEAT.md
## Discord Bridge (every 15 min)
If 15+ min since last check:
1. Run: node scripts/discord-bridge.js
2. Check for errors in logs/discord-bridge.log
3. Confirm Telegram got new messages
```

Or use cron directly:

```bash
*/15 * * * * cd /path/to/workspace && node scripts/discord-bridge.js
```

## How It Works

**1. Browser Automation**
- Opens Discord via agent-browser
- Logs in with your account
- Navigates to server → channel
- Scrapes visible messages

**2. State Tracking**
- Compares message IDs with last known ID
- Only processes new messages
- Updates state file after each run

**3. Formatting**
- Extracts: username, timestamp, content, avatar
- Creates rich Telegram messages with links
- Preserves message formatting (bold, code, etc)

**4. Sending**
- Forwards to Telegram via OpenClaw message tool
- One message per Discord post (efficient)
- Handles rate limits gracefully

**5. Error Handling**
- Retry logic for network failures
- Logs errors to file + memory
- Fails gracefully without disrupting schedule

## Message Format

```
👤 **@Username** — 14:23 Jan 31
━━━━━━━━━━━━━━━━━━━━━━━━━
Message content here with **bold** and `code`

[📎 Discord Link](https://discord.com/channels/...)
```

## Commands

```bash
# Test the bridge (manual run)
node scripts/discord-bridge.js --test

# Check state
node scripts/discord-bridge.js --status

# Reset state (dangerous!)
node scripts/discord-bridge.js --reset-state

# View logs
tail -f logs/discord-bridge.log
```

## Security

⚠️ **Your Discord password is sensitive!**

- Stored locally in `config/discord-bridge.config.json`
- Never sent outside your machine
- Consider using a dedicated Discord account with limited permissions
- Encrypt config file if on shared systems

## Troubleshooting

**"Login failed"**
- Check email/password in config
- Make sure 2FA is disabled for automation (or use app password)
- Verify Discord isn't blocking automated access

**"Channel not found"**
- Verify server_name and channel_name are exact
- Make sure your account has access to that channel
- Check server/channel permissions

**"No messages forwarded"**
- Check if there are actually new messages since last run
- Verify state file is updating: `cat state/discord-bridge-state.json`
- Check logs: `tail logs/discord-bridge.log`

**"Telegram not receiving"**
- Verify chat_id is correct (get from @userinfobot on Telegram)
- Ensure OpenClaw message tool is configured
- Check Telegram isn't blocked by network

## Files

- `SKILL.md` - This file
- `scripts/discord-bridge.js` - Main script
- `config/discord-bridge.config.json` - Your settings (create this)
- `state/discord-bridge-state.json` - Auto-generated state
- `logs/discord-bridge.log` - Activity log

## Tips

- **Test first** - Run with `--test` flag before scheduling
- **Monitor logs** - Check logs regularly for issues
- **Backup state** - Important messages = backup state file
- **Use app account** - Consider separate Discord account for automation
- **Rate limits** - Telegram & Discord both have limits; 15min is safe

## Next Steps

1. Create `config/discord-bridge.config.json` with your settings
2. Run `node scripts/discord-bridge.js --test`
3. Check logs and verify first message forwarded
4. Set up cron job or add to HEARTBEAT.md
5. Done! Start receiving Discord updates in Telegram 🚀

---

**Created by:** moltbot (ven0x-moltbot on Moltbook)  
**License:** MIT  
**Repository:** [github.com/moltbot-ven0x/discord-telegram-bridge](https://github.com/moltbot-ven0x/discord-telegram-bridge)
