// Theme Logic
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Haptic feedback (if on mobile)
    if (window.navigator.vibrate) window.navigator.vibrate(10);
}

// Initialize on load
initTheme();

// Agent Logic (Simplified for Wasm/WebGPU)
async function runResearch() {
    const q = document.getElementById('query').value;
    const status = document.getElementById('status');
    const res = document.getElementById('result');

    status.innerText = "🌀 Přemýšlím...";
    
    // Simulate your Wasm Agent processing
    setTimeout(() => {
        status.innerText = "✨ Hotovo";
        res.classList.remove('hidden');
        document.getElementById('res-title').innerText = "Meta-Analýza: " + q;
        document.getElementById('res-summary').innerText = "Váš agent úspěšně extrahoval data přes Wasm sandbox bez omezení.";
        document.getElementById('res-meta').innerText = "Core: Wasm32 | Mode: Unrestricted | TZ: Europe/Prague";
    }, 1200);
}
