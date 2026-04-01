import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';

// Konfigurace prostředí pro čisté Wasm/WebGPU
env.allowLocalModels = false;
env.backends.onnx.wasm.proxy = true; // Spustí Wasm v samostatném workeru (lepší stabilita)

// --- 1. Oprava Témat ---
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function applyTheme() {
    const isDark = localStorage.getItem('theme') === 'dark' || 
                   (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    themeIcon.innerText = isDark ? '☀️' : '🌙';
}
themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeIcon.innerText = isDark ? '☀️' : '🌙';
});
applyTheme();

// --- 2. Pure Wasm Agent (WebGPU Only) ---
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
    status.innerText = "⚡ Startuji Wasm Engine (WebGPU)...";

    try {
        if (!agentPipe) {
            // Použijeme SmolLM2 - je 5x menší než Llama, projde přes limity bufferu
            agentPipe = await pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX', { 
                device: 'webgpu',
                dtype: 'q4', 
            });
        }

        status.innerText = "🧠 Wasm Agent počítá...";
        
        const output = await agentPipe(queryInput.value, { 
            max_new_tokens: 64,
            temperature: 0.5,
            repetition_penalty: 1.2
        });

        const answer = output[0].generated_text;

        status.innerText = "✨ Hotovo (Wasm)";
        resultBox.classList.remove('hidden');
        resSummary.innerText = answer;
        document.getElementById('res-meta').innerText = `Runtime: Wasm32 | Accel: WebGPU | Model: SmolLM2-135M`;

    } catch (err) {
        console.error("Wasm/WebGPU Error:", err);
        status.innerText = "❌ WebGPU Buffer Limit Error";
        alert("Chyba 11094288: Vaše GPU nepovoluje dostatečně velký Wasm buffer. \n\nZkuste v Chrome zapnout: chrome://flags/#enable-unsafe-webgpu");
    } finally {
        btn.disabled = false;
    }
}

document.getElementById('run-btn').addEventListener('click', runAgent);
