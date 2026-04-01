import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';

// --- 1. Oprava Témat (Dark/Light) ---
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && systemDark);

    document.documentElement.classList.toggle('dark', isDark);
    themeIcon.innerText = isDark ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeIcon.innerText = isDark ? '☀️' : '🌙';
});

applyTheme();

// --- 2. Stabilní AI Agent s CPU Fallbackem ---
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
    status.innerText = "⏳ Inicializace agenta...";

    try {
        if (!agentPipe) {
            try {
                status.innerText = "🌀 Zkouším WebGPU akceleraci...";
                agentPipe = await pipeline('text-generation', 'onnx-community/Llama-3.2-1B-Instruct-ONNX', { 
                    device: 'webgpu',
                    dtype: 'q4' 
                });
            } catch (gpuError) {
                console.warn("WebGPU selhalo (Error 11094288), přepínám na CPU...", gpuError);
                status.innerText = "⚠️ GPU nedostupné, přepínám na CPU (bude to pomalejší)...";
                
                agentPipe = await pipeline('text-generation', 'onnx-community/Llama-3.2-1B-Instruct-ONNX', { 
                    device: 'cpu', // Záchranný režim
                    dtype: 'q4' 
                });
            }
        }

        status.innerText = "🧠 Agent přemýšlí...";
        
        const messages = [
            { role: "system", content: "Jsi český speciální agent. Piš stručně." },
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
        
        // Info o tom, na čem to reálně běželo
        const deviceUsed = agentPipe.model.device;
        document.getElementById('res-meta').innerText = `Engine: Wasm | Device: ${deviceUsed.toUpperCase()} | Model: Llama-3.2-1B-q4`;

    } catch (err) {
        console.error("Kritická chyba:", err);
        status.innerText = "❌ Systémová chyba";
        alert("Model se nepodařilo načíst ani na CPU. Zkuste obnovit stránku (F5).");
    } finally {
        btn.disabled = false;
    }
}

document.getElementById('run-btn').addEventListener('click', runAgent);
