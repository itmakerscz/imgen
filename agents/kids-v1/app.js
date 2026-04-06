import { createApp, ref, onMounted, nextTick } from 'vue';
import * as webllm from '@mlc-ai/web-llm';
import { modelList } from './models.js';

createApp({
    setup() {
        const userInput = ref('');
        const chatHistory = ref([]);
        const statusText = ref('Checking Hardware...');
        const isEngineReady = ref(false);
        const isLoading = ref(false);
        const isTyping = ref(false);
        const chatWindow = ref(null);
        
        const availableModels = ref([]);
        const selectedModel = ref('');
        let engine;

        // LAYER 1: Personality
        const SYSTEM_PROMPT = `
            ROLE: You are "SafeBuddy", a helpful AI for kids aged 3-10. 
            STYLE: Use simple words and 2 emojis per reply. 
            RULES: Keep responses under 30 words. Focus on kindness, science, and fun facts. 
            REFUSAL: If asked about violence, weapons, or scary things, say: "That's not a fun topic! Let's talk about space or puppies instead! 🐶✨"
        `;

        // LAYER 2: Safety Filters
        const BANNED_WORDS = ['scary', 'blood', 'fight', 'weapon', 'stupid', 'hate', 'kill', 'gun', 'die'];

        const isContentSafe = (text) => {
            const lowerText = text.toLowerCase();
            return !BANNED_WORDS.some(word => lowerText.includes(word));
        };

        const scrollToBottom = async () => {
            await nextTick();
            if (chatWindow.value) {
                chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
            }
        };

        onMounted(async () => {
            let hasF16 = false;
            try {
                if (navigator.gpu) {
                    const adapter = await navigator.gpu.requestAdapter();
                    hasF16 = adapter?.features.has('shader-f16');
                }
            } catch (e) { console.error("GPU check failed", e); }
            
            availableModels.value = modelList.filter(m => !m.requiresF16 || (m.requiresF16 && hasF16));
            if (availableModels.value.length > 0) {
                selectedModel.value = availableModels.value[0].id;
                statusText.value = "Safety guards active. Ready!";
            } else {
                statusText.value = "WebGPU not supported on this browser.";
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
                statusText.value = "Buddy is Online!";
                isEngineReady.value = true;
            } catch (err) {
                statusText.value = "❌ Loading failed.";
                console.error(err);
            } finally {
                isLoading.value = false;
            }
        };

        const sendMessage = async () => {
            const text = userInput.value.trim();
            if (!text || !isEngineReady.value || isTyping.value) return;

            // Input Filter
            if (!isContentSafe(text)) {
                chatHistory.value.push({ role: 'user', content: text });
                chatHistory.value.push({ 
                    role: 'assistant', 
                    content: "I like to talk about happy things! Let's talk about stars or kittens! 🐱⭐" 
                });
                userInput.value = '';
                scrollToBottom();
                return;
            }

            chatHistory.value.push({ role: 'user', content: text });
            userInput.value = '';
            isTyping.value = true;
            scrollToBottom();

            try {
                // Limit context to last 6 messages for performance
                const messages = [
                    { role: "system", content: SYSTEM_PROMPT }, 
                    ...chatHistory.value.slice(-6)
                ];
                
                const result = await engine.chat.completions.create({ messages });
                const aiMsg = result.choices[0].message;

                // Output Filter (Layer 3)
                if (isContentSafe(aiMsg.content)) {
                    chatHistory.value.push(aiMsg);
                } else {
                    chatHistory.value.push({ 
                        role: 'assistant', 
                        content: "Let's talk about something else fun, like drawing! 🎨" 
                    });
                }
            } catch (e) {
                chatHistory.value.push({ role: 'assistant', content: "My brain is a bit fuzzy! Let's try again! 💫" });
            } finally {
                isTyping.value = false;
                scrollToBottom();
            }
        };

        return { 
            userInput, chatHistory, statusText, isEngineReady, 
            isLoading, isTyping, availableModels, selectedModel, 
            initAI, sendMessage, chatWindow 
        };
    }
}).mount('#app');
