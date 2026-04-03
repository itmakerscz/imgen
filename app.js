import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';
import { ROBOTIZUJTO_DATA } from './data.js';

// Globální nastavení prostředí
env.useBrowserCache = true;
env.allowLocalModels = false;

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const statusText = document.getElementById('status-text');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');

let generator = null;
let isInitializing = false; // Prevence vícenásobné inicializace

// System Prompt: Anglická data, Český výstup
const systemPrompt = { 
    role: "system", 
    content: `You are an AI assistant for Robotizujto.cz. Use the following English context to answer in Czech. Be brief.
    CONTEXT: ${ROBOTIZUJTO_DATA}`
};

let messages = [systemPrompt];

async function initModel() {
    if (generator) return generator;
    if (isInitializing) return; // Pokud už se načítá, nezačínej znovu
    
    isInitializing = true;
    statusText.innerText = "INICIALIZACE WEBGPU...";

    try {
        // Zkusíme SmolLM2-135M s automatickou detekcí nejlepšího dtype pro tvou kartu
        generator = await pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX', {
            device: 'webgpu',
            dtype: 'q4f16',
            // Pokud q4f16 hází chybu 247239448, Transformers.js se pokusí o auto-fallback
            progress_callback: (info) => {
                if (info.status === 'initiate') progressContainer.classList.remove('hidden');
                if (info.status === 'progress') {
                    progressBar.style.width = `${info.progress || 0}%`;
                }
                if (info.status === 'ready') {
                    progressContainer.classList.add('hidden');
                    statusText.innerText = "SMOLLM2 PŘIPRAVEN";
                }
            }
        });
        isInitializing = false;
        return generator;
    } catch (err) {
        console.error("WebGPU Error:", err);
        statusText.innerText = "WEBGPU SELHALO - POUŽÍVÁM CPU (POMALEJŠÍ)";
        
        // Fallback na CPU (WASM) - toto by mělo chybu 247239448 odstranit vždy
        generator = await pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX', {
            device: 'wasm',
            dtype: 'q8'
        });
        isInitializing = false;
        return generator;
    }
}

async function handleChat() {
    const text = userInput.value.trim();
    if (!text || sendBtn.disabled) return;

    // UI: Přidat zprávu uživatele
    const userDiv = document.createElement('div');
    userDiv.className = "ml-auto bg-blue-600/20 p-3 rounded-xl max-w-[85%] border border-blue-500/20 mb-4";
    userDiv.innerText = text;
    chatBox.appendChild(userDiv);
    
    messages.push({ role: "user", content: text });
    userInput.value = '';
    sendBtn.disabled = true;

    try {
        const ai = await initModel();
        if (!ai) throw new Error("Model se nepodařilo inicializovat.");

        statusText.innerText = "AGENT PŘEMÝŠLÍ...";
        
        const output = await ai(messages, { 
            max_new_tokens: 100,
            temperature: 0.2, // Pro přesnost z anglických dat
            repetition_penalty: 1.2
        });

        const reply = output[0].generated_text[output[0].generated_text.length - 1].content;
        
        // UI: Přidat odpověď AI
        const aiDiv = document.createElement('div');
        aiDiv.className = "mr-auto bg-white/5 p-3 rounded-xl max-w-[85%] border border-white/10 mb-4";
        aiDiv.innerText = reply;
        chatBox.appendChild(aiDiv);
        
        messages.push({ role: "assistant", content: reply });
        
        // Reset stavu
        statusText.innerText = "PŘIPRAVEN";
        if (messages.length > 6) messages.splice(1, 2);

    } catch (err) {
        console.error(err);
        statusText.innerText = "CHYBA: " + err.message;
    } finally {
        sendBtn.disabled = false;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

sendBtn.addEventListener('click', handleChat);
userInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleChat());
