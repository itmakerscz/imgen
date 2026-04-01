import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';

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

// --- 2. Agent s modelem bez externích dat ---
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
    status.innerText = "⏳ Načítám AI model (cca 350MB)...";

    try {
        if (!agentPipe) {
            // Qwen2.5-0.5B je "vše v jednom" a funguje skvěle na WebGPU
            //agentPipe = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct-ONNX', { 
            //    device: 'webgpu',
            //    dtype: 'q4' // Důležité pro snížení paměti
            //});
            agentPipe = await pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX', { 
                device: 'webgpu',
                dtype: 'q4' 
            });
        }

        status.innerText = "🧠 Agent generuje odpověď...";
        
        const messages = [
            { role: "system", content: "Jsi užitečný český asistent." },
            { role: "user", content: queryInput.value }
        ];

        const output = await agentPipe(messages, { 
            max_new_tokens: 100,
            temperature: 0.7
        });

        const answer = output[0].generated_text[output[0].generated_text.length - 1].content;

        status.innerText = "✨ Hotovo";
        resultBox.classList.remove('hidden');
        resSummary.innerText = answer;
        document.getElementById('res-meta').innerText = "Model: Qwen2.5-0.5B-q4 | Device: WebGPU";

    } catch (err) {
        console.error("DEBUG ERROR:", err);
        status.innerText = "❌ Chyba načítání modelu";
        alert("Chyba: Model je příliš velký nebo WebGPU selhalo. Zkuste obnovit stránku.");
    } finally {
        btn.disabled = false;
    }
}

document.getElementById('run-btn').addEventListener('click', runAgent);
