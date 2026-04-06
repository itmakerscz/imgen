import { createApp, ref, onMounted, nextTick } from 'vue';
import * as webllm from '@mlc-ai/web-llm';
import { modelList } from './models.js';

createApp({
    setup() {
        const userInput = ref('');
        const chatHistory = ref([]);
        const statusText = ref('Setting up safety guards...');
        const isEngineReady = ref(false);
        const isLoading = ref(false);
        const isTyping = ref(false);
        const chatWindow = ref(null);
        
        const availableModels = ref([]);
        const selectedModel = ref('');
        let engine;

        // LAYER 1: The AI "Personality" Anchor
        const SYSTEM_PROMPT = `
            ROLE: You are "SafeBuddy", a friendly AI companion for kids aged 5-10.
            RULES:
            1. Language: Use simple, encouraging words. No slang or complex jargon.
            2. Content: Strictly focus on educational topics, hobbies, and kindness.
            3. Hard Limit: NEVER discuss violence, weapons, scary stories, or adult themes.
            4. Refusal: If a topic is unsafe, say: "That doesn't sound like a fun game! Let's talk about dinosaurs or outer space instead!"
            5. Length: Keep answers under 40 words.
        `;

        // LAYER 2: Input Scrubber (Preventing bad words/topics)
        const BANNED_WORDS = ['scary', 'blood', 'fight', 'weapon', 'stupid', 'hate']; // Expand this list as needed

        const isContentSafe = (text) => {
            const lowerText = text.toLowerCase();
            return !BANNED_WORDS.some(word => lowerText.includes(word));
        };

        onMounted(async () => {
            // Hardware detection logic from previous step...
            let hasF16 = false;
            try {
                if (navigator.gpu) {
                    const adapter = await navigator.gpu.requestAdapter();
                    hasF16 = adapter?.features.has('shader-f16');
                }
            } catch (e) {}
            availableModels.value = modelList.filter(m => !m.requiresF16 || (m.requiresF16 && hasF16));
            if (availableModels.value.length > 0) {
                selectedModel.value = availableModels.value[0].id;
                statusText.value = "Safety guards active. Ready!";
            }
        });

        const initAI = async () => {
            isLoading.value = true;
            statusText.value = "Downloading Buddy's brain...";
            try {
                engine = await webllm.CreateMLCEngine(selectedModel.value, {
                    initProgressCallback: (p) => {
                        statusText.value = `Loading: ${Math.round(p.progress * 100)}%`;
                    }
                });
                statusText.value = "✅ Buddy is Online!";
                isEngineReady.value = true;
            } catch (err) {
                statusText.value = "❌ Loading failed.";
            } finally {
                isLoading.value = false;
            }
        };

        const sendMessage = async () => {
            const text = userInput.value.trim();
            if (!text || !isEngineReady.value) return;

            // Apply Layer 2 (Local Input Filter)
            if (!isContentSafe(text)) {
                chatHistory.value.push({ role: 'user', content: text });
                chatHistory.value.push({ 
                    role: 'assistant', 
                    content: "Oh! I like to keep our chats happy and safe. Let's talk about something nice, like drawing or kittens!" 
                });
                userInput.value = '';
                return;
            }

            chatHistory.value.push({ role: 'user', content: text });
            userInput.value = '';
            isTyping.value = true;
            await nextTick();
            chatWindow.value.scrollTop = chatWindow.value.scrollHeight;

            try {
                const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...chatHistory.value];
                const result = await engine.chat.completions.create({ messages });
                chatHistory.value.push(result.choices[0].message);
            } catch (e) {
                chatHistory.value.push({ role: 'assistant', content: "My brain is a bit fuzzy! Can we try again?" });
            } finally {
                isTyping.value = false;
                await nextTick();
                chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
            }
        };

        const handleKeyup = (e) => { if (e.key === 'Enter') sendMessage(); };

        return { 
            userInput, chatHistory, statusText, isEngineReady, 
            isLoading, isTyping, availableModels, selectedModel, 
            initAI, sendMessage, handleKeyup, chatWindow 
        };
    }
}).mount('#app');
