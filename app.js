import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';

// --- 1. OPRAVENÁ LOGIKA TÉMAT (DARK MODE) ---
const themeToggle = document.getElementById('theme-toggle');

function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (window.navigator.vibrate) window.navigator.vibrate(5); // Hmatová odezva
});

// Inicializace tématu při startu
applyTheme();

// --- 2. AI AGENT LOGIC (OPRAVA CHYBY 10589288) ---
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
    status.innerText = "⏳ Načítám kvantizovaný model (q4)...";

    try {
        if (!agentPipe) {
            // KLÍČOVÁ OPRAVA: dtype: 'q4' snižuje nároky na VRAM o 75%
            agentPipe = await pipeline('text-generation', 'onnx-community/Llama-3.2-1B-Instruct-ONNX', { 
                device: 'webgpu',
                dtype: 'q4' 
            });
        }

        status.innerText = "🧠 Agent přemýšlí...";
        
        const prompt = `<|system|>Jsi český speciální agent. Odpovídej krátce a věcně.<|end|><|user|>${queryInput.value}<|end|><|assistant|>`;
        
        const output = await agentPipe(prompt, { 
            max_new_tokens: 128,
            temperature: 0.7,
            do_sample: true
        });

        // Extrakce textu za tagem assistant
        const fullText = output[0].generated_text;
        const generatedText = fullText.split('<|assistant|>')[1] || fullText;

        status.innerText = "✨ Hotovo";
        resultBox.classList.remove('hidden');
        resSummary.innerText = generatedText.trim();

    } catch (err) {
        status.innerText = "❌ Chyba paměti nebo WebGPU";
        console.error("Agent Error:", err);
        alert("Chyba: Váš prohlížeč nebo GPU nemá dostatek paměti pro tento model. Zkuste zavřít ostatní taby.");
    } finally {
        btn.disabled = false;
    }
}

// Registrace tlačítka
document.getElementById('run-btn').addEventListener('click', runAgent);
