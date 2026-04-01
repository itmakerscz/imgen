import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';

// --- 1. Téma (Dark Mode) ---
const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

// Registrace kliknutí na téma (místo onclick v HTML)
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

if (localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
}

// --- 2. AI Agent Logic ---
let agentPipe = null;

async function runAgent() {
    const queryInput = document.getElementById('query');
    const status = document.getElementById('status');
    const resultDiv = document.getElementById('result');
    const btn = document.getElementById('run-btn');

    if (!queryInput.value) return;

    btn.disabled = true;
    status.innerText = "🌀 Inicializace WebGPU (může trvat)...";

    try {
        if (!agentPipe) {
            // Používáme velmi lehký model pro mobilní testování
            agentPipe = await pipeline('text-generation', 'onnx-community/Llama-3.2-1B-Instruct', { 
                device: 'webgpu' 
            });
        }

        status.innerText = "🧠 Agent přemýšlí...";
        
        const prompt = `<|system|>Jsi speciální agent v češtině. Analyzuj: <|user|>${queryInput.value}<|end|><|assistant|>`;
        
        const output = await agentPipe(prompt, { 
            max_new_tokens: 100,
            temperature: 0.7 
        });

        // Vyčištění výstupu
        const fullText = output[0].generated_text;
        const generatedText = fullText.includes('<|assistant|>') 
            ? fullText.split('<|assistant|>')[1] 
            : fullText;

        // Zobrazení výsledků
        status.innerText = "✨ Hotovo";
        resultDiv.classList.remove('hidden');
        document.getElementById('res-title').innerText = "Meta-Report";
        document.getElementById('res-summary').innerText = generatedText.trim();
        document.getElementById('res-meta').innerText = `Engine: Wasm-v3 | Device: WebGPU | Lang: CS`;

    } catch (err) {
        status.innerText = "❌ Chyba: " + err.message;
        console.error("Agent Error:", err);
    } finally {
        btn.disabled = false;
    }
}

// EXPORT DO GLOBÁLNÍHO OKNA (Řeší chybu undefined)
window.runAgent = runAgent;
document.getElementById('run-btn').addEventListener('click', runAgent);
