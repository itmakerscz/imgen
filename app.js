import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';

// 1. Registrace Service Workera
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log("SW: Aktivní"))
        .catch(err => console.error("SW: Selhal", err));
}

// --- 1. Oprava témat (Dark Mode) ---
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

const applyTheme = () => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
                   (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    themeIcon.innerText = isDark ? '☀️' : '🌙';
};

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeIcon.innerText = isDark ? '☀️' : '🌙';
});

applyTheme();

// 2. Nastavení Transformers.js pro práci v PWA
env.allowLocalModels = false;
env.useBrowserCache = true; // Toto vynutí interní cache Transformers.js

let generator = null;

async function runAgent() {
    const status = document.getElementById('status');
    const responseText = document.getElementById('response-text');
    const input = document.getElementById('user-input');
    
    if (!input.value.trim()) return;

    try {
        status.innerText = "⏳ Načítám Wasm model do cache...";
        
        if (!generator) {
            // Používáme SmolLM2 - vejde se do cache a je rychlý
            generator = await pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX', {
                device: 'webgpu',
                dtype: 'q4'
            });
        }

        status.innerText = "🧠 Výpočet probíhá v prohlížeči (Wasm)...";
        
        const output = await generator(input.value, { 
            max_new_tokens: 64,
            temperature: 0.5 
        });

        status.innerText = "✨ Hotovo";
        document.getElementById('result-area').classList.remove('hidden');
        responseText.innerText = output[0].generated_text;

    } catch (err) {
        console.error("Wasm Error:", err);
        status.innerText = "❌ Chyba WebGPU/Wasm";
    }
}

document.getElementById('send-btn').addEventListener('click', runAgent);
