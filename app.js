import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';
import { ROBOTIZUJTO_DATA } from './data.js';

// --- KONFIGURACE ---
env.useBrowserCache = true; // ZAJIŠŤUJE ULOŽENÍ MODELU DO CACHE PROHLÍŽEČE
env.allowLocalModels = false;

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const statusText = document.getElementById('status-text');
const statusDot = document.getElementById('status-dot');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');

let generator = null;
let messages = [
    { 
        role: "system", 
        content: `Jsi specializovaný odborník portálu Robotizujto.cz. 
        TVOJE PRAVIDLA:
        1. Odpovídej výhradně ČESKY.
        2. Používej POUZE informace z přiloženého KONTEXTU.
        3. Pokud odpověď v KONTEXTU není, řekni slušně, že to nevíš.
        4. Odpovídej stručně, maximálně ve 3 větách.

        KONTEXT:
        ${ROBOTIZUJTO_DATA}` 
    }
];

// --- POMOCNÉ FUNKCE ---
function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = role === 'user' ? "ml-auto bg-blue-600/20 p-3 rounded-2xl max-w-[85%] border border-blue-500/20" : "mr-auto bg-white/5 p-3 rounded-2xl max-w-[85%] border border-white/5";
    div.innerHTML = `<b class="block text-[10px] uppercase opacity-50 mb-1">${role === 'user' ? 'Ty' : 'Robotizujto AI'}</b>${text}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// --- NABÍJENÍ MODELU (CACHE-FIRST) ---
// app.js - změna na funkční český model
async function initAI() {
    if (generator) return generator;

    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const progressLabel = document.getElementById('progress-label');
    const progressContainer = document.getElementById('progress-container');

    try {
        generator = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct-ONNX', {
            device: 'webgpu',
            dtype: 'q4',
            progress_callback: (info) => {
                if (info.status === 'initiate') {
                    progressContainer.classList.remove('hidden');
                }
                
                if (info.status === 'progress') {
                    // 1. POKUD VÍME CELKOVOU VELIKOST (Standardní progress bar)
                    if (info.total && info.loaded) {
                        const p = Math.round((info.loaded / info.total) * 100);
                        progressBar.style.width = `${p}%`;
                        progressPercent.innerText = `${p}%`;
                        progressLabel.innerText = `Stahuji: ${info.file}`;
                    } 
                    // 2. POKUD VELIKOST NEVÍME (Ukazujeme aspoň MB)
                    else if (info.loaded) {
                        const loadedMB = (info.loaded / (1024 * 1024)).toFixed(1);
                        // Simulujeme pohyb baru, aby uživatel věděl, že to nezamrzlo
                        progressBar.style.width = `${(Math.log10(info.loaded / 1024) * 10) % 100}%`;
                        progressPercent.innerText = `${loadedMB} MB`;
                        progressLabel.innerText = `Načítám data: ${info.file}`;
                    }
                }

                if (info.status === 'ready') {
                    progressContainer.classList.add('hidden');
                    document.getElementById('status-dot').classList.replace('bg-red-500', 'bg-green-500');
                    document.getElementById('status-text').innerText = "Model připraven lokálně";
                }
            }
        });
        return generator;
    } catch (err) {
        console.error("Iniciace selhala:", err);
        document.getElementById('status-text').innerText = "❌ Chyba WebGPU / Cache";
    }
}

// --- HLAVNÍ AKCE ---
async function handleChat() {
    const query = userInput.value.trim();
    if (!query) return;

    appendMessage('user', query);
    messages.push({ role: "user", content: query });
    userInput.value = '';
    sendBtn.disabled = true;

    try {
        const ai = await initAI();
        statusText.innerText = "🧠 Generuji odpověď...";
        
        const output = await ai(messages, { 
            max_new_tokens: 120, 
            temperature: 0.6,
            repetition_penalty: 1.2
        });

        const reply = output[0].generated_text[output[0].generated_text.length - 1].content;
        appendMessage('assistant', reply);
        messages.push({ role: "assistant", content: reply });
        statusText.innerText = "Online (WebGPU)";
    } catch (err) {
        statusText.innerText = "❌ Chyba výpočtu";
    } finally {
        sendBtn.disabled = false;
    }
}

// Event Listeners
sendBtn.addEventListener('click', handleChat);
userInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleChat());

// Registrace PWA Service Workera
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
}

// Předběžné načtení (volitelné)
statusText.innerText = "Čekám na první dotaz...";
