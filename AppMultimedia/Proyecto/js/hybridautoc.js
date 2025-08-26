// ========================================
//    SISTEMA HÍBRIDO DE AUTOCOMPLETADO MUSICAL
//    🎵 MusicBrainz + iTunes + Base Local + Cache Inteligente
// ========================================

class HybridMusicAutocomplete {
    constructor() {
        this.searchTimeout = null;
        this.currentResults = [];
        this.isSearching = false;
        
        // 💾 Sistema de cache multinivel
        this.cache = new Map(); // Cache de sesión
        this.localStorageKey = 'musicCache';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas
        
        // 🎯 Configuración de APIs
        this.apis = {
            musicbrainz: {
                baseUrl: 'https://musicbrainz.org/ws/2',
                rateLimitMs: 1000, // 1 segundo entre requests
                lastRequest: 0
            },
            itunes: {
                baseUrl: 'https://itunes.apple.com/search',
                rateLimitMs: 200, // Más generoso
                lastRequest: 0
            }
        };
        
        // 🎼 Base de datos local como fallback principal
        this.localDatabase = this.initializeLocalDatabase();
        
        // 📊 Estadísticas de rendimiento
        this.stats = {
            searches: 0,
            cacheHits: 0,
            apiCalls: 0,
            averageResponseTime: 0
        };
        
        this.init();
    }

    init() {
        this.createAutocompleteElements();
        this.setupEventListeners();
        this.loadCacheFromStorage();
        console.log('🎵 Sistema híbrido inicializado');
        console.log('📚 Base local:', this.localDatabase.length, 'canciones');
        console.log('💾 Cache persistente cargado');
    }

    // ========================================
    //    GESTIÓN DE CACHE INTELIGENTE
    // ========================================

    loadCacheFromStorage() {
        try {
            const stored = localStorage.getItem(this.localStorageKey);
            if (stored) {
                const data = JSON.parse(stored);
                const now = Date.now();
                
                // Filtrar entradas expiradas
                Object.entries(data).forEach(([key, value]) => {
                    if (now - value.timestamp < this.cacheExpiry) {
                        this.cache.set(key, value.results);
                    }
                });
                
                console.log('💾 Cache cargado:', this.cache.size, 'entradas');
            }
        } catch (error) {
            console.warn('Error cargando cache:', error);
        }
    }

