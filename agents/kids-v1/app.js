// Import from the aliases defined in the Import Map
import { createApp, ref, onMounted, nextTick } from 'vue';
import * as webllm from '@mlc-ai/web-llm';

createApp({
    setup() {
        const userInput = ref('');
        const chatHistory = ref([]);
        const statusText = ref('Connecting to AI...');
        const isEngineReady = ref(false);
        const isTyping = ref(false);
        const chatWindow = ref(null);
        let engine;

        // Safety Instructions
        const SYSTEM_PROMPT = "You are a safe AI for kids. Short, happy answers only. No scary stuff.";

        onMounted(async () => {
            try {
                // Use a very tiny model to avoid GPU memory errors
                const modelId = "SmolLM2-360M-Instruct-q4f16_1-MLC";
                
                engine = await webllm.CreateMLCEngine(modelId, {
                    initProgressCallback: (p) => {
                        statusText.value = `Downloading Buddy: ${Math.round(p.progress * 100)}%`;
                    }
                });
                statusText.value = "✅ Ready!";
                isEngineReady.value = true;
            } catch (err) {
                statusText.value = "❌ Error: Use Chrome or Edge.";
                console.error(err);
            }
        });

        const handleSend = async () => {
            if (!userInput.value.trim() || !isEngineReady.value) return;

            const userText = userInput.value;
            chatHistory.value.push({ role: 'user', content: userText });
            userInput.value = '';
            isTyping.value = true;

            try {
                const result = await engine.chat.completions.create({
                    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...chatHistory.value]
                });
                chatHistory.value.push(result.choices[0].message);
            } catch (e) {
                chatHistory.value.push({ role: 'assistant', content: "My brain is sleepy. Let's try again!" });
            } finally {
                isTyping.value = false;
                nextTick(() => chatWindow.value.scrollTop = chatWindow.value.scrollHeight);
            }
        };

        return { userInput, chatHistory, statusText, isEngineReady, isTyping, handleSend, chatWindow };
    }
}).mount('#app');
