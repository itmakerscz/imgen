import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';
import { ROBOTIZUJTO_DATA } from './data.js';

// Konfigurace pro lokální běh a cache
env.useBrowserCache = true;
env.allowLocalModels = true; 

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const statusText = document.getElementById('status-text');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');

let generator = null;

// Kontext pro SmolLM2 - musí být stručný, protože model má menší "paměť" (context window)
let messages = [
    { 
        role: "system", 
        content: `Jsi AI asistent Robotizujto.cz. Odpovídej česky a velmi stručně. 
        Data: ${ROBOTIZUJTO_DATA}` 
    }
];

async function initSmolLM() {
    if (generator) return generator;

    try {
        statusText.innerText = "NAČÍTÁM SMOLLM2 (WEBGPU)...";
        
        // Načtení konkrétního modelu ze složky nebo z HF
        // Pokud máš model ve složce, změň 'HuggingFaceTB/SmolLM2-135M-Instruct' na './model/'
        generator = await pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX', {
            device: 'webgpu',
            dtype: 'q4f16', // Specifická kvantizace q4f16 pro maximální výkon
            progress_callback: (info) => {
                if (info.status === 'initiate') progressContainer.classList.remove('hidden');
                if (info.status === 'progress') {
                    const p = info.progress || 0;
                    progressBar.style.width = `${p}%`;
                    document.getElementById('progress-percent').innerText = `${Math.round(p)}%`;
                }
                if (info.status === 'ready') {
                    progressContainer.classList.add('hidden');
                    statusText.innerText = "PŘIPRAVEN (SMOLLM2)";
                }
            }
        });
        return generator;
    } catch (err) {
        statusText.innerText = "WEBGPU CHYBA - ZKOUŠÍM CPU...";
        console.error(err);
        // Fallback na CPU pokud WebGPU selže
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

    // Přidání zprávy do UI
    const userDiv = document.createElement('div');
    userDiv.className = "ml-auto bg-blue-600/20 p-3 rounded-xl max-w-[80%] border border-blue-500/20 mb-4";
    userDiv.innerText = text;
    chatBox.appendChild(userDiv);
    
    messages.push({ role: "user", content: text });
    userInput.value = '';
    sendBtn.disabled = true;

    try {
        const ai = await initSmolLM();
        
        const output = await ai(messages, { 
            max_new_tokens: 100,
            temperature: 0.2, // Nízká teplota pro přesnost u takto malého modelu
            repetition_penalty: 1.2,
            top_k: 40
        });

        const reply = output[0].generated_text[output[0].generated_text.length - 1].content;
        
        const aiDiv = document.createElement('div');
        aiDiv.className = "mr-auto bg-white/5 p-3 rounded-xl max-w-[80%] border border-white/10 mb-4";
        aiDiv.innerText = reply;
        chatBox.appendChild(aiDiv);
        
        messages.push({ role: "assistant", content: reply });
        
        // Omezení historie pro SmolLM2 (má menší context window než Qwen)
        if (messages.length > 5) messages.splice(1, 2);

    } catch (err) {
        statusText.innerText = "CHYBA GENEROVÁNÍ";
    } finally {
        sendBtn.disabled = false;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

sendBtn.addEventListener('click', handleChat);
userInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleChat());