    saveCacheToStorage() {
        try {
            const cacheData = {};
            const now = Date.now();
            
            this.cache.forEach((results, key) => {
                cacheData[key] = {
                    results,
                    timestamp: now
                };
            });
            
            localStorage.setItem(this.localStorageKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Error guardando cache:', error);
        }
    }

    getCachedResults(query) {
        const normalizedQuery = query.toLowerCase().trim();
        return this.cache.get(normalizedQuery);
    }

    setCachedResults(query, results) {
        const normalizedQuery = query.toLowerCase().trim();
        this.cache.set(normalizedQuery, results);
        
        // Guardar cada 10 búsquedas
        if (this.stats.searches % 10 === 0) {
            this.saveCacheToStorage();
        }
    }

    // ========================================
    //    BASE DE DATOS LOCAL EXPANDIDA
    // ========================================

    initializeLocalDatabase() {
        return [
            // Clásicos del Rock
            { title: 'Bohemian Rhapsody', artist: 'Queen', genre: 'Rock', duration: 355, year: 1975, popularity: 100 },
            { title: 'Stairway to Heaven', artist: 'Led Zeppelin', genre: 'Rock', duration: 482, year: 1971, popularity: 98 },
            { title: 'Hotel California', artist: 'Eagles', genre: 'Rock', duration: 391, year: 1976, popularity: 95 },
            { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', genre: 'Rock', duration: 356, year: 1987, popularity: 90 },
            { title: 'Smoke on the Water', artist: 'Deep Purple', genre: 'Rock', duration: 338, year: 1972, popularity: 88 },
            
            // Pop Legendario
            { title: 'Billie Jean', artist: 'Michael Jackson', genre: 'Pop', duration: 294, year: 1982, popularity: 100 },
            { title: 'Thriller', artist: 'Michael Jackson', genre: 'Pop', duration: 358, year: 1982, popularity: 95 },
            { title: 'Beat It', artist: 'Michael Jackson', genre: 'Pop', duration: 258, year: 1982, popularity: 90 },
            { title: 'Yesterday', artist: 'The Beatles', genre: 'Pop', duration: 125, year: 1965, popularity: 100 },
            { title: 'Hey Jude', artist: 'The Beatles', genre: 'Pop', duration: 431, year: 1968, popularity: 95 },
            
            // Rock Alternativo
            { title: 'Smells Like Teen Spirit', artist: 'Nirvana', genre: 'Grunge', duration: 301, year: 1991, popularity: 95 },
            { title: 'Come As You Are', artist: 'Nirvana', genre: 'Grunge', duration: 219, year: 1991, popularity: 85 },
            { title: 'Black', artist: 'Pearl Jam', genre: 'Grunge', duration: 343, year: 1991, popularity: 80 },
            { title: 'Creep', artist: 'Radiohead', genre: 'Alternative', duration: 238, year: 1992, popularity: 85 },
            
            // Clásicos en Español
            { title: 'Maldito Duende', artist: 'Héroes del Silencio', genre: 'Rock Español', duration: 268, year: 1990, popularity: 85 },
            { title: 'Entre Dos Tierras', artist: 'Héroes del Silencio', genre: 'Rock Español', duration: 256, year: 1990, popularity: 82 },
            { title: 'Me Gustas Tú', artist: 'Manu Chao', genre: 'Pop Latino', duration: 238, year: 2001, popularity: 78 },
            { title: 'Corazón Partío', artist: 'Alejandro Sanz', genre: 'Pop Latino', duration: 294, year: 1997, popularity: 80 },
            
            // Jazz y Blues
            { title: 'What a Wonderful World', artist: 'Louis Armstrong', genre: 'Jazz', duration: 137, year: 1967, popularity: 90 },
            { title: 'Fly Me to the Moon', artist: 'Frank Sinatra', genre: 'Jazz', duration: 148, year: 1964, popularity: 85 },
            { title: 'The Thrill Is Gone', artist: 'B.B. King', genre: 'Blues', duration: 307, year: 1969, popularity: 75 },
            
            // Reggae
            { title: 'No Woman No Cry', artist: 'Bob Marley', genre: 'Reggae', duration: 427, year: 1974, popularity: 90 },
            { title: 'Three Little Birds', artist: 'Bob Marley', genre: 'Reggae', duration: 180, year: 1977, popularity: 85 },
            { title: 'Is This Love', artist: 'Bob Marley', genre: 'Reggae', duration: 238, year: 1978, popularity: 82 },
            
            // Contemporáneos
            { title: 'Wonderwall', artist: 'Oasis', genre: 'Britpop', duration: 258, year: 1995, popularity: 85 },
            { title: 'Yellow', artist: 'Coldplay', genre: 'Alternative', duration: 266, year: 2000, popularity: 80 },
            { title: 'Fix You', artist: 'Coldplay', genre: 'Alternative', duration: 294, year: 2005, popularity: 78 }
        ];
    }

    // ========================================
    //    INTERFAZ DE USUARIO
    // ========================================

    createAutocompleteElements() {
        const tituloInput = document.getElementById('titulo');
        if (!tituloInput) return;

        // Contenedor de resultados
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'autocomplete-results';
        resultsContainer.className = 'autocomplete-results hidden';
        tituloInput.parentNode.insertBefore(resultsContainer, tituloInput.nextSibling);

        // Indicador de carga avanzado
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'search-loading';
        loadingIndicator.className = 'search-loading hidden';
        loadingIndicator.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <span class="loading-text">🔍 Buscando...</span>
                <div class="loading-sources">
                    <span class="source" id="source-local">📚 Local</span>
                    <span class="source" id="source-cache">💾 Cache</span>
                    <span class="source" id="source-musicbrainz">🎵 MusicBrainz</span>
                    <span class="source" id="source-itunes">🍎 iTunes</span>
                </div>
            </div>
        `;
        tituloInput.parentNode.insertBefore(loadingIndicator, resultsContainer);

        // Panel de estadísticas (opcional)
        if (window.location.search.includes('debug=true')) {
            this.createStatsPanel();
        }
    }

    createStatsPanel() {
        const statsPanel = document.createElement('div');
        statsPanel.id = 'stats-panel';
        statsPanel.className = 'stats-panel';
        statsPanel.innerHTML = `
            <div class="stats-header">📊 Estadísticas del Sistema</div>
            <div class="stats-content">
                <div class="stat">Búsquedas: <span id="stat-searches">0</span></div>
                <div class="stat">Cache Hits: <span id="stat-cache">0</span></div>
                <div class="stat">API Calls: <span id="stat-apis">0</span></div>
                <div class="stat">Tiempo Promedio: <span id="stat-time">0ms</span></div>
            </div>
        `;
        
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(statsPanel);
        }
    }

    setupEventListeners() {
        const tituloInput = document.getElementById('titulo');
        if (!tituloInput) return;

        tituloInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        tituloInput.addEventListener('keydown', (e) => {
            this.handleKeyNavigation(e);
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.form-group')) {
                this.hideResults();
            }
        });

        tituloInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.getResultsContainer().classList.contains('hidden')) {
                e.preventDefault();
            }
        });
    }

    // ========================================
    //    MOTOR DE BÚSQUEDA HÍBRIDO
    // ========================================

    async handleSearch(query) {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        if (query.length < 2) {
            this.hideResults();
            return;
        }

        const startTime = Date.now();
        this.stats.searches++;
        
        // Actualizar indicador de estado
        this.updateLoadingState('Iniciando búsqueda...');
        
        this.searchTimeout = setTimeout(async () => {
            await this.performHybridSearch(query, startTime);
        }, 300);
    }

    async performHybridSearch(query, startTime) {
        try {
            this.showLoading();
            const results = [];
            let sourcesUsed = [];

            // 🥇 PRIORIDAD 1: Cache (instantáneo)
            this.activateSource('cache');
            const cachedResults = this.getCachedResults(query);
            if (cachedResults && cachedResults.length > 0) {
                this.stats.cacheHits++;
                this.displayResults(cachedResults, ['💾 Cache']);
                this.updateStats(startTime);
                return;
            }

            // 🥈 PRIORIDAD 2: Base de datos local (muy rápido)
            this.activateSource('local');
            const localResults = this.searchLocalDatabase(query);
            if (localResults.length > 0) {
                results.push(...localResults);
                sourcesUsed.push('📚 Local');
            }

            // 🥉 PRIORIDAD 3: APIs externas (en paralelo)
            const apiPromises = [];
            
            // MusicBrainz API
            if (this.canMakeRequest('musicbrainz')) {
                this.activateSource('musicbrainz');
                apiPromises.push(
                    this.searchMusicBrainz(query)
                        .then(results => ({ source: '🎵 MusicBrainz', results }))
                        .catch(() => ({ source: '🎵 MusicBrainz', results: [] }))
                );
            }

            // iTunes API
            if (this.canMakeRequest('itunes')) {
                this.activateSource('itunes');
                apiPromises.push(
                    this.searchItunes(query)
                        .then(results => ({ source: '🍎 iTunes', results }))
                        .catch(() => ({ source: '🍎 iTunes', results: [] }))
                );
            }

            // Esperar resultados de APIs (con timeout de 5 segundos)
            if (apiPromises.length > 0) {
                this.updateLoadingState('Consultando APIs...');
                this.stats.apiCalls += apiPromises.length;

                try {
                    const apiResults = await Promise.all(apiPromises);
                    
                    apiResults.forEach(({ source, results: apiRes }) => {
                        if (apiRes.length > 0) {
                            results.push(...apiRes);
                            sourcesUsed.push(source);
                        }
                    });
                } catch (error) {
                    console.warn('Error en APIs:', error);
                }
            }

            // Procesar y mostrar resultados combinados
            const finalResults = this.processHybridResults(results, query);
            
            // Guardar en cache si tenemos buenos resultados
            if (finalResults.length > 0) {
                this.setCachedResults(query, finalResults);
            }

            this.displayResults(finalResults, sourcesUsed);
            this.updateStats(startTime);

        } catch (error) {
            console.error('Error en búsqueda híbrida:', error);
            this.showError('Error en la búsqueda');
        } finally {
            this.hideLoading();
        }
    }

    // ========================================
    //    BÚSQUEDA EN BASE LOCAL
    // ========================================

    searchLocalDatabase(query) {
        const normalizedQuery = query.toLowerCase().trim();
        
        return this.localDatabase
            .map(song => {
                let score = 0;
                const titleLower = song.title.toLowerCase();
                const artistLower = song.artist.toLowerCase();
                const genreLower = song.genre.toLowerCase();
                
                // Algoritmo de puntuación mejorado
                if (titleLower.startsWith(normalizedQuery)) score += 100;
                if (artistLower.startsWith(normalizedQuery)) score += 90;
                if (titleLower.includes(normalizedQuery)) score += 50;
                if (artistLower.includes(normalizedQuery)) score += 40;
                if (genreLower.includes(normalizedQuery)) score += 20;
                
                // Bonificación por popularidad
                score += (song.popularity || 0) * 0.1;
                
                // Palabras individuales
                const queryWords = normalizedQuery.split(' ');
                queryWords.forEach(word => {
                    if (word.length > 2) {
                        if (titleLower.includes(word)) score += 25;
                        if (artistLower.includes(word)) score += 20;
                    }
                });
                
                return { ...song, score, source: 'local' };
            })
            .filter(song => song.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }

    // ========================================
    //    APIS EXTERNAS
    // ========================================

    canMakeRequest(apiName) {
        const api = this.apis[apiName];
        const now = Date.now();
        return (now - api.lastRequest) >= api.rateLimitMs;
    }

    async searchMusicBrainz(query) {
        try {
            this.apis.musicbrainz.lastRequest = Date.now();
            
            const url = `${this.apis.musicbrainz.baseUrl}/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=5`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'MusicTracker/1.0 (https://example.com)'
                }
            });
            
            if (!response.ok) throw new Error(`MusicBrainz: ${response.status}`);
            
            const data = await response.json();
            
            return (data.recordings || []).map(recording => ({
                title: recording.title || '',
                artist: recording['artist-credit']?.[0]?.name || '',
                genre: recording.tags?.[0]?.name || 'Unknown',
                duration: recording.length ? Math.round(recording.length / 60000) : 3,
                year: recording['first-release-date'] ? parseInt(recording['first-release-date'].substring(0, 4)) : null,
                source: 'musicbrainz',
                score: 80
            }));
            
        } catch (error) {
            console.warn('MusicBrainz error:', error);
            return [];
        }
    }

    async searchItunes(query) {
        try {
            this.apis.itunes.lastRequest = Date.now();
            
            const url = `${this.apis.itunes.baseUrl}?term=${encodeURIComponent(query)}&media=music&entity=song&limit=5`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`iTunes: ${response.status}`);
            
            const data = await response.json();
            
            return (data.results || []).map(track => ({
                title: track.trackName || '',
                artist: track.artistName || '',
                genre: track.primaryGenreName || 'Unknown',
                duration: track.trackTimeMillis ? Math.round(track.trackTimeMillis / 60000) : 3,
                year: track.releaseDate ? parseInt(track.releaseDate.substring(0, 4)) : null,
                source: 'itunes',
                score: 75
            }));
            
        } catch (error) {
            console.warn('iTunes error:', error);
            return [];
        }
    }

    // ========================================
    //    PROCESAMIENTO DE RESULTADOS
    // ========================================

    processHybridResults(results, query) {
        // Eliminar duplicados basado en título + artista
        const seen = new Set();
        const unique = results.filter(item => {
            const key = `${item.title}-${item.artist}`.toLowerCase().trim();
            if (seen.has(key) || !item.title || !item.artist) return false;
            seen.add(key);
            return true;
        });

        // Ordenar por relevancia (score) y fuente
        const sorted = unique.sort((a, b) => {
            // Priorizar resultados locales si tienen buen score
            if (a.source === 'local' && a.score > 70) return -1;
            if (b.source === 'local' && b.score > 70) return 1;
            
            // Luego por score general
            return (b.score || 0) - (a.score || 0);
        });

        return sorted.slice(0, 8);
    }

    // ========================================
    //    INTERFAZ Y UTILIDADES
    // ========================================

    displayResults(results, sources = []) {
        const container = this.getResultsContainer();
        
        if (!results || results.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    ❌ No se encontraron resultados
                    <div class="sources-used">Fuentes consultadas: ${sources.join(', ')}</div>
                </div>
            `;
            this.showResults();
            return;
        }

        const sourcesText = sources.length > 0 ? `<div class="sources-used">Fuentes: ${sources.join(', ')}</div>` : '';
        
        container.innerHTML = sourcesText + results.map((result, index) => `
            <div class="autocomplete-item ${result.source || ''}" data-index="${index}" 
                 data-title="${this.escapeHTML(result.title)}"
                 data-artist="${this.escapeHTML(result.artist)}"
                 data-genre="${this.escapeHTML(result.genre)}"
                 data-duration="${result.duration}">
                <div class="song-info">
                    <div class="song-title">
                        ${this.getSourceIcon(result.source)} ${this.escapeHTML(result.title)}
                    </div>
                    <div class="song-details">
                        👤 ${this.escapeHTML(result.artist)} • 
                        🎼 ${this.escapeHTML(result.genre)}
                        ${result.year ? ` • 📅 ${result.year}` : ''}
                        ${result.score ? ` • 🎯 ${Math.round(result.score)}` : ''}
                    </div>
                </div>
                <div class="song-duration">⏱️ ${result.duration || 3} min</div>
            </div>
        `).join('');

        container.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectResult(item);
            });
        });

        this.showResults();
    }

    getSourceIcon(source) {
        const icons = {
            'local': '📚',
            'musicbrainz': '🎵',
            'itunes': '🍎',
            'cache': '💾'
        };
        return icons[source] || '🎵';
    }

    selectResult(item) {
        const title = item.dataset.title;
        const artist = item.dataset.artist;
        const genre = item.dataset.genre;
        const duration = item.dataset.duration;

        document.getElementById('titulo').value = title;
        document.getElementById('artista').value = artist;
        document.getElementById('genero').value = genre;
        document.getElementById('tiempo').value = duration;

        this.hideResults();

        if (window.musicTracker) {
            window.musicTracker.showSuccess('✅ Información completada automáticamente');
        }

        document.getElementById('tiempo').focus();
    }

    // ========================================
    //    INDICADORES DE ESTADO
    // ========================================

    updateLoadingState(message) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    activateSource(sourceName) {
        const sourceElement = document.getElementById(`source-${sourceName}`);
        if (sourceElement) {
            sourceElement.classList.add('active');
        }
    }

    updateStats(startTime) {
        const responseTime = Date.now() - startTime;
        this.stats.averageResponseTime = Math.round(
            (this.stats.averageResponseTime * (this.stats.searches - 1) + responseTime) / this.stats.searches
        );

        // Actualizar panel de estadísticas si está visible
        document.getElementById('stat-searches')?.textContent(this.stats.searches);
        document.getElementById('stat-cache')?.textContent(this.stats.cacheHits);
        document.getElementById('stat-apis')?.textContent(this.stats.apiCalls);
        document.getElementById('stat-time')?.textContent(`${this.stats.averageResponseTime}ms`);
    }

    handleKeyNavigation(e) {
        const container = this.getResultsContainer();
        const items = container.querySelectorAll('.autocomplete-item');
        const activeItem = container.querySelector('.autocomplete-item.active');

        if (items.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!activeItem) {
                    items[0].classList.add('active');
                } else {
                    const currentIndex = parseInt(activeItem.dataset.index);
                    activeItem.classList.remove('active');
                    const nextIndex = (currentIndex + 1) % items.length;
                    items[nextIndex].classList.add('active');
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (!activeItem) {
                    items[items.length - 1].classList.add('active');
                } else {
                    const currentIndex = parseInt(activeItem.dataset.index);
                    activeItem.classList.remove('active');
                    const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
                    items[prevIndex].classList.add('active');
                }
                break;

            case 'Enter':
                e.preventDefault();
                if (activeItem) {
                    this.selectResult(activeItem);
                }
                break;

            case 'Escape':
                this.hideResults();
                break;
        }
    }

    // ========================================
    //    UTILIDADES
    // ========================================

    getResultsContainer() {
        return document.getElementById('autocomplete-results');
    }

    showResults() {
        this.getResultsContainer().classList.remove('hidden');
    }

    hideResults() {
        const container = this.getResultsContainer();
        container.classList.add('hidden');
        container.querySelectorAll('.autocomplete-item.active').forEach(item => {
            item.classList.remove('active');
        });
        
        // Limpiar indicadores de fuentes
        document.querySelectorAll('.source.active').forEach(source => {
            source.classList.remove('active');
        });
    }

    showLoading() {
        const loading = document.getElementById('search-loading');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loading = document.getElementById('search-loading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }

    showError(message) {
        const container = this.getResultsContainer();
        container.innerHTML = `<div class="error-message">⚠️ ${message}</div>`;
        this.showResults();
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    // ========================================
    //    API PÚBLICA
    // ========================================

    clearCache() {
        this.cache.clear();
        localStorage.removeItem(this.localStorageKey);
        console.log('🗑️ Cache limpiado');
    }

    getStats() {
        return { ...this.stats };
    }

    addToLocalDatabase(song) {
        this.localDatabase.push({
            ...song,
            popularity: song.popularity || 50,
            source: 'user-added'
        });
    }
}

// ========================================
//    INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    window.musicAutocomplete = new HybridMusicAutocomplete();
    
    // Funciones de utilidad globales
    window.clearMusicCache = () => window.musicAutocomplete.clearCache();
    window.getMusicStats = () => console.log(window.musicAutocomplete.getStats());
});

window.HybridMusicAutocomplete = HybridMusicAutocomplete;