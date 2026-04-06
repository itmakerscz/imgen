import { createApp, ref, onMounted, nextTick } from 'vue';
import * as webllm from '@mlc-ai/web-llm';

createApp({
    setup() {
        const userInput = ref('');
        const chatHistory = ref([]);
        const statusText = ref('Initializing...');
        const isEngineReady = ref(false);
        const isTyping = ref(false);
        const chatWindow = ref(null);
        let engine;

        const SYSTEM_RULES = "You are a kind AI for kids. Use very simple words. Never mention violence or scary things. If asked for anything bad, say: 'I only talk about happy things!'";

        onMounted(async () => {
            try {
                // SmolLM is the safest, smallest model for low-end hardware/WASM
                const modelId = "SmolLM2-135M-Instruct-q4f16_1-MLC";
                
                engine = await webllm.CreateMLCEngine(modelId, {
                    initProgressCallback: (p) => {
                        statusText.value = `Loading Buddy: ${Math.round(p.progress * 100)}%`;
                    }
                });

                statusText.value = "✅ Ready to play!";
                isEngineReady.value = true;
            } catch (err) {
                statusText.value = "❌ Hardware Error. Try Chrome.";
                console.error(err);
            }
        });

        const handleSend = async () => {
            if (!userInput.value.trim()) return;
            const text = userInput.value;
            chatHistory.value.push({ role: 'user', content: text });
            userInput.value = '';
            isTyping.value = true;

            try {
                const result = await engine.chat.completions.create({
                    messages: [
                        { role: "system", content: SYSTEM_RULES },
                        ...chatHistory.value
                    ]
                });
                chatHistory.value.push(result.choices[0].message);
            } catch (e) {
                chatHistory.value.push({ role: 'assistant', content: "My brain is tired. Can we try again?" });
            } finally {
                isTyping.value = false;
                nextTick(() => chatWindow.value.scrollTop = chatWindow.value.scrollHeight);
            }
        };

        return { userInput, chatHistory, statusText, isEngineReady, isTyping, handleSend, chatWindow };
    }
}).mount('#app');
