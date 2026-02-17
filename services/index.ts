
import http from 'http';
import { mockApiRouter } from '../services/server';

const PORT = 3000;

const server = http.createServer((req, res) => {
    // --- Configuração de CORS (Cross-Origin Resource Sharing) ---
    // Essencial para permitir que o front-end (ex: localhost:5173 ou domínio real) acesse a API
    res.setHeader('Access-Control-Allow-Origin', '*'); // Em produção, substitua '*' pelo domínio do front
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Trata a requisição Preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // --- Coleta do Corpo da Requisição (Body Parsing) ---
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        let parsedBody = null;
        try {
            if (body) {
                parsedBody = JSON.parse(body);
            }
        } catch (error) {
            console.error("Invalid JSON body:", error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Invalid JSON format" }));
            return;
        }

        try {
            // --- Roteamento ---
            // Encaminha a requisição para o roteador principal da aplicação
            const result = await mockApiRouter(req.method || 'GET', req.url || '/', parsedBody);
            
            // Retorna a resposta processada
            res.writeHead(result.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result.data || { error: result.error }));
        } catch (error) {
            console.error("Internal Server Error:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Internal Server Error" }));
        }
    });
});

server.listen(PORT, () => {
    console.log(`╔═══════════════════════════════════════════════════╗`);
    console.log(`║ SERVIDOR LIVEGO RODANDO                           ║`);
    console.log(`╠═══════════════════════════════════════════════════╣`);
    console.log(`║ Porta: ${PORT}                                       ║`);
    console.log(`║ URL:   http://0.0.0.0:${PORT}                       ║`);
    console.log(`║ CORS:  Habilitado (Allow-All)                     ║`);
    console.log(`╚═══════════════════════════════════════════════════╝`);
});
