import { createApp, ref, onMounted, nextTick } from 'vue';
import * as webllm from '@mlc-ai/web-llm';

createApp({
    setup() {
        const userInput = ref('');
        const chatHistory = ref([]);
        const statusText = ref('Waking up Buddy...');
        const isEngineReady = ref(false);
        const isTyping = ref(false);
        const chatWindow = ref(null);
        let engine;

        const SYSTEM_RULES = "You are SafeBuddy, a kind AI for kids. Short, happy, and safe answers only.";

        onMounted(async () => {
            try {
                // This specific version (q4f32) avoids the ShaderF16 error!
                const modelId = "SmolLM2-135M-Instruct-q4f32_1-MLC";
                
                engine = await webllm.CreateMLCEngine(modelId, {
                    initProgressCallback: (p) => {
                        statusText.value = `Loading Buddy: ${Math.round(p.progress * 100)}%`;
                    }
                });
        
                statusText.value = "✅ Ready to play!";
                isEngineReady.value = true;
            } catch (err) {
                if (err.message.includes("shader-f16")) {
                    statusText.value = "❌ This browser doesn't support f16 math. Try updating Chrome.";
                } else {
                    statusText.value = "❌ Connection Error. Please refresh.";
                }
                console.error("AI Error:", err);
            }
        });

        const handleSend = async () => {
            if (!userInput.value.trim() || !isEngineReady.value) return;

            const text = userInput.value;
            chatHistory.value.push({ role: 'user', content: text });
            userInput.value = '';
            isTyping.value = true;

            try {
                const result = await engine.chat.completions.create({
                    messages: [{ role: "system", content: SYSTEM_RULES }, ...chatHistory.value],
                    temperature: 0.2, // Lower is "safer" and more consistent
                });
                chatHistory.value.push(result.choices[0].message);
            } catch (e) {
                chatHistory.value.push({ role: 'assistant', content: "My thinking cap fell off! Let's try again." });
            } finally {
                isTyping.value = false;
                nextTick(() => chatWindow.value.scrollTop = chatWindow.value.scrollHeight);
            }
        };

        return { userInput, chatHistory, statusText, isEngineReady, isTyping, handleSend, chatWindow };
    }
}).mount('#app');
