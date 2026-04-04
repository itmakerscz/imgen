// db.js - Používáme Dexie pro jednoduchou práci s IndexedDB
import Dexie from 'https://unpkg.com/dexie/dist/dexie.mjs';

export const db = new Dexie('NevimtoDB');

// Definice tabulek: 
// chats: id, název, historie zpráv
// sources: id, chatId, název, obsah (anglická data)
db.version(1).stores({
    chats: '++id, title, createdAt',
    sources: '++id, chatId, name'
});
