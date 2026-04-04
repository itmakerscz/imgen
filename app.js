import * as webllm from "https://esm.run/@mlc-ai/web-llm";
import { db } from './db.js';

const { createApp, ref, onMounted, nextTick } = Vue;

createApp({
    setup() {
        const activeChatId = ref(null);
        const chats = ref([]);
        const messages = ref([]);
        const sources = ref([]);
        const userInput = ref('');
        const loading = ref(false);
        const progress = ref(0);
        const isReady = ref(false);
        const chatBox = ref(null);

        let engine = null;

        // --- NEW MODEL SELECTION ---
        // Hermes-3-Llama-3.2-3B is great for reasoning and following system prompts.
        const MODEL_ID = "Hermes-3-Llama-3.2-3B-q4f16_1-MLC";

        const loadDashboard = async () => {
            activeChatId.value = null;
            chats.value = await db.chats.orderBy('createdAt').reverse().toArray();
        };

        const startNewAgent = async () => {
            const name = prompt("Name your AI Agent:");
            if (!name) return;
            const id = await db.chats.add({ 
                agentName: name, 
                createdAt: new Date(), 
                history: [{ role: 'assistant', content: `Agent ${name} initialized. Ready for instructions.` }] 
            });
            await openChat(id);
        };

        const openChat = async (id) => {
            const chat = await db.chats.get(id);
            if (!chat) return;
            activeChatId.value = id;
            messages.value = chat.history || [];
            sources.value = await db.sources.where({ chatId: id }).toArray();
            
            if (!engine) {
                await initLLM();
            }
        };

        const initLLM = async () => {
            if (engine) return;
            try {
                engine = new webllm.MLCEngine();
                engine.setInitProgressCallback((report) => {
                    loading.value = true;
                    // Smoothing the progress display
                    progress.value = Math.round(report.progress * 100);
                    if (report.progress === 1) {
                        loading.value = false;
                        isReady.value = true;
                    }
                });
                // Loading the specific Hermes model
                await engine.reload(MODEL_ID);
            } catch (err) {
                console.error("WASM/WebGPU Init Error:", err);
                alert("WebGPU failed. Make sure you are using Chrome/Edge and have a compatible GPU.");
            }
        };

        const addKnowledge = async () => {
            if (!activeChatId.value) return;
            const title = prompt("Knowledge Title (e.g., Company Bio):");
            const content = prompt("Paste English Content:");
            if (title && content) {
                await db.sources.add({ 
                    chatId: activeChatId.value, 
                    title: title, 
                    content: content 
                });
                // Refresh local sources state immediately
                sources.value = await db.sources.where({ chatId: activeChatId.value }).toArray();
            }
        };

        const sendMessage = async () => {
            if (!userInput.value.trim() || !isReady.value) return;
            
            const text = userInput.value;
            messages.value.push({ role: 'user', content: text });
            userInput.value = '';
            await nextTick(scrollChat);

            try {
                // Build RAG context from sources
                const context = sources.value.map(s => `SOURCE (${s.title}): ${s.content}`).join("\n\n");
                
                const systemPrompt = { 
                    role: "system", 
                    content: `You are an expert AI agent. Use the provided context to answer the user. If the context doesn't contain the answer, use your general knowledge. CONTEXT:\n${context}` 
                };

                const response = await engine.chat.completions.create({
                    messages: [systemPrompt, ...messages.value],
                    temperature: 0.4, // Slightly higher for better reasoning
                    max_tokens: 512
                });

                const aiReply = response.choices[0].message;
                messages.value.push(aiReply);
                
                // Save updated history back to IndexedDB
                await db.chats.update(activeChatId.value, { 
                    history: JSON.parse(JSON.stringify(messages.value)) 
                });
                await nextTick(scrollChat);
            } catch (err) {
                console.error("Generation Error:", err);
                messages.value.push({ role: 'assistant', content: "Error: Generation failed." });
            }
        };

        const scrollChat = () => {
            if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
        };

        onMounted(() => {
            loadDashboard();
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('./sw.js').catch(() => {});
            }
        });

        return { 
            activeChatId, chats, messages, sources, userInput, loading, 
            progress, isReady, chatBox, startNewAgent, openChat, 
            sendMessage, loadDashboard, addKnowledge 
        };
    }
}).mount('#app');
