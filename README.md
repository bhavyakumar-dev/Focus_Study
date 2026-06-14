# Hey there! Welcome to Focus OS V8.0 🚀

Imagine having a workspace that actually cares about your focus, your health, and your code. That's exactly what Focus OS is all about. It’s not just another IDE or task manager—it’s a living, breathing companion designed to help you get into the zone and stay there. We built this to merge gamification, AI smarts, and real biological pacing into one beautiful environment.

## ✨ What makes it special?

### 1. Know Your Flow (Analytics & Heatmaps)
Ever wonder how productive you *actually* are? Focus OS tracks your deep work and paints it onto a beautiful GitHub-style heatmap. It’s super satisfying to watch your 365-day streak grow!

### 2. Don't Study Alone (Live Multiplayer)
Focusing solo can get lonely. Now you can spin up encrypted, password-protected study rooms. The coolest part? If a friend loses focus and tabs out, their avatar turns red instantly. It’s peer pressure, but the good kind!

### 3. Your Code, Anywhere (Web & Native IDE)
Say goodbye to basic text boxes. You get a full-blown Monaco Editor (the same engine as VS Code) right in your browser or desktop app. 
- **WebContainers:** Run `npm install` and boot real Node.js servers without ever leaving the browser.
- **Run Anything:** We’ve got C++ and Java support baked right in.
- **Live Preview:** Building a React app? The moment your server starts, a live preview docks right next to your code. 
- **Real Terminal:** A fully interactive CLI to run your commands effortlessly.

### 4. Code Together (Real-Time Collab)
Think Google Docs, but for your codebase. Invite your team and watch their cursors dance across the screen in real-time. Powered by Yjs, it's blazing fast and peer-to-peer!

### 5. AI That Feels Human (Ghost Text & Diagnostics)
- **Ghost Text:** Pause for a second while typing, and our Gemini AI will magically suggest the rest of the line. Just hit Tab!
- **Explain Error:** Terminal crashed? Don't panic. Click the "Explain Error" button and Jarvis (our AI) will read your stack trace and tell you exactly how to fix it in plain, friendly English.

### 6. Tools You Love (Vim, Themes, Snippets, Documents)
- **Vim Mode:** Because taking your hands off the keyboard is a crime.
- **Snippets:** Save your favorite code blocks to the cloud and drop them in anytime.
- **Word & LaTeX:** Write your `.md` or `.tex` files and hit "Preview". You can instantly download them as gorgeous `.docx` Word documents or compiled PDFs!
- **Themes:** Dark, Light, or High Contrast—your eyes, your rules.

### 7. We Care About Your Body (Health Protocols)
It’s easy to forget to blink when you're coding. Our dynamic "Heartbeat" timer anchors you, while our health protocols gently tap you on the shoulder:
- **Posture:** "Hey, sit up straight!" (Every 15 mins)
- **Hydration:** "Grab some water!" (Every 30 mins)
- **Vision:** Screen locks for 20 seconds so you can rest your eyes (Every 20 mins).

### 8. Drop the Overwhelm (AI Kanban)
Got a massive, scary goal? Just drop it into the "AI Breakdown" engine. Gemini will instantly slice it up into tiny, actionable micro-tasks and organize them on a drag-and-drop Kanban board.

### 9. Meet Jarvis & Your Focus Pet
Your Focus Pet sleeps peacefully while you crush your goals but gets pretty grumpy if you break your streak. Plus, the integrated Voice Assistant will literally speak to you, offering guidance and keeping you on track.

---

## 🛠️ How to get it running

We built this using React, Vite, and Electron, with Firebase handling the backend and Google Gemini 2.5 Flash powering the brains. 

### Quick Start
1. Run `npm install` to grab the dependencies.
2. Want the web version? Run `npm run dev`.
3. Prefer the native Desktop app? Run `npm run electron:dev`.
4. (Optional) Pop your Gemini API Key into the Setup screen, and add your Firebase config to `firebase.js` if you want cloud sync.

### Deploying
- **Web:** Just push to Netlify! We have a `netlify.toml` ready to go.
- **Desktop (.exe):** Run `npm run electron:build` to generate a Windows installer.
- **Android (.apk):** Run `npx cap sync android` and build through Android Studio!

*Built with ❤️ for absolute, unwavering focus.*
