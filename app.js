import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';

// --- 1. Téma (Jednoduše) ---
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeIcon.innerText = isDark ? '☀️' : '🌙';
});

if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
    themeIcon.innerText = '☀️';
}

// --- 2. Agent (Stabilní) ---
let agentPipe = null;

async function runAgent() {
    const queryInput = document.getElementById('query');
    const status = document.getElementById('status');
    const resultBox = document.getElementById('result-box');
    const resSummary = document.getElementById('res-summary');
    const btn = document.getElementById('run-btn');

    if (!queryInput.value.trim()) return;

    btn.disabled = true;
    resultBox.classList.add('hidden');
    status.innerText = "⏳ Hledám GPU (WebGPU)...";

    try {
        if (!agentPipe) {
            // Použijeme TinyLlama-q4 jako nejmenší stabilní jednotku
            agentPipe = await pipeline('text-generation', 'onnx-community/TinyLlama-1.1B-Chat-v1.0-ONNX', { 
                device: 'webgpu'
            });
        }

        status.innerText = "🧠 Agent pracuje...";
        
        const output = await agentPipe(queryInput.value, { 
            max_new_tokens: 50,
            temperature: 0.7
        });

        status.innerText = "✨ Hotovo";
        resultBox.classList.remove('hidden');
        resSummary.innerText = output[0].generated_text;

    } catch (err) {
        console.error("DEBUG ERROR:", err);
        status.innerText = "❌ WebGPU Backend nenalezen";
        alert("Chyba: Prohlížeč nevidí vaši grafickou kartu přes WebGPU.");
    } finally {
        btn.disabled = false;
    }
}

document.getElementById('run-btn').addEventListener('click', runAgent);
