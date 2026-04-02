import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';
import { ROBOTIZUJTO_DATA } from './data.js';

// 1. PWA Registrace a detekce offline stavu
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(() => {
        console.log("PWA: Aktivní");
        if (!navigator.onLine) document.getElementById('pwa-status').innerText = "Offline Mode";
    });
}

// 2. Konfigurace AI (Cache First)
env.allowLocalModels = false;
env.useBrowserCache = true; 

let generator = null;

async function runAgent() {
    const input = document.getElementById('user-input');
    const status = document.getElementById('status');
    const responseText = document.getElementById('response-text');
    const btn = document.getElementById('send-btn');

    if (!input.value.trim()) return;

    btn.disabled = true;
    status.innerText = "⏳ Načítám Wasm model z Cache...";

    try {
        if (!generator) {
            // Používáme SmolLM2 - cca 130MB, ideální pro offline PWA
            generator = await pipeline('text-generation', 'onnx-community/SmolLM2-135M-Instruct-ONNX', {
                device: 'webgpu',
                dtype: 'q4'
            });
        }

        status.innerText = "🧠 Generuji odpověď (lokálně)...";
        
        const prompt = `Jsi expert na Robotizujto.cz. Použij tyto informace: ${ROBOTIZUJTO_DATA}\n\nUživatel: ${input.value}\nOdpověď:`;

        const output = await generator(prompt, { 
            max_new_tokens: 100,
            temperature: 0.3,
            repetition_penalty: 1.2
        });

        const result = output[0].generated_text.split('Odpověď:')[1] || output[0].generated_text;

        status.innerText = "✨ Výsledek z WebAssembly";
        document.getElementById('result-area').classList.remove('hidden');
        responseText.innerText = result.trim();

    } catch (err) {
        console.error(err);
        status.innerText = "❌ Chyba: WebGPU není dostupné";
    } finally {
        btn.disabled = false;
    }
}

document.getElementById('send-btn').addEventListener('click', runAgent);
