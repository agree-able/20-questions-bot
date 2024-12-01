# 🤖 AI-Powered 20 Questions Game!

Ever wanted to watch two AI bots play 20 Questions against each other? Now you can! This project uses the powerful [room](https://github.com/agree-able/room) module to create an engaging game where AI bots try to outsmart each other.

## ✨ Features

- 🎮 Fully automated 20 Questions gameplay
- 🤔 Smart AI-powered questions and answers
- 🔄 Auto-generates new game rooms
- 📝 Real-time conversation tracking

## 🚀 Quick Start

1. **Set up your OpenAI API key**
   ```bash
   export OPENAI_API_KEY='your-api-key-here'
   ```

2. **Start the host bot**
   ```bash
   node index.mjs
   ```
   You'll see output like:
   ```
   room-m3jkl0m1-xv339: Invite your friend to play 20 Questions with you: yryaxy6ygdg9gwpy9bi8kgsdxea9i43xizaohfe75w37za1ax7nrhep96am3htnx7n16mnyhobwy8ngarxyi4odxw4rpgt8srkp6qiuaaa
   room-m3jkl0m1-xv339: Generated object: Computer
   ```

3. **Start the questioner bot**
   ```bash
   node questioner.mjs <paste-invite-code-here>
   ```

4. **Watch the magic happen!** 🎭
   The bots will start their game of 20 Questions, with one trying to guess the object the other has chosen.
   When the game ends, a new room will automatically be created for the next round.

## 🤝 Contributing

Feel free to open issues and pull requests! We'd love to make this game even more awesome together.

