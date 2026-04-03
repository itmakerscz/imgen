import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';
import { ROBOTIZUJTO_DATA } from './data.js';

// KONFIGURACE PRO AUTOMATICKOU CACHE
env.useBrowserCache = true; 
env.allowLocalModels = false; // Vypneme hledání lokálních souborů, chceme HF Hub

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
        content: `You are a professional AI assistant for Robotizujto.cz. 
        You have been provided with context data in English. 
        When a user asks a question in Czech, translate the relevant information from the context and answer in Czech. 
        Be concise and helpful.

        CONTEXT DATA:
        ${ROBOTIZUJTO_DATA}` 
    }
];

function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = role === 'user' 
        ? "ml-auto bg-blue-600/20 p-3 rounded-2xl max-w-[85%] border border-blue-500/20" 
        : "mr-auto bg-white/5 p-3 rounded-2xl max-w-[85%] border border-white/10 text-blue-50";
    div.innerHTML = `<span class="text-[9px] uppercase opacity-30 font-bold block mb-1">${role === 'user' ? 'Uživatel' : 'Robotizujto'}</span>${text}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function loadAI() {
    if (generator) return generator;

    try {
        statusText.innerText = "NAČÍTÁM WEBGPU ENGINE...";
        
        // Cesta k oficiálnímu ONNX modelu na Hugging Face
        const model_id = 'onnx-community/SmolLM2-135M-Instruct-ONNX';

        generator = await pipeline('text-generation', model_id, {
            device: 'webgpu',
            dtype: 'q4f16', // Nejrychlejší formát pro GPU
            progress_callback: (info) => {
                if (info.status === 'initiate') progressContainer.classList.remove('hidden');
                if (info.status === 'progress') {
                    const p = Math.round(info.progress || 0);
                    progressBar.style.width = `${p}%`;
                    progressPercent.innerText = `${p}%`;
                }
                if (info.status === 'ready') {
                    progressContainer.classList.add('hidden');
                    statusDot.classList.replace('bg-red-500', 'bg-green-500');
                    statusText.innerText = "MODEL NAČTEN (WEBGPU)";
                }
            }
        });
        return generator;
    } catch (err) {
        statusText.innerText = "WEBGPU SELHALO - ZKOUŠÍM CPU (WASM)";
        console.error(err);
        // Fallback na CPU pokud GPU není dostupné
        generator = await pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX', {
            device: 'wasm',
            dtype: 'q8'
        });
        return generator;
    }
}

async function handleChat() {
    const text = userInput.value.trim();
    if (!text || sendBtn.disabled) return;

    appendMessage('user', text);
    messages.push({ role: "user", content: text });
    userInput.value = '';
    sendBtn.disabled = true;

    try {
        const ai = await loadAI();
        statusText.innerText = "GENERUJI ODPOVĚĎ...";

        const output = await ai(messages, { 
            max_new_tokens: 120,
            temperature: 0.2,
            repetition_penalty: 1.2
        });

        const reply = output[0].generated_text[output[0].generated_text.length - 1].content;
        appendMessage('assistant', reply);
        messages.push({ role: "assistant", content: reply });
        statusText.innerText = "PŘIPRAVEN";
        
        // Udržování kontextu (max 5 zpráv)
        if (messages.length > 6) messages.splice(1, 2);

    } catch (err) {
        console.error(err);
        statusText.innerText = "CHYBA PŘI VÝPOČTU";
    } finally {
        sendBtn.disabled = false;
    }
}

sendBtn.addEventListener('click', handleChat);
userInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleChat());
