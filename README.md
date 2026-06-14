<div align="center">
  <h1>🧠 Focus Study</h1>
  <p><b>The Ultimate Gamified, AI-Powered, Distraction-Free Study Environment</b></p>
  
  [![Release](https://img.shields.io/github/v/release/bhavyakumar-dev/Focus_Study)](https://github.com/bhavyakumar-dev/Focus_Study/releases)
  [![Build Apps](https://github.com/bhavyakumar-dev/Focus_Study/actions/workflows/build-release.yml/badge.svg)](https://github.com/bhavyakumar-dev/Focus_Study/actions)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
</div>

<br />

> **Focus Study** is not just another Pomodoro timer. It is a complete, immersive operating system for your brain. By combining intense restriction mechanisms (Alt+Tab blocking), neural acoustic soundscapes, deep AI integration, and an addictive RPG leveling system, Focus Study forces you into a state of deep work and rewards you for staying there.

---

## 🌟 Core Features

### ⚔️ RPG Gamification & Progression
Why study for free when you can level up? 
- **Earn XP**: Gain points for every second you remain in strict focus mode.
- **Ranks & Titles**: Progress from *Novice Scholar* all the way to *Grandmaster of Focus*.
- **Streaks**: Maintain daily study streaks to unlock dynamic flame badges and point multipliers.
- **Punishment System**: If you exit the focus session early or tab out, you lose XP and kill your streak.

### 🛡️ Kiosk Mode (Anti-Distraction)
- **Desktop `.exe`**: A natively compiled Electron wrapper forces the app into a borderless, full-screen Kiosk mode.
- **Hard Block**: System-level hooks intercept and block `Alt+Tab` and `Windows` keys, physically preventing you from leaving the study material until the timer completes.
- **Emergency Exit**: Sessions are locked by a custom password you set before starting. You cannot leave without it.

### 🧠 Neural Acoustic Soundscapes
- Built-in **Web Audio API** synthesizer generates real-time, high-fidelity neural frequencies.
- **Deep Brown Noise**: Enhances focus and blocks out external environments.
- **Pink & White Noise**: Adjustable sliders to create the perfect custom sonic environment for deep work.

### 🤖 Gemini AI Study Assistant
- **Strict-Mode AI**: A Google Gemini 2.5 Flash powered chat assistant embedded directly in the sidebar.
- **Zero Hallucination Tolerance**: The prompt is strictly engineered to *only* answer academic questions. It will aggressively refuse to tell jokes, chat about the weather, or entertain distractions.
- **Quick Summary**: Instantly generate high-yield, bulleted summaries of your current study topic with a single click.

### 📚 Immersive Study Materials
- **Native Code Editor**: Select the 'Code Editor' material type to launch a deep-focus, dark-themed coding environment. Perfect for programming sessions without the distractions of a full OS window.
- **YouTube Embeds**: Paste a YouTube lecture URL to embed it securely.
- **Local PDF Support**: Upload your own local PDFs directly into the app for offline reading.
- **Spotify Integration**: Embed your custom focus playlists directly into the environment.

### 💻 Hyper-Minimalist UI
- **Glassmorphism**: Premium frosted glass panels over a dynamically pulsating, animated orb background.
- **Zen Mode**: The sidebar is fully collapsible. Hide the UI, tasks, and AI to leave only the content and the timer.
- **Custom Scrollbars**: Every detail is styled to match the dark, sleek aesthetic.

---

## 🚀 Installation & Usage

Focus Study can be used directly in the browser, or downloaded as a native application for maximum distraction blocking.

### 1. Web Version (Instant Access)
Visit the live deployment to start studying immediately:
👉 **[Focus Study on Netlify](https://focusnstudy.netlify.app/)**

### 2. Desktop Version (.exe) - Recommended
For the absolute best experience with `Alt+Tab` blocking, download the native Windows app.
1. Go to the [Releases](https://github.com/bhavyakumar-dev/Focus_Study/releases) page.
2. Download the latest `focus-study-windows.exe`.
3. Run the installer.

### 3. Android Version (.apk)
Study on the go with the Android wrapper.
1. Go to the [Releases](https://github.com/bhavyakumar-dev/Focus_Study/releases) page.
2. Download `focus-study-android.apk`.
3. Install the APK on your Android device.

---

## 🛠️ Technology Stack

Focus Study is built with a modern, lightning-fast stack:
- **Frontend**: React 18 + Vite
- **Styling**: Vanilla CSS with advanced CSS Variables and Keyframe Animations
- **AI Integration**: `@google/generative-ai` (Gemini 2.5 Flash)
- **Desktop Compilation**: Electron + electron-builder
- **Mobile Compilation**: Capacitor JS
- **CI/CD**: GitHub Actions (Automated multi-platform builds)

---

## 🔧 Developer Setup

Want to contribute or run the source code locally? 

```bash
# 1. Clone the repository
git clone https://github.com/bhavyakumar-dev/Focus_Study.git

# 2. Enter directory
cd Focus_Study

# 3. Install dependencies
npm install

# 4. Start the Vite development server
npm run dev
```

### Building Natively

To compile the Windows desktop app locally:
```bash
npm run electron:build
```

---

## 📜 Version Control & Roadmap

We follow **Semantic Versioning** (MAJOR.MINOR.PATCH).
- `v1.0.0` - Initial Ultimate Edition Release (Gamification, AI, Desktop Wrapper).
- `v1.1.0` - UI Overhaul, Neural Acoustics, GitHub Actions CI Pipeline.

### Upcoming Features:
- [ ] Cloud Account Syncing (Supabase/Firebase)
- [ ] Multiplayer "Study Rooms" with friends
- [ ] Advanced Pomodoro Analytics & Charts
- [ ] Mobile-native notification blocking

---

<div align="center">
  <p>Built with ❤️ for deep work and intense focus.</p>
</div>
