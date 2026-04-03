import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';
import { ROBOTIZUJTO_DATA } from './data.js';

// 1. PWA Registrace a detekce offline stavu
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(() => {
        console.log("PWA: Aktivní");
        if (!navigator.onLine) document.getElementById('pwa-status').innerText = "Offline Mode";
    });
}

// 2. Konfigurace AI (Cache First)
env.allowLocalModels = false;
env.useBrowserCache = true; 

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const status = document.getElementById('status');
const btn = document.getElementById('send-btn');

let generator = null;
let messages = [
    { role: "system", content: `Jsi expertní asistent portálu Robotizujto.cz. Odpovídej stručně a česky. Znalosti: ${ROBOTIZUJTO_DATA}` }
];

async function addMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = role === 'user' 
        ? "bg-slate-800 p-3 rounded-2xl ml-auto max-w-[80%] text-sm border border-white/5" 
        : "bg-blue-600/20 p-3 rounded-2xl mr-auto max-w-[80%] text-sm border border-blue-500/30 text-blue-100";
    msgDiv.innerText = text;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function handleChat() {
    const text = userInput.value.trim();
    if (!text || btn.disabled) return;

    // 1. Zobrazení zprávy uživatele
    addMessage('user', text);
    messages.push({ role: "user", content: text });
    userInput.value = '';
    btn.disabled = true;

    try {
        if (!generator) {
            status.innerText = "⏳ Inicializace WebGPU (SmolLM2-135M)...";
            generator = await pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX', {
                device: 'webgpu',
                dtype: 'q4'
            });
        }

        status.innerText = "🧠 Agent přemýšlí...";

        // 2. Generování odpovědi
        const output = await generator(messages, { 
            max_new_tokens: 150,
            temperature: 0.7,
            top_k: 40
        });

        const reply = output[0].generated_text[output[0].generated_text.length - 1].content;
        
        // 3. Zobrazení odpovědi agenta
        addMessage('assistant', reply);
        messages.push({ role: "assistant", content: reply });
        status.innerText = "✨ Online (WebGPU)";

    } catch (err) {
        console.error(err);
        status.innerText = "❌ Chyba WebGPU: " + err.message;
    } finally {
        btn.disabled = false;
    }
}

btn.addEventListener('click', handleChat);
userInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleChat(); });;
