const { createApp, ref, onMounted, nextTick } = Vue;

createApp({
    setup() {
        const userInput = ref('');
        const chatHistory = ref([]);
        const statusText = ref('Checking your browser...');
        const isLoading = ref(true);
        const isEngineReady = ref(false);
        const isTyping = ref(false);
        const chatWindow = ref(null);

        let engine;

        // CRITICAL SAFETY PROMPT
        const SYSTEM_RULES = `
            You are "SafeBuddy", a helpful AI for kids. 
            RESTRICTIONS:
            - Never use bad language or discuss scary/adult themes.
            - If asked for something unsafe, say: "I'm sorry, I'm only allowed to talk about fun and safe things! Want to hear a space fact?"
            - Keep answers short and easy to read.
            - Focus on learning, kindness, and creativity.
        `;

        const scrollToBottom = async () => {
            await nextTick();
            if (chatWindow.value) {
                chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
            }
        };

        onMounted(async () => {
            try {
                // Initialize the WebLLM engine with a small, safe model
                engine = await webllm.CreateMLCEngine("Gemma-2b-it-q4f16_1-MLC", {
                    initProgressCallback: (report) => {
                        statusText.value = `Loading Buddy: ${Math.round(report.progress * 100)}%`;
                    }
                });
                
                statusText.value = "Buddy is ready to play!";
                isLoading.value = false;
                isEngineReady.value = true;
            } catch (err) {
                statusText.value = "Error: WebGPU not supported in this browser.";
                console.error(err);
            }
        });

        const handleSend = async () => {
            if (!userInput.value.trim() || isLoading.value) return;

            const text = userInput.value;
            chatHistory.value.push({ role: 'user', content: text });
            userInput.value = '';
            isTyping.value = true;
            await scrollToBottom();

            try {
                const messages = [
                    { role: "system", content: SYSTEM_RULES },
                    ...chatHistory.value
                ];

                const chunks = await engine.chat.completions.create({ messages });
                const reply = chunks.choices[0].message.content;
                
                chatHistory.value.push({ role: 'assistant', content: reply });
            } catch (error) {
                chatHistory.value.push({ role: 'assistant', content: "Oops, something went wrong. Let's try again!" });
            } finally {
                isTyping.value = false;
                await scrollToBottom();
            }
        };

        return {
            userInput, chatHistory, statusText, 
            isLoading, isEngineReady, isTyping,
            handleSend, chatWindow
        };
    }
}).mount('#app');
