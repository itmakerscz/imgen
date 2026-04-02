# 🤖 Robotizujto AI Agent (Wasm + PWA)

Tento projekt je progresivní webová aplikace (**PWA**), která využívá **WebAssembly (Wasm)** a **WebGPU** ke spouštění velkých jazykových modelů (LLM) přímo v prohlížeči. Celá umělá inteligence běží lokálně na zařízení uživatele – data nikdy neopouštějí prohlížeč.

## 🚀 Klíčové vlastnosti

* **100% Offline provoz:** Díky Service Workeru a Cache API se model po prvním stažení uloží do prohlížeče.
* **Hardware Acceleration:** Využívá **WebGPU** pro bleskovou odezvu AI pomocí grafické karty.
* **Ochrana soukromí:** Žádné API klíče, žádné odesílání dat na servery třetích stran.
* **Robotizujto Context:** Agent je instruován specifickými daty z portálu [Robotizujto.cz](https://robotizujto.cz).
* **Instalovatelnost:** Funguje jako nativní aplikace na Androidu, iOS, Windows i macOS.

## 🛠️ Použité technologie

* **Transformers.js (v3):** Knihovna pro běh ONNX modelů v prohlížeči.
* **Model:** `SmolLM2-135M-Instruct` (kvantizace q4) – optimalizováno pro rychlost a nízkou paměťovou náročnost.
* **Tailwind CSS:** Pro moderní a responzivní Glassmorphic design.
* **PWA (Service Workers & Manifest):** Pro offline přístup a instalaci na plochu.

## 📦 Instalace a spuštění

1.  **Klonování repozitáře:**
    ```bash
    git clone [https://github.com/itmakerscz/robotizujto-ai-wasm.git](https://github.com/itmakerscz/robotizujto-ai-wasm.git)
    cd robotizujto-ai-wasm
    ```

2.  **Spuštění lokálního serveru:**
    Pro správnou funkci Service Workeru a WebGPU musí aplikace běžet přes HTTP server. Použijte například:
    ```bash
    # Python
    python3 -m http.server 8000
    
    # Node.js (npx)
    npx serve .
    ```

3.  **První spuštění:**
    Při prvním kliknutí na tlačítko "Spustit" aplikace stáhne cca **130 MB** dat modelu. Průběh můžete sledovat v konzoli vývojářských nástrojů (F12).

## 📂 Struktura souborů

* `index.html` - UI aplikace a základní struktura.
* `app.js` - Hlavní logika AI agenta a registrace PWA.
* `sw.js` - Service Worker zajišťující inteligentní cachování modelu.
* `data.js` - Znalostní báze (tahák) pro agenta.
* `manifest.json` - Definice PWA aplikace pro instalaci.

## ⚠️ Požadavky

* **Prohlížeč:** Chrome 113+, Edge 113+ nebo jiný prohlížeč s podporou **WebGPU**.
* **HTTPS:** Pro nasazení v ostrém provozu je vyžadován protokol HTTPS (GitHub Pages jej poskytuje automaticky).

---
Vytvořeno pro projekt **[Robotizujto.cz](https://robotizujto.cz)** – automatizace bez hranic.
