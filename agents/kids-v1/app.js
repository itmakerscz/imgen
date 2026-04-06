import { createApp, ref, onMounted, nextTick } from 'vue';
import * as webllm from '@mlc-ai/web-llm';
import { modelList } from './models.js'; // Import our new list

createApp({
    setup() {
        const userInput = ref('');
        const chatHistory = ref([]);
        const statusText = ref('Checking hardware...');
        const isEngineReady = ref(false);
        const isLoading = ref(false);
        const isTyping = ref(false);
        const chatWindow = ref(null);
        
        // Logic for model selection
        const availableModels = ref([]);
        const selectedModel = ref('');
        let engine;

        const checkHardwareAndLoadList = async () => {
            let hasF16 = false;

            // 1. Detect WebGPU and shader-f16 support
            if (navigator.gpu) {
                const adapter = await navigator.gpu.requestAdapter();
                if (adapter && adapter.features.has('shader-f16')) {
                    hasF16 = true;
                }
            }

            // 2. Filter list: If browser doesn't have f16, only show non-f16 models
            availableModels.value = modelList.filter(m => !m.requiresF16 || (m.requiresF16 && hasF16));
            
            // 3. Set default selection to the first available model
            if (availableModels.value.length > 0) {
                selectedModel.value = availableModels.value[0].id;
                statusText.value = hasF16 ? "Ready (Full Support)" : "Ready (Compatibility Mode)";
            } else {
                statusText.value = "WebGPU not supported in this browser.";
            }
        };

        onMounted(checkHardwareAndLoadList);

        const initAI = async () => {
            if (isLoading.value) return;
            isLoading.value = true;
            statusText.value = "Downloading model weights...";

            try {
                engine = await webllm.CreateMLCEngine(selectedModel.value, {
                    initProgressCallback: (p) => {
                        statusText.value = `Loading: ${Math.round(p.progress * 100)}%`;
                    }
                });
                statusText.value = "✅ Buddy is Online!";
                isEngineReady.value = true;
            } catch (err) {
                statusText.value = "❌ Error loading model.";
                console.error(err);
            } finally {
                isLoading.value = false;
            }
        };

        const sendMessage = async () => {
            if (!userInput.value.trim() || !isEngineReady.value) return;
            const text = userInput.value;
            chatHistory.value.push({ role: 'user', content: text });
            userInput.value = '';
            isTyping.value = true;

            try {
                const result = await engine.chat.completions.create({
                    messages: [{ role: "system", content: "You are a safe AI for kids." }, ...chatHistory.value]
                });
                chatHistory.value.push(result.choices[0].message);
            } catch (e) {
                chatHistory.value.push({ role: 'assistant', content: "I'm tired. Let's try again." });
            } finally {
                isTyping.value = false;
                nextTick(() => chatWindow.value.scrollTop = chatWindow.value.scrollHeight);
            }
        };

        return { 
            userInput, chatHistory, statusText, isEngineReady, 
            isLoading, isTyping, availableModels, selectedModel, 
            initAI, sendMessage, chatWindow 
        };
    }
}).mount('#app');
