// models.js - The AI Model Database
export const modelList = [
    {
        id: "SmolLM2-360M-Instruct-q4f32_1-MLC",
        name: "SmolLM2 360M (Fastest)",
        requiresF16: false,
        description: "Small, very fast, works on almost all computers."
    },
    {
        id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
        name: "Llama 3.2 1B (Smartest)",
        requiresF16: false,
        description: "Higher quality answers, requires more RAM."
    },
    {
        id: "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
        name: "Qwen 2.5 0.5B (Balanced)",
        requiresF16: false,
        description: "Balanced speed and intelligence."
    },
    {
        id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
        name: "Llama 3.2 1B (Modern GPUs)",
        requiresF16: true,
        description: "Requires modern GPU with shader-f16 support."
    }
];
