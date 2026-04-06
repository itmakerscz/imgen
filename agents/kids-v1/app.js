import { createApp, ref, onMounted, nextTick, computed } from 'vue';
import * as webllm from '@mlc-ai/web-llm';
import { modelList } from './models.js';

createApp({
    setup() {
        const userInput = ref('');
        const chatHistory = ref([]);
        const statusText = ref('Initializing safety protocols...');
        const isEngineReady = ref(false);
        const isLoading = ref(false);
        const isTyping = ref(false);
        const chatWindow = ref(null);
        
        const availableModels = ref([]);
        const selectedModel = ref('');
        let engine;

        // LAYER 1: Enhanced System Prompt
        const SYSTEM_PROMPT = `
            ROLE: You are "SafeBuddy", a joyful AI for kids (ages 0-10). 
            TONE: Warm, encouraging, and visual. Use 2-3 emojis per message.
            CONSTRAINTS: 
            - Max 35 words per response.
            - Focus ONLY on: animals, space, science, kindness, and play.
            - If a user mentions anything scary, violent, or adult, say: "That's not a happy thought! Let's talk about something fun like bubbles or stars! ✨"
        `;

        // LAYER 2: Safety Guardrails
        const BANNED_WORDS = ['scary', 'blood', 'fight', 'weapon', 'stupid', 'hate', 'kill', 'death'];
        
        const REFUSALS = [
            "Oh! I like to keep our chats happy and safe. Let's talk about something nice, like drawing! 🎨",
            "That doesn't sound like a fun game! Let's talk about dinosaurs instead! 🦖",
            "I only like to talk about happy things! Want to hear a joke? 🌟"
        ];

        const checkContent = (text) => {
            const lowerText = text.toLowerCase();
            return !BANNED_WORDS.some(word => lowerText.includes(word));
        };

        const scrollToBottom = async () => {
            await nextTick();
            if (chatWindow.value) {
                chatWindow.value.scrollTo({
                    top: chatWindow.value.scrollHeight,
                    behavior: 'smooth'
                });
            }
        };

        onMounted(async () => {
            let hasF16 = false;
            try {
                const adapter = await navigator.gpu?.requestAdapter();
                hasF16 = adapter?.features.has('shader-f16');
            } catch (e) { console.warn("WebGPU not fully supported"); }

            availableModels.value = modelList.filter(m => !m.requiresF16 || (m.requiresF16 && hasF16));
            if (availableModels.value.length > 0) {
                selectedModel.value = availableModels.value[0].id;
                statusText.value = "Safety guards active. Ready!";
            }
        });

        const initAI = async () => {
            isLoading.value = true;
            try {
                engine = await webllm.CreateMLCEngine(selectedModel.value, {
                    initProgressCallback: (p) => {
                        statusText.value = `Loading Buddy: ${Math.round(p.progress * 100)}%`;
                    }
                });
                statusText.value = "✅ Buddy is Online!";
                isEngineReady.value = true;
            } catch (err) {
                statusText.value = "❌ Oh no! I couldn't wake up.";
                console.error(err);
            } finally {
                isLoading.value = false;
            }
        };

        const sendMessage = async () => {
            const text = userInput.value.trim();
            if (!text || !isEngineReady.value || isTyping.value) return;

            // 1. Input Scrubbing
            if (!checkContent(text)) {
                chatHistory.value.push({ role: 'user', content: text });
                const randomReply = REFUSALS[Math.floor(Math.random() * REFUSALS.length)];
                chatHistory.value.push({ role: 'assistant', content: randomReply });
                userInput.value = '';
                scrollToBottom();
                return;
            }

            chatHistory.value.push({ role: 'user', content: text });
            userInput.value = '';
            isTyping.value = true;
            scrollToBottom();

            try {
                // 2. Memory Management: Only send last 5 messages to keep context window clean
                const context = chatHistory.value.slice(-5);
                const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...context];
                
                const result = await engine.chat.completions.create({ messages });
                const aiResponse = result.choices[0].message;

                // 3. Output Scrubbing: Check AI response safety
                if (checkContent(aiResponse.content)) {
                    chatHistory.value.push(aiResponse);
                } else {
                    chatHistory.value.push({ role: 'assistant', content: "Let's think of something else happy to talk about! 🌈" });
                }
            } catch (e) {
                chatHistory.value.push({ role: 'assistant', content: "My brain got a little dizzy! Can you say that again? 💫" });
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
