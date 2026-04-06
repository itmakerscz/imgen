// models.js
export const modelList = [
    {
        id: "SmolLM2-135M-Instruct-q4f32_1-MLC",
        name: "SmolLM2 135M (Most Compatible)",
        vram: "580MB",
        requiresF16: false,
        category: "Basic"
    },
    {
        id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
        name: "Llama 3.2 1B (Smart - f32)",
        vram: "1.1GB",
        requiresF16: false,
        category: "Advanced"
    },
    {
        id: "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
        name: "Qwen 2.5 0.5B (Fast - f32)",
        vram: "1.0GB",
        requiresF16: false,
        category: "Basic"
    },
    {
        id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
        name: "Llama 3.2 1B (High Performance)",
        vram: "880MB",
        requiresF16: true,
        category: "Advanced"
    },
    {
        id: "SmolLM2-135M-Instruct-q4f16_1-MLC",
        name: "SmolLM2 135M (f16 optimized)",
        vram: "380MB",
        requiresF16: true,
        category: "Basic"
    }
];
