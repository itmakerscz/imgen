import Dexie from 'assets/dexie.mjs';

export const db = new Dexie('NevimtoDB');
db.version(1).stores({
    chats: '++id, agentName, createdAt',
    sources: '++id, chatId, title'
});
