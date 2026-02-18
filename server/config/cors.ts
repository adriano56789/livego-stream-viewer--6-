// Configurações do CORS para diferentes ambientes
interface CorsConfig {
  origin: string[];
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  optionsSuccessStatus: number;
}

interface CorsEnvironments {
  development: CorsConfig;
  production: CorsConfig;
}

const corsConfig: CorsEnvironments = {
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
const getCorsConfig = (): CorsConfig => {
  return process.env.NODE_ENV === 'production' 
    ? corsConfig.production 
    : corsConfig.development;
};

export default getCorsConfig();