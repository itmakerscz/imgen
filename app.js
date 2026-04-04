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

        // Register Service Worker for PWA
        const registerSW = () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('./sw.js').catch(err => console.log("SW failed", err));
            }
        };

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
                history: [{ role: 'assistant', content: `Agent ${name} is online. How can I help?` }] 
            });
            openChat(id);
        };

        const openChat = async (id) => {
            const chat = await db.chats.get(id);
            activeChatId.value = id;
            messages.value = chat.history;
            sources.value = await db.sources.where({ chatId: id }).toArray();
            if (!engine) initLLM();
        };

        const initLLM = async () => {
            // WebLLM uses WebAssembly and WebGPU for execution
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

        const sendMessage = async () => {
            if (!userInput.value.trim()) return;
            const text = userInput.value;
            messages.value.push({ role: 'user', content: text });
            userInput.value = '';

            const context = sources.value.map(s => s.content).join("\n");
            
            const response = await engine.chat.completions.create({
                messages: [
                    { role: "system", content: `Context: ${context}` },
                    ...messages.value
                ],
                temperature: 0.2
            });

            messages.value.push(response.choices[0].message);
            await db.chats.update(activeChatId.value, { history: JSON.parse(JSON.stringify(messages.value)) });
            nextTick(() => chatBox.value.scrollTop = chatBox.value.scrollHeight);
        };

        onMounted(() => {
            registerSW();
            loadDashboard();
        });

        return { activeChatId, chats, messages, sources, userInput, loading, progress, isReady, chatBox, startNewAgent, openChat, sendMessage, loadDashboard };
    }
}).mount('#app');
