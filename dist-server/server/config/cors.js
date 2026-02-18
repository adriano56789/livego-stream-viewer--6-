"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const corsConfig = {
    // Configurações para desenvolvimento local
    development: {
        origin: [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
            'http://72.60.249.175:5173',
            'http://72.60.249.175:3000',
            'https://livego.store'
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
        optionsSuccessStatus: 200
    },
    // Configurações para produção (VPS)
    production: {
        origin: [
            'https://livego.store',
            'http://72.60.249.175:5173',
            'http://72.60.249.175:3000'
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
        optionsSuccessStatus: 200
    }
};
// Exporta a configuração baseada no ambiente
const getCorsConfig = () => {
    return process.env.NODE_ENV === 'production'
        ? corsConfig.production
        : corsConfig.development;
};
exports.default = getCorsConfig();
