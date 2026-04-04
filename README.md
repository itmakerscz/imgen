# nevimto.cz | Local AI Agent Orchestrator 🤖

**nevimto.cz** is a high-performance, privacy-first platform designed to run Large Language Models (LLMs) directly in your browser. Using **WebGPU** and **WebAssembly**, it transforms your browser into a fully local AI workstation.

Create specialized AI Agents, feed them custom English knowledge bases, and chat with them—all with **zero data leaving your machine**.

---

## 🌟 Key Features

- **100% Local Intelligence**: Powered by `WebLLM` (MLC-AI). No API keys, no cloud, no subscriptions.
- **Agent Dashboard**: A modern, tile-based interface to create and manage multiple persistent AI Agents.
- **RAG Capability (Retrieval-Augmented Generation)**: Each agent features a dedicated sidebar to upload English-language data (documentation, notes, snippets) to provide specialized context.
- **Persistent Memory**: Uses **IndexedDB** (via `Dexie.js`) to save all your agents, custom data, and chat histories locally.
- **PWA Ready**: Installable as a Progressive Web App with offline asset caching.
- **Optimized Model**: Pre-configured to use **TinyLlama-1.1B-Chat-v1.0** (q4f32_1-MLC) for the best balance of speed and hardware compatibility.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **UI Framework** | [Vue.js 3](https://vuejs.org/) (Composition API) |
| **AI Engine** | [WebLLM](https://webllm.mlc.ai/) (MLC-AI) |
| **Database** | [Dexie.js](https://dexie.org/) (IndexedDB) |
| **Hardware Accel.** | WebGPU & WebAssembly (WASM) |
| **Design** | Modern CSS3 (Variables, Grid, Flexbox) |

---

## 📁 Project Structure

```text
├── assets/
│   ├── dexie.mjs         # Local IndexedDB library
│   ├── vue.global.js     # Local Vue.js framework
│   └── style.css         # Main application styling
├── app.js                # AI Orchestration & Vue Logic
├── db.js                 # Database Schema
├── index.html            # Entry Point
├── manifest.json         # PWA Manifest
├── sw.js                 # Service Worker (Caching)
└── favicon.ico           # Application Icon
