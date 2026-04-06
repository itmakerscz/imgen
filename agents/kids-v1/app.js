import { createApp, ref, onMounted, nextTick } from 'vue';
import * as webllm from '@mlc-ai/web-llm';
import { modelList } from './models.js';

createApp({
    setup() {
        const userInput = ref('');
        const chatHistory = ref([]);
        const statusText = ref('Checking your computer...');
        const isEngineReady = ref(false);
        const isLoading = ref(false);
        const isTyping = ref(false);
        const chatWindow = ref(null);
        
        const availableModels = ref([]);
        const selectedModel = ref('');
        let engine;

        // The "Big Restriction" for Kid Safety
        const SYSTEM_PROMPT = `
            You are SafeBuddy, a kind AI for children. 
            - Keep answers under 3 sentences. 
            - Use simple words for an 8-year-old. 
            - Never discuss violence, horror, or adult themes. 
            - If asked for something inappropriate, say: "I only talk about fun things like animals and stars!"
        `;

        // 1. Hardware Detection & Filter
        onMounted(async () => {
            let hasF16 = false;
            try {
                if (navigator.gpu) {
                    const adapter = await navigator.gpu.requestAdapter();
                    if (adapter && adapter.features.has('shader-f16')) {
                        hasF16 = true;
                    }
                }
            } catch (e) { console.warn("WebGPU Detection failed"); }

            availableModels.value = modelList.filter(m => !m.requiresF16 || (m.requiresF16 && hasF16));
            
            if (availableModels.value.length > 0) {
                selectedModel.value = availableModels.value[0].id;
                statusText.value = "Hardware ready. Pick a brain!";
            } else {
                statusText.value = "❌ WebGPU not supported on this device.";
            }
        });

        // 2. Initialize AI Engine
        const initAI = async () => {
            isLoading.value = true;
            statusText.value = "Downloading (this takes a moment)...";

            try {
                engine = await webllm.CreateMLCEngine(selectedModel.value, {
                    initProgressCallback: (p) => {
                        statusText.value = `Downloading: ${Math.round(p.progress * 100)}%`;
                    }
                });
                statusText.value = "✅ Buddy is Online!";
                isEngineReady.value = true;
            } catch (err) {
                statusText.value = "❌ Load Error. Try a different browser.";
                console.error(err);
            } finally {
                isLoading.value = false;
            }
        };

        // 3. Message Logic
        const sendMessage = async () => {
            if (!userInput.value.trim() || !isEngineReady.value) return;

            const text = userInput.value;
            chatHistory.value.push({ role: 'user', content: text });
            userInput.value = '';
            isTyping.value = true;
            
            await scrollDown();

            try {
                const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...chatHistory.value];
                const result = await engine.chat.completions.create({ messages });
                chatHistory.value.push(result.choices[0].message);
            } catch (e) {
                chatHistory.value.push({ role: 'assistant', content: "I'm a bit sleepy. Let's try again!" });
            } finally {
                isTyping.value = false;
                await scrollDown();
            }
        };

        // Fix for the _withKeys Error
        const handleKeyup = (e) => { if (e.key === 'Enter') sendMessage(); };

        const scrollDown = async () => {
            await nextTick();
            if (chatWindow.value) chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
        };

        return { 
            userInput, chatHistory, statusText, isEngineReady, 
            isLoading, isTyping, availableModels, selectedModel, 
            initAI, sendMessage, handleKeyup, chatWindow 
        };
    }
}).mount('#app');
