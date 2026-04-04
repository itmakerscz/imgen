import * as webllm from "https://esm.run/@mlc-ai/web-llm";
import { db } from './db.js';

const { createApp, ref, onMounted, nextTick } = Vue;

createApp({
    setup() {
        const activeChat = ref(null);
        const chatHistory = ref([]);
        const currentSources = ref([]);
        const messages = ref([]);
        const userInput = ref('');
        const isReady = ref(false);
        const loading = ref(false);
        const progress = ref(0);
        
        let engine;

        // Načtení historie z IndexedDB
        const loadHistory = async () => {
            chatHistory.value = await db.chats.orderBy('createdAt').reverse().toArray();
        };

        const createNewChat = async () => {
            const title = prompt("Název chatu:", "Nová automatizace");
            if (!title) return;
            const id = await db.chats.add({ title, createdAt: new Date(), messages: [] });
            loadHistory();
        };

        const loadChat = async (chat) => {
            activeChat.value = chat;
            messages.value = chat.messages || [];
            currentSources.value = await db.sources.where({ chatId: chat.id }).toArray();
            if (!engine) initEngine();
        };

        const addSourcePrompt = async () => {
            const name = prompt("Název zdroje (např. 'Product Specs'):");
            const content = prompt("Obsah dat (v angličtině):");
            if (name && content) {
                await db.sources.add({ chatId: activeChat.value.id, name, content });
                currentSources.value = await db.sources.where({ chatId: activeChat.value.id }).toArray();
            }
        };

        const handleSend = async () => {
            const text = userInput.value;
            messages.value.push({ role: 'user', content: text });
            userInput.value = '';

            // Sestavení kontextu ze všech zdrojů v IndexedDB
            const contextStr = currentSources.value.map(s => s.content).join("\n");

            const response = await engine.chat.completions.create({
                messages: [
                    { role: "system", content: `Context: ${contextStr}. Answer in Czech.` },
                    ...messages.value
                ]
            });

            const aiReply = response.choices[0].message.content;
            messages.value.push({ role: 'ai', content: aiReply });

            // Uložit do DB
            await db.chats.update(activeChat.value.id, { messages: JSON.parse(JSON.stringify(messages.value)) });
        };

        const initEngine = async () => {
            engine = new webllm.MLCEngine();
            engine.setInitProgressCallback((r) => {
                loading.value = true;
                progress.value = Math.round(r.progress * 100);
                if (r.progress === 1) { loading.value = false; isReady.value = true; }
            });
            await engine.reload("SmolLM2-135M-Instruct-q4f16_1-MLC");
        };

        onMounted(loadHistory);

        return { 
            activeChat, chatHistory, currentSources, messages, 
            userInput, isReady, loading, progress, 
            createNewChat, loadChat, addSourcePrompt, handleSend,
            formatDate: (d) => new Date(d).toLocaleDateString()
        };
    }
}).mount('#app');
