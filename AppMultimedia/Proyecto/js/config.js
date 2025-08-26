// ========================================
//    CONFIGURACIÓN DE APIS MUSICALES
// ========================================

const API_CONFIG = {
    // Last.fm API - Gratuita, requiere registro
    LASTFM: {
        API_KEY: 'TU_API_KEY_AQUI', // Obtener en https://www.last.fm/api
        BASE_URL: 'https://ws.audioscrobbler.com/2.0/',
        ENABLED: false // Cambiar a true cuando tengas la API key
    },

    // Spotify API - Requiere autenticación OAuth
    SPOTIFY: {
        CLIENT_ID: 'TU_CLIENT_ID_AQUI', // Obtener en https://developer.spotify.com/
        CLIENT_SECRET: 'TU_CLIENT_SECRET_AQUI',
        BASE_URL: 'https://api.spotify.com/v1/',
        ENABLED: false // Cambiar a true cuando tengas las credenciales
    },

    // Deezer API - Gratuita, sin clave requerida
    DEEZER: {
        BASE_URL: 'https://api.deezer.com/',
        ENABLED: true // Habilitada por defecto
    },

    // TheAudioDB - Gratuita
    AUDIODB: {
        BASE_URL: 'https://www.theaudiodb.com/api/v1/json/1/',
        ENABLED: true // Habilitada por defecto
    },

    // MusicBrainz - Gratuita, sin clave requerida
    MUSICBRAINZ: {
        BASE_URL: 'https://musicbrainz.org/ws/2/',
        ENABLED: false // Deshabilitada por defecto (puede ser lenta)
    }
};

// ========================================
//    INSTRUCCIONES PARA OBTENER API KEYS
// ========================================

/*
CÓMO OBTENER API KEYS GRATUITAS:

1. LAST.FM API (Recomendado para autocompletado):
   - Ve a: https://www.last.fm/api/account/create
   - Regístrate con tu email
   - Crea una nueva aplicación
   - Copia tu API Key y pégala en LASTFM.API_KEY
   - Cambia LASTFM.ENABLED a true

2. SPOTIFY API (Para funciones avanzadas):
   - Ve a: https://developer.spotify.com/dashboard/
   - Inicia sesión con tu cuenta de Spotify
   - Crea una nueva app
   - Copia Client ID y Client Secret
   - Agrega como Redirect URI: http://localhost:3000/callback
   - Cambia SPOTIFY.ENABLED a true

3. DEEZER API (Ya habilitada):
   - No requiere registro
   - Funciona directamente
   - Limitaciones: CORS puede causar problemas en algunos navegadores
   - Solución: Usar proxy o extensión CORS para desarrollo

4. THEAUDIODB (Ya habilitada):
   - No requiere registro
   - Base de datos completa de música
   - Incluye información adicional como géneros y biografías

CONFIGURACIÓN RECOMENDADA PARA EMPEZAR:
- Deja DEEZER y AUDIODB habilitadas (funcionan sin configuración)
- Obtén una clave de Last.fm para mejores resultados
- Spotify se puede agregar más tarde para funciones avanzadas
*/

// ========================================
//    CONFIGURACIÓN DE PROXY (OPCIONAL)
// ========================================

const PROXY_CONFIG = {
    // Para evitar problemas de CORS en desarrollo
    USE_PROXY: false,
    PROXY_URL: 'https://cors-anywhere.herokuapp.com/', // Proxy público (limitado)
    
    // Proxy local alternativo (requiere configuración)
    LOCAL_PROXY: 'http://localhost:8080/',
    
    // Instrucciones para proxy local:
    // 1. npm install -g cors-anywhere
    // 2. cors-anywhere
    // 3. Cambiar LOCAL_PROXY a true
};

// ========================================
//    LÍMITES DE API
// ========================================

const API_LIMITS = {
    REQUESTS_PER_MINUTE: 30,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutos en millisegundos
    MAX_RESULTS: 10,
    MIN_QUERY_LENGTH: 2,
    SEARCH_DELAY: 300 // millisegundos antes de buscar
};

// ========================================
//    CONFIGURACIÓN DE GÉNEROS
// ========================================

const GENRE_CONFIG = {
    // Mapeo de géneros para normalizar resultados de diferentes APIs
    GENRE_MAPPING: {
        'rock': 'Rock',
        'pop': 'Pop',
        'hip-hop': 'Hip-Hop',
        'hip hop': 'Hip-Hop',
        'rap': 'Hip-Hop',
        'electronic': 'Electronic',
        'dance': 'Electronic',
        'edm': 'Electronic',
        'jazz': 'Jazz',
        'blues': 'Blues',
        'country': 'Country',
        'folk': 'Folk',
        'classical': 'Clásica',
        'reggae': 'Reggae',
        'r&b': 'R&B',
        'rnb': 'R&B',
        'soul': 'R&B',
        'funk': 'Funk',
        'punk': 'Punk',
        'metal': 'Metal',
        'indie': 'Indie',
        'alternative': 'Indie',
        'reggaeton': 'Reggaeton',
        'latin': 'Latin',
        'world': 'World'
    },

    // Géneros por defecto cuando no se puede determinar
    DEFAULT_GENRES: ['Pop', 'Rock', 'Electronic', 'Hip-Hop', 'Indie']
};

