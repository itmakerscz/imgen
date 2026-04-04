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

        let engine;

        const loadDashboard = async () => {
            activeChatId.value = null;
            chats.value = await db.chats.orderBy('createdAt').reverse().toArray();
        };

        const startNewAgent = async () => {
            const name = prompt("Enter Agent Name:");
            if (!name) return;
            const id = await db.chats.add({ 
                agentName: name, 
                createdAt: new Date(), 
                history: [{ role: 'assistant', content: `Hello, I am ${name}. How can I assist you?` }] 
            });
            openChat(id);
        };

        const openChat = async (id) => {
            const chat = await db.chats.get(id);
            activeChatId.value = id;
            messages.value = chat.history;
            sources.value = await db.sources.where({ chatId: id }).toArray();
            if (!engine) initLLM();
            nextTick(scrollChat);
        };

        const initLLM = async () => {
            engine = new webllm.MLCEngine();
            engine.setInitProgressCallback((report) => {
                loading.value = true;
                progress.value = Math.round(report.progress * 100);
                if (report.progress === 1) {
                    loading.value = false;
                    isReady.value = true;
                }
            });
            await engine.reload("SmolLM2-135M-Instruct-q4f16_1-MLC");
        };

        const addKnowledge = async () => {
            const title = prompt("Knowledge Title (e.g. Project Docs):");
            const content = prompt("Paste Content (English):");
            if (title && content) {
                await db.sources.add({ chatId: activeChatId.value, title, content });
                sources.value = await db.sources.where({ chatId: activeChatId.value }).toArray();
            }
        };

        const sendMessage = async () => {
            if (!userInput.value.trim()) return;
            const text = userInput.value;
            messages.value.push({ role: 'user', content: text });
            userInput.value = '';
            await scrollChat();

            const context = sources.value.map(s => s.content).join("\n\n");
            
            const response = await engine.chat.completions.create({
                messages: [
                    { role: "system", content: `You are a helpful AI Agent. Context knowledge: ${context}` },
                    ...messages.value
                ],
                temperature: 0.2
            });

            const reply = response.choices[0].message.content;
            messages.value.push({ role: 'assistant', content: reply });
            
            await db.chats.update(activeChatId.value, { history: JSON.parse(JSON.stringify(messages.value)) });
            await scrollChat();
        };

        const scrollChat = () => {
            if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
        };

        onMounted(loadDashboard);

        return { 
            activeChatId, chats, messages, sources, userInput, loading, progress, isReady, chatBox,
            startNewAgent, openChat, addKnowledge, sendMessage, loadDashboard 
        };
    }
}).mount('#app');
