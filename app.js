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
    { role: "system", content: `Jsi AI expert Robotizujto.cz. Odpovídej stručně. Znalosti: ${ROBOTIZUJTO_DATA}` }
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
async function initAI() {
    if (generator) return generator;

    try {
        generator = await pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX', {
            device: 'webgpu',
            dtype: 'q4',
            progress_callback: (info) => {
                if (info.status === 'initiate') progressContainer.classList.remove('hidden');
                if (info.status === 'progress') {
                    progressBar.style.width = `${info.progress}%`;
                    progressPercent.innerText = `${Math.round(info.progress)}%`;
                }
                if (info.status === 'ready') {
                    progressContainer.classList.add('hidden');
                    statusDot.classList.replace('bg-red-500', 'bg-green-500');
                    statusText.innerText = "Model připraven lokálně (Cache)";
                }
            }
        });
        return generator;
    } catch (err) {
        statusText.innerText = "Chyba: WebGPU není podporováno";
        console.error(err);
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