// ========================================
//    FUNCIONES DE UTILIDAD PARA APIs
// ========================================

class APIHelper {
    static isEnabled(apiName) {
        return API_CONFIG[apiName] && API_CONFIG[apiName].ENABLED;
    }

    static getApiKey(apiName) {
        return API_CONFIG[apiName] ? API_CONFIG[apiName].API_KEY : null;
    }

    static buildUrl(apiName, endpoint, params = {}) {
        if (!this.isEnabled(apiName)) return null;

        const baseUrl = API_CONFIG[apiName].BASE_URL;
        const queryParams = new URLSearchParams(params);
        return `${baseUrl}${endpoint}?${queryParams.toString()}`;
    }

    static addProxy(url) {
        if (PROXY_CONFIG.USE_PROXY) {
            return `${PROXY_CONFIG.PROXY_URL}${url}`;
        }
        return url;
    }

    static normalizeGenre(genre) {
        if (!genre) return 'Pop';
        
        const normalized = genre.toLowerCase().trim();
        return GENRE_CONFIG.GENRE_MAPPING[normalized] || 
               genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase();
    }

    static formatDuration(seconds) {
        if (!seconds || seconds <= 0) return 3; // Duración por defecto
        return Math.round(seconds / 60); // Convertir a minutos
    }

    static sanitizeQuery(query) {
        // Limpiar la consulta de caracteres especiales
        return query.trim()
                   .replace(/[^\w\s]/gi, '')
                   .replace(/\s+/g, ' ')
                   .substring(0, 100); // Límite de longitud
    }
}

// ========================================
//    CONFIGURACIÓN DE CACHÉ
// ========================================

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
    }

    set(key, value) {
        this.cache.set(key, value);
        this.timestamps.set(key, Date.now());
    }

    get(key) {
        if (!this.cache.has(key)) return null;

        const timestamp = this.timestamps.get(key);
        if (Date.now() - timestamp > API_LIMITS.CACHE_DURATION) {
            this.cache.delete(key);
            this.timestamps.delete(key);
            return null;
        }

        return this.cache.get(key);
    }

    clear() {
        this.cache.clear();
        this.timestamps.clear();
    }

    size() {
        return this.cache.size;
    }
}

// ========================================
//    RATE LIMITING
// ========================================

class RateLimiter {
    constructor(requestsPerMinute = API_LIMITS.REQUESTS_PER_MINUTE) {
        this.requests = [];
        this.limit = requestsPerMinute;
    }

    canMakeRequest() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Filtrar requests del último minuto
        this.requests = this.requests.filter(time => time > oneMinuteAgo);

        return this.requests.length < this.limit;
    }

    recordRequest() {
        this.requests.push(Date.now());
    }

    getWaitTime() {
        if (this.canMakeRequest()) return 0;

        const oldestRequest = Math.min(...this.requests);
        return 60000 - (Date.now() - oldestRequest);
    }
}

// ========================================
//    EXPORTAR CONFIGURACIONES
// ========================================

// Hacer disponible globalmente
window.API_CONFIG = API_CONFIG;
window.PROXY_CONFIG = PROXY_CONFIG;
window.API_LIMITS = API_LIMITS;
window.GENRE_CONFIG = GENRE_CONFIG;
window.APIHelper = APIHelper;
window.CacheManager = CacheManager;
window.RateLimiter = RateLimiter;

// Crear instancias globales
window.cacheManager = new CacheManager();
window.rateLimiter = new RateLimiter();

console.log('🔧 Configuración de APIs cargada');

// ========================================
//    VALIDACIÓN DE CONFIGURACIÓN
// ========================================

function validateConfiguration() {
    const enabledAPIs = Object.keys(API_CONFIG)
        .filter(api => API_CONFIG[api].ENABLED);

    if (enabledAPIs.length === 0) {
        console.warn('⚠️ No hay APIs habilitadas. El autocompletado usará datos locales.');
        return false;
    }

    console.log('✅ APIs habilitadas:', enabledAPIs.join(', '));
    return true;
}

// Validar al cargar
document.addEventListener('DOMContentLoaded', validateConfiguration);

// ========================================
//    CONFIGURACIÓN DE DESARROLLO
// ========================================

const DEV_CONFIG = {
    DEBUG_MODE: true, // Cambiar a false en producción
    LOG_REQUESTS: true,
    MOCK_DELAY: 500, // Simular latencia de red
    USE_FALLBACK: true // Usar datos locales si fallan las APIs
};

if (DEV_CONFIG.DEBUG_MODE) {
    console.log('🔍 Modo de desarrollo activado');
    console.log('📊 Configuración:', {
        APIs: Object.keys(API_CONFIG).map(key => ({
            name: key,
            enabled: API_CONFIG[key].ENABLED
        })),
        cache_duration: API_LIMITS.CACHE_DURATION / 1000 + 's',
        rate_limit: API_LIMITS.REQUESTS_PER_MINUTE + '/min'
    });
}

window.DEV_CONFIG = DEV_CONFIG;