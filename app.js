import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';

// --- 1. Témata (Dark Mode) ---
const themeToggle = document.getElementById('theme-toggle');

function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-icon').innerText = '☀️';
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('theme-icon').innerText = '🌙';
    }
}

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-icon').innerText = isDark ? '☀️' : '🌙';
});

applyTheme();

// --- 2. AI Agent s vynucenou kvantizací ---
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
    status.innerText = "⏳ Inicializace optimalizovaného Wasm (q4)...";

    try {
        if (!agentPipe) {
            // Změna na ONNX specifický model s vynuceným dtype q4
            agentPipe = await pipeline('text-generation', 'onnx-community/Llama-3.2-1B-Instruct-ONNX', { 
                device: 'webgpu',
                dtype: 'q4', // Tímto zmizí chyba dtype fp32 a Error 10589288
            });
        }

        status.innerText = "🧠 Agent přemýšlí...";
        
        // Použití chat template pro Llama 3.2
        const messages = [
            { role: "system", content: "Jsi český speciální agent. Piš stručně." },
            { role: "user", content: queryInput.value }
        ];
        
        const output = await agentPipe(messages, { 
            max_new_tokens: 128,
            temperature: 0.7,
            do_sample: true
        });

        status.innerText = "✨ Hotovo";
        resultBox.classList.remove('hidden');
        resSummary.innerText = output[0].generated_text[output[0].generated_text.length - 1].content;

    } catch (err) {
        console.error("Agent Error Details:", err);
        status.innerText = "❌ Kritická chyba paměti GPU";
        alert("Vaše GPU odmítlo model. Zkuste: \n1. Zavřít ostatní okna prohlížeče.\n2. Aktualizovat ovladače grafiky.\n3. Pokud jste v WSL, spusťte prohlížeč přímo ve Windows.");
    } finally {
        btn.disabled = false;
    }
}

document.getElementById('run-btn').addEventListener('click', runAgent);
