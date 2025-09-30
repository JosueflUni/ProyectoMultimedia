// ========================================
//    SISTEMA HÍBRIDO DE AUTOCOMPLETADO MUSICAL - VERSIÓN MEJORADA
//    🎵 MusicBrainz + iTunes + Base Local + Cache Inteligente
// ========================================

class HybridMusicAutocomplete {
    constructor() {
        this.searchTimeout = null;
        this.currentResults = [];
        this.isSearching = false;
        this.initialized = false;
        
        // 💾 Sistema de cache multinivel
        this.cache = new Map();
        this.localStorageKey = 'musicCache_v2';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas
        
        // 🎯 Configuración de APIs
        this.apis = {
            musicbrainz: {
                baseUrl: 'https://musicbrainz.org/ws/2',
                rateLimitMs: 1000,
                lastRequest: 0,
                enabled: true
            },
            itunes: {
                baseUrl: 'https://itunes.apple.com/search',
                rateLimitMs: 200,
                lastRequest: 0,
                enabled: true
            }
        };
        
        // 🎼 Base de datos local expandida
        this.localDatabase = this.initializeLocalDatabase();
        
        // 📊 Estadísticas
        this.stats = {
            searches: 0,
            cacheHits: 0,
            apiCalls: 0,
            averageResponseTime: 0
        };
        
        this.init();
    }

    init() {
        // Esperar que el DOM esté completamente listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        try {
            this.createAutocompleteElements();
            this.setupEventListeners();
            this.loadCacheFromStorage();
            this.initialized = true;
            console.log('🎵 Sistema híbrido inicializado correctamente');
            console.log('📚 Base local:', this.localDatabase.length, 'canciones');
        } catch (error) {
            console.error('❌ Error inicializando autocompletado:', error);
        }
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
                
                Object.entries(data).forEach(([key, value]) => {
                    if (now - value.timestamp < this.cacheExpiry) {
                        this.cache.set(key, value.results);
                    }
                });
                
                console.log('💾 Cache cargado:', this.cache.size, 'entradas');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando cache:', error);
            localStorage.removeItem(this.localStorageKey);
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
            console.warn('⚠️ Error guardando cache:', error);
        }
    }

    getCachedResults(query) {
        const normalizedQuery = query.toLowerCase().trim();
        return this.cache.get(normalizedQuery);
    }

    setCachedResults(query, results) {
        const normalizedQuery = query.toLowerCase().trim();
        this.cache.set(normalizedQuery, results);
        
        // Guardar cada 5 búsquedas para mejor rendimiento
        if (this.stats.searches % 5 === 0) {
            this.saveCacheToStorage();
        }
    }

    // ========================================
    //    BASE DE DATOS LOCAL EXPANDIDA
    // ========================================

    initializeLocalDatabase() {
        return [
            // Clásicos del Rock
            { title: 'Bohemian Rhapsody', artist: 'Queen', genre: 'Rock', duration: 6, year: 1975, popularity: 100 },
            { title: 'Stairway to Heaven', artist: 'Led Zeppelin', genre: 'Rock', duration: 8, year: 1971, popularity: 98 },
            { title: 'Hotel California', artist: 'Eagles', genre: 'Rock', duration: 7, year: 1976, popularity: 95 },
            { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', genre: 'Rock', duration: 6, year: 1987, popularity: 90 },
            { title: 'Smoke on the Water', artist: 'Deep Purple', genre: 'Rock', duration: 5, year: 1972, popularity: 88 },
            { title: 'Free Bird', artist: 'Lynyrd Skynyrd', genre: 'Rock', duration: 9, year: 1974, popularity: 85 },
            { title: 'Thunderstruck', artist: 'AC/DC', genre: 'Rock', duration: 5, year: 1990, popularity: 87 },
            
            // Pop Legendario
            { title: 'Billie Jean', artist: 'Michael Jackson', genre: 'Pop', duration: 5, year: 1982, popularity: 100 },
            { title: 'Thriller', artist: 'Michael Jackson', genre: 'Pop', duration: 6, year: 1982, popularity: 95 },
            { title: 'Beat It', artist: 'Michael Jackson', genre: 'Pop', duration: 4, year: 1982, popularity: 90 },
            { title: 'Yesterday', artist: 'The Beatles', genre: 'Pop', duration: 2, year: 1965, popularity: 100 },
            { title: 'Hey Jude', artist: 'The Beatles', genre: 'Pop', duration: 7, year: 1968, popularity: 95 },
            { title: 'Let It Be', artist: 'The Beatles', genre: 'Pop', duration: 4, year: 1970, popularity: 90 },
            
            // Pop Moderno
            { title: 'Shape of You', artist: 'Ed Sheeran', genre: 'Pop', duration: 4, year: 2017, popularity: 95 },
            { title: 'Blinding Lights', artist: 'The Weeknd', genre: 'Pop', duration: 3, year: 2019, popularity: 92 },
            { title: 'Watermelon Sugar', artist: 'Harry Styles', genre: 'Pop', duration: 3, year: 2020, popularity: 85 },
            
            // Rock Alternativo y Grunge
            { title: 'Smells Like Teen Spirit', artist: 'Nirvana', genre: 'Grunge', duration: 5, year: 1991, popularity: 95 },
            { title: 'Come As You Are', artist: 'Nirvana', genre: 'Grunge', duration: 4, year: 1991, popularity: 85 },
            { title: 'Black', artist: 'Pearl Jam', genre: 'Grunge', duration: 6, year: 1991, popularity: 80 },
            { title: 'Creep', artist: 'Radiohead', genre: 'Alternative', duration: 4, year: 1992, popularity: 85 },
            { title: 'Wonderwall', artist: 'Oasis', genre: 'Britpop', duration: 4, year: 1995, popularity: 85 },
            
            // Música en Español
            { title: 'Maldito Duende', artist: 'Héroes del Silencio', genre: 'Rock Español', duration: 4, year: 1990, popularity: 85 },
            { title: 'Entre Dos Tierras', artist: 'Héroes del Silencio', genre: 'Rock Español', duration: 4, year: 1990, popularity: 82 },
            { title: 'Me Gustas Tú', artist: 'Manu Chao', genre: 'Pop Latino', duration: 4, year: 2001, popularity: 78 },
            { title: 'Corazón Partío', artist: 'Alejandro Sanz', genre: 'Pop Latino', duration: 5, year: 1997, popularity: 80 },
            { title: 'Bambaatá', artist: 'Shaggy', genre: 'Reggae', duration: 4, year: 2000, popularity: 75 },
            
            // Reggaeton y Latino
            { title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', genre: 'Reggaeton', duration: 4, year: 2017, popularity: 98 },
            { title: 'Con Altura', artist: 'Rosalía ft. J Balvin', genre: 'Reggaeton', duration: 3, year: 2019, popularity: 85 },
            { title: 'Dákiti', artist: 'Bad Bunny ft. Jhay Cortez', genre: 'Reggaeton', duration: 3, year: 2020, popularity: 88 },
            
            // Electronic y EDM
            { title: 'Levels', artist: 'Avicii', genre: 'Electronic', duration: 3, year: 2011, popularity: 90 },
            { title: 'Titanium', artist: 'David Guetta ft. Sia', genre: 'Electronic', duration: 4, year: 2011, popularity: 85 },
            { title: 'Wake Me Up', artist: 'Avicii', genre: 'Electronic', duration: 4, year: 2013, popularity: 88 },
            
            // Hip-Hop y R&B
            { title: 'Lose Yourself', artist: 'Eminem', genre: 'Hip-Hop', duration: 5, year: 2002, popularity: 95 },
            { title: 'Stan', artist: 'Eminem', genre: 'Hip-Hop', duration: 7, year: 2000, popularity: 85 },
            { title: 'Crazy in Love', artist: 'Beyoncé', genre: 'R&B', duration: 4, year: 2003, popularity: 85 },
            
            // Jazz y Blues
            { title: 'What a Wonderful World', artist: 'Louis Armstrong', genre: 'Jazz', duration: 2, year: 1967, popularity: 90 },
            { title: 'Fly Me to the Moon', artist: 'Frank Sinatra', genre: 'Jazz', duration: 2, year: 1964, popularity: 85 },
            { title: 'The Thrill Is Gone', artist: 'B.B. King', genre: 'Blues', duration: 5, year: 1969, popularity: 75 },
            
            // Reggae
            { title: 'No Woman No Cry', artist: 'Bob Marley', genre: 'Reggae', duration: 7, year: 1974, popularity: 90 },
            { title: 'Three Little Birds', artist: 'Bob Marley', genre: 'Reggae', duration: 3, year: 1977, popularity: 85 },
            { title: 'Is This Love', artist: 'Bob Marley', genre: 'Reggae', duration: 4, year: 1978, popularity: 82 },
            
            // Indie y Alternative
            { title: 'Yellow', artist: 'Coldplay', genre: 'Alternative', duration: 4, year: 2000, popularity: 80 },
            { title: 'Fix You', artist: 'Coldplay', genre: 'Alternative', duration: 5, year: 2005, popularity: 78 },
            { title: 'Mr. Brightside', artist: 'The Killers', genre: 'Indie', duration: 4, year: 2003, popularity: 85 }
        ];
    }

    // ========================================
    //    INTERFAZ DE USUARIO
    // ========================================

    createAutocompleteElements() {
        const tituloInput = document.getElementById('titulo');
        if (!tituloInput) {
            console.error('❌ Input de título no encontrado');
            return;
        }

        // Asegurar que el contenedor padre tenga posición relativa
        const formGroup = tituloInput.closest('.form-group');
        if (formGroup) {
            formGroup.style.position = 'relative';
        }

        // Remover elementos existentes si los hay
        this.removeExistingElements();

        // Contenedor de resultados
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'autocomplete-results';
        resultsContainer.className = 'autocomplete-results hidden';
        resultsContainer.setAttribute('role', 'listbox');
        resultsContainer.setAttribute('aria-label', 'Sugerencias de canciones');

        // Indicador de carga
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'search-loading';
        loadingIndicator.className = 'search-loading hidden';
        loadingIndicator.setAttribute('role', 'status');
        loadingIndicator.setAttribute('aria-live', 'polite');
        loadingIndicator.innerHTML = this.getLoadingHTML();

        // Insertar elementos
        if (formGroup) {
            formGroup.appendChild(loadingIndicator);
            formGroup.appendChild(resultsContainer);
        } else {
            tituloInput.parentNode.insertBefore(loadingIndicator, tituloInput.nextSibling);
            tituloInput.parentNode.insertBefore(resultsContainer, loadingIndicator.nextSibling);
        }

        console.log('✅ Elementos de autocompletado creados');
    }

    removeExistingElements() {
        const existing = [
            document.getElementById('autocomplete-results'),
            document.getElementById('search-loading')
        ];
        existing.forEach(el => el && el.remove());
    }

    getLoadingHTML() {
        return `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <span class="loading-text">🔍 Buscando música...</span>
                <div class="loading-sources">
                    <span class="source" id="source-local">📚 Local</span>
                    <span class="source" id="source-cache">💾 Cache</span>
                    <span class="source" id="source-musicbrainz">🎵 MusicBrainz</span>
                    <span class="source" id="source-itunes">🍎 iTunes</span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const tituloInput = document.getElementById('titulo');
        if (!tituloInput) return;

        // Prevenir autocompletado del navegador
        tituloInput.setAttribute('autocomplete', 'off');
        tituloInput.setAttribute('spellcheck', 'false');
        tituloInput.setAttribute('role', 'combobox');
        tituloInput.setAttribute('aria-expanded', 'false');
        tituloInput.setAttribute('aria-haspopup', 'listbox');

        // Event listeners principales
        tituloInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        tituloInput.addEventListener('keydown', (e) => this.handleKeyNavigation(e));
        tituloInput.addEventListener('focus', (e) => {
            if (e.target.value.trim().length >= 2) {
                this.handleSearch(e.target.value);
            }
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.form-group') && !e.target.closest('.autocomplete-results')) {
                this.hideResults();
            }
        });

        console.log('✅ Event listeners configurados');
    }

    // ========================================
    //    MOTOR DE BÚSQUEDA HÍBRIDO
    // ========================================

    async handleSearch(query) {
        // Limpiar timeout anterior
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Validaciones básicas
        const trimmedQuery = query.trim();
        if (trimmedQuery.length < 2) {
            this.hideResults();
            return;
        }

        // Prevenir búsquedas múltiples simultáneas
        if (this.isSearching) {
            return;
        }

        const startTime = Date.now();
        this.stats.searches++;
        
        // Debounce de 300ms
        this.searchTimeout = setTimeout(async () => {
            await this.performHybridSearch(trimmedQuery, startTime);
        }, 300);
    }

    async performHybridSearch(query, startTime) {
        this.isSearching = true;
        
        try {
            this.showLoading();
            this.updateLoadingState('Iniciando búsqueda...');
            
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

            // 🥈 PRIORIDAD 2: Base de datos local
            this.activateSource('local');
            const localResults = this.searchLocalDatabase(query);
            if (localResults.length > 0) {
                results.push(...localResults);
                sourcesUsed.push('📚 Local');
            }

            // Mostrar resultados locales inmediatamente si los hay
            if (localResults.length > 0) {
                this.displayResults(localResults, ['📚 Local']);
            }

            // 🥉 PRIORIDAD 3: APIs externas (si están habilitadas)
            const apiPromises = [];
            
            if (this.apis.musicbrainz.enabled && this.canMakeRequest('musicbrainz')) {
                this.activateSource('musicbrainz');
                apiPromises.push(
                    this.searchMusicBrainz(query)
                        .then(results => ({ source: '🎵 MusicBrainz', results }))
                        .catch(error => {
                            console.warn('MusicBrainz error:', error);
                            return { source: '🎵 MusicBrainz', results: [] };
                        })
                );
            }

            if (this.apis.itunes.enabled && this.canMakeRequest('itunes')) {
                this.activateSource('itunes');
                apiPromises.push(
                    this.searchItunes(query)
                        .then(results => ({ source: '🍎 iTunes', results }))
                        .catch(error => {
                            console.warn('iTunes error:', error);
                            return { source: '🍎 iTunes', results: [] };
                        })
                );
            }

            // Procesar APIs si están disponibles
            if (apiPromises.length > 0) {
                this.updateLoadingState('Consultando APIs externas...');
                this.stats.apiCalls += apiPromises.length;

                try {
                    const apiResults = await Promise.race([
                        Promise.all(apiPromises),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Timeout')), 5000)
                        )
                    ]);

                    apiResults.forEach(({ source, results: apiRes }) => {
                        if (apiRes && apiRes.length > 0) {
                            results.push(...apiRes);
                            if (!sourcesUsed.includes(source)) {
                                sourcesUsed.push(source);
                            }
                        }
                    });
                } catch (error) {
                    console.warn('API timeout o error:', error.message);
                }
            }

            // Procesar y mostrar resultados finales
            const finalResults = this.processHybridResults(results, query);
            
            if (finalResults.length > 0) {
                this.setCachedResults(query, finalResults);
                this.displayResults(finalResults, sourcesUsed);
            } else {
                this.displayNoResults(sourcesUsed);
            }

            this.updateStats(startTime);

        } catch (error) {
            console.error('❌ Error en búsqueda híbrida:', error);
            this.showError('Error en la búsqueda. Inténtalo de nuevo.');
        } finally {
            this.hideLoading();
            this.isSearching = false;
        }
    }

    // ========================================
    //    BÚSQUEDA EN BASE LOCAL
    // ========================================

    searchLocalDatabase(query) {
        const normalizedQuery = query.toLowerCase().trim();
        const queryWords = normalizedQuery.split(' ').filter(word => word.length > 1);
        
        return this.localDatabase
            .map(song => {
                let score = 0;
                const titleLower = song.title.toLowerCase();
                const artistLower = song.artist.toLowerCase();
                const genreLower = song.genre.toLowerCase();
                
                // Coincidencias exactas al inicio (mayor puntuación)
                if (titleLower.startsWith(normalizedQuery)) score += 100;
                if (artistLower.startsWith(normalizedQuery)) score += 90;
                
                // Coincidencias parciales
                if (titleLower.includes(normalizedQuery)) score += 70;
                if (artistLower.includes(normalizedQuery)) score += 60;
                if (genreLower.includes(normalizedQuery)) score += 30;
                
                // Búsqueda por palabras individuales
                queryWords.forEach(word => {
                    if (titleLower.includes(word)) score += 40;
                    if (artistLower.includes(word)) score += 35;
                    if (genreLower.includes(word)) score += 15;
                });
                
                // Bonificación por popularidad y año reciente
                score += (song.popularity || 50) * 0.2;
                if (song.year && song.year > 2000) score += 10;
                
                return { ...song, score, source: 'local' };
            })
            .filter(song => song.score > 15) // Umbral más alto para mejor calidad
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
    }

    // ========================================
    //    APIS EXTERNAS
    // ========================================

    canMakeRequest(apiName) {
        const api = this.apis[apiName];
        if (!api || !api.enabled) return false;
        
        const now = Date.now();
        return (now - api.lastRequest) >= api.rateLimitMs;
    }

    async searchMusicBrainz(query) {
        if (!this.canMakeRequest('musicbrainz')) return [];
        
        try {
            this.apis.musicbrainz.lastRequest = Date.now();
            
            const encodedQuery = encodeURIComponent(query.trim());
            const url = `${this.apis.musicbrainz.baseUrl}/recording/?query=${encodedQuery}&fmt=json&limit=6`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'MusicTracker/1.0 (educational-app)',
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            return (data.recordings || [])
                .filter(recording => recording.title && recording['artist-credit']?.[0]?.name)
                .map(recording => ({
                    title: recording.title,
                    artist: recording['artist-credit'][0].name,
                    genre: recording.tags?.[0]?.name || 'Unknown',
                    duration: recording.length ? Math.round(recording.length / 60000) : 3,
                    year: recording['first-release-date'] ? 
                          parseInt(recording['first-release-date'].substring(0, 4)) : null,
                    source: 'musicbrainz',
                    score: 75
                }));
                
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('MusicBrainz: Request timeout');
            } else {
                console.warn('MusicBrainz error:', error.message);
            }
            return [];
        }
    }

    async searchItunes(query) {
        if (!this.canMakeRequest('itunes')) return [];
        
        try {
            this.apis.itunes.lastRequest = Date.now();
            
            const encodedQuery = encodeURIComponent(query.trim());
            const url = `${this.apis.itunes.baseUrl}?term=${encodedQuery}&media=music&entity=song&limit=6`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(url, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            return (data.results || [])
                .filter(track => track.trackName && track.artistName)
                .map(track => ({
                    title: track.trackName,
                    artist: track.artistName,
                    genre: track.primaryGenreName || 'Pop',
                    duration: track.trackTimeMillis ? 
                             Math.round(track.trackTimeMillis / 60000) : 3,
                    year: track.releaseDate ? 
                          parseInt(track.releaseDate.substring(0, 4)) : null,
                    source: 'itunes',
                    score: 70
                }));
                
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('iTunes: Request timeout');
            } else {
                console.warn('iTunes error:', error.message);
            }
            return [];
        }
    }

    // ========================================
    //    PROCESAMIENTO DE RESULTADOS
    // ========================================

    processHybridResults(results, query) {
        if (!results || results.length === 0) return [];

        // Eliminar duplicados y filtrar resultados inválidos
        const seen = new Set();
        const unique = results.filter(item => {
            if (!item.title || !item.artist) return false;
            
            const key = `${item.title.toLowerCase().trim()}-${item.artist.toLowerCase().trim()}`;
            if (seen.has(key)) return false;
            
            seen.add(key);
            return true;
        });

        // Ordenar por relevancia y fuente
        const sorted = unique.sort((a, b) => {
            // Priorizar resultados locales con buen score
            if (a.source === 'local' && a.score > 60) return -1;
            if (b.source === 'local' && b.score > 60) return 1;
            
            // Luego por score general
            return (b.score || 0) - (a.score || 0);
        });

        return sorted.slice(0, 8);
    }

    // ========================================
    //    INTERFAZ Y VISUALIZACIÓN
    // ========================================

    displayResults(results, sources = []) {
        const container = this.getResultsContainer();
        if (!container) return;

        if (!results || results.length === 0) {
            this.displayNoResults(sources);
            return;
        }

        const sourcesHtml = sources.length > 0 ? 
            `<div class="sources-used">Fuentes: ${sources.join(', ')}</div>` : '';
        
        const resultsHtml = results.map((result, index) => 
            this.createResultItemHTML(result, index)
        ).join('');

        container.innerHTML = sourcesHtml + resultsHtml;
        
        // Configurar event listeners para los items
        this.setupResultItemListeners(container);
        
        // Mostrar resultados
        this.showResults();
        
        // Actualizar atributos de accesibilidad
        const tituloInput = document.getElementById('titulo');
        if (tituloInput) {
            tituloInput.setAttribute('aria-expanded', 'true');
        }
    }

    createResultItemHTML(result, index) {
        const sourceIcon = this.getSourceIcon(result.source);
        const durationText = result.duration || 3;
        const yearText = result.year ? ` • 📅 ${result.year}` : '';
        const scoreText = result.score && window.location.search.includes('debug=true') ? 
                         ` • 🎯 ${Math.round(result.score)}` : '';
        
        return `
            <div class="autocomplete-item ${result.source || ''}" 
                 data-index="${index}" 
                 data-title="${this.escapeHTML(result.title)}"
                 data-artist="${this.escapeHTML(result.artist)}"
                 data-genre="${this.escapeHTML(result.genre)}"
                 data-duration="${durationText}"
                 role="option"
                 tabindex="-1"
                 aria-selected="false">
                <div class="song-info">
                    <div class="song-title">
                        ${sourceIcon} ${this.escapeHTML(result.title)}
                    </div>
                    <div class="song-details">
                        👤 ${this.escapeHTML(result.artist)} • 
                        🎼 ${this.escapeHTML(result.genre)}${yearText}${scoreText}
                    </div>
                </div>
                <div class="song-duration">⏱️ ${durationText} min</div>
            </div>
        `;
    }

    setupResultItemListeners(container) {
        container.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => this.selectResult(item));
            item.addEventListener('mouseenter', () => this.setActiveItem(item));
        });
    }

    displayNoResults(sources = []) {
        const container = this.getResultsContainer();
        if (!container) return;

        const sourcesText = sources.length > 0 ? 
            `<div class="sources-used">Fuentes consultadas: ${sources.join(', ')}</div>` : '';

        container.innerHTML = `
            ${sourcesText}
            <div class="no-results">
                🎵 No se encontraron resultados
                <p style="margin-top: 8px; font-size: 13px; opacity: 0.8;">
                    Intenta con términos más específicos o verifica la ortografía
                </p>
            </div>
        `;
        
        this.showResults();
    }

    selectResult(item) {
        const data = {
            title: item.dataset.title,
            artist: item.dataset.artist,
            genre: item.dataset.genre,
            duration: item.dataset.duration
        };

        // Rellenar formulario
        this.fillForm(data);
        
        // Ocultar resultados
        this.hideResults();
        
        // Mostrar confirmación
        this.showSuccessMessage('✅ Información completada automáticamente');
        
        // Enfocar siguiente campo
        const tiempoInput = document.getElementById('tiempo');
        if (tiempoInput) {
            setTimeout(() => tiempoInput.focus(), 100);
        }
    }

    fillForm(data) {
        const fields = {
            'titulo': data.title,
            'artista': data.artist,
            'genero': data.genre,
            'tiempo': data.duration
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.value = value;
                
                // Disparar evento change para formularios reactivos
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }

    // ========================================
    //    NAVEGACIÓN POR TECLADO
    // ========================================

    handleKeyNavigation(e) {
        const container = this.getResultsContainer();
        if (!container || container.classList.contains('hidden')) return;

        const items = container.querySelectorAll('.autocomplete-item');
        if (items.length === 0) return;

        const activeItem = container.querySelector('.autocomplete-item.active');
        let newIndex = -1;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!activeItem) {
                    newIndex = 0;
                } else {
                    const currentIndex = parseInt(activeItem.dataset.index);
                    newIndex = (currentIndex + 1) % items.length;
                }
                this.setActiveItemByIndex(items, newIndex);
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (!activeItem) {
                    newIndex = items.length - 1;
                } else {
                    const currentIndex = parseInt(activeItem.dataset.index);
                    newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
                }
                this.setActiveItemByIndex(items, newIndex);
                break;

            case 'Enter':
                e.preventDefault();
                if (activeItem) {
                    this.selectResult(activeItem);
                }
                break;

            case 'Escape':
                e.preventDefault();
                this.hideResults();
                break;

            case 'Tab':
                // Permitir navegación normal con Tab
                this.hideResults();
                break;
        }
    }

    setActiveItemByIndex(items, index) {
        // Remover active de todos los items
        items.forEach(item => {
            item.classList.remove('active');
            item.setAttribute('aria-selected', 'false');
        });

        // Activar el item seleccionado
        if (items[index]) {
            this.setActiveItem(items[index]);
        }
    }

    setActiveItem(item) {
        // Remover active de todos los items
        const container = this.getResultsContainer();
        if (container) {
            container.querySelectorAll('.autocomplete-item').forEach(i => {
                i.classList.remove('active');
                i.setAttribute('aria-selected', 'false');
            });
        }

        // Activar item actual
        item.classList.add('active');
        item.setAttribute('aria-selected', 'true');

        // Scroll si es necesario
        item.scrollIntoView({ block: 'nearest' });
    }

    // ========================================
    //    UTILIDADES Y HELPERS
    // ========================================

    getResultsContainer() {
        return document.getElementById('autocomplete-results');
    }

    showResults() {
        const container = this.getResultsContainer();
        if (container) {
            container.classList.remove('hidden');
        }
    }

    hideResults() {
        const container = this.getResultsContainer();
        if (container) {
            container.classList.add('hidden');
            
            // Limpiar estados activos
            container.querySelectorAll('.autocomplete-item.active').forEach(item => {
                item.classList.remove('active');
                item.setAttribute('aria-selected', 'false');
            });
        }

        // Actualizar accesibilidad
        const tituloInput = document.getElementById('titulo');
        if (tituloInput) {
            tituloInput.setAttribute('aria-expanded', 'false');
        }

        // Limpiar indicadores de fuentes
        this.clearSourceIndicators();
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

    updateLoadingState(message) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = `🔍 ${message}`;
        }
    }

    activateSource(sourceName) {
        const sourceElement = document.getElementById(`source-${sourceName}`);
        if (sourceElement) {
            sourceElement.classList.add('active');
        }
    }

    clearSourceIndicators() {
        document.querySelectorAll('.source.active').forEach(source => {
            source.classList.remove('active');
        });
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

    showError(message) {
        const container = this.getResultsContainer();
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    ⚠️ ${message}
                </div>
            `;
            this.showResults();
        }
    }

    showSuccessMessage(message) {
        if (window.musicTracker && window.musicTracker.showSuccess) {
            window.musicTracker.showSuccess(message);
        } else {
            console.log('✅', message);
        }
    }

    updateStats(startTime) {
        const responseTime = Date.now() - startTime;
        this.stats.averageResponseTime = Math.round(
            (this.stats.averageResponseTime * (this.stats.searches - 1) + responseTime) / this.stats.searches
        );

        // Actualizar panel de estadísticas si está visible
        const statElements = {
            'stat-searches': this.stats.searches,
            'stat-cache': this.stats.cacheHits,
            'stat-apis': this.stats.apiCalls,
            'stat-time': `${this.stats.averageResponseTime}ms`
        };

        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    escapeHTML(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
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
        if (song.title && song.artist) {
            this.localDatabase.push({
                title: song.title,
                artist: song.artist,
                genre: song.genre || 'Unknown',
                duration: song.duration || 3,
                year: song.year || new Date().getFullYear(),
                popularity: song.popularity || 50,
                source: 'user-added'
            });
            console.log('➕ Canción agregada a la base local:', song.title);
        }
    }

    toggleAPI(apiName, enabled) {
        if (this.apis[apiName]) {
            this.apis[apiName].enabled = enabled;
            console.log(`🔄 ${apiName} ${enabled ? 'habilitada' : 'deshabilitada'}`);
        }
    }

    destroy() {
        this.removeExistingElements();
        this.cache.clear();
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        console.log('🗑️ Autocompletado destruido');
    }
}

// ========================================
//    MEJORA DEL POSICIONAMIENTO DEL AUTOCOMPLETADO
// ========================================

// Agregar esta función al archivo hybridautoc.js existente
// O reemplazar las funciones createAutocompleteElements y setupEventListeners

class HybridMusicAutocompleteFixed extends HybridMusicAutocomplete {
    
    createAutocompleteElements() {
        const tituloInput = document.getElementById('titulo');
        if (!tituloInput) {
            console.error('❌ Input de título no encontrado');
            return;
        }

        // Asegurar que el contenedor padre tenga posición relativa
        const formGroup = tituloInput.closest('.form-group');
        if (formGroup) {
            formGroup.style.position = 'relative';
            formGroup.style.zIndex = '10';
            formGroup.style.marginBottom = '30px'; // Espacio extra para dropdown
        }

        // Remover elementos existentes
        this.removeExistingElements();

        // Contenedor de resultados
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'autocomplete-results';
        resultsContainer.className = 'autocomplete-results hidden';
        resultsContainer.setAttribute('role', 'listbox');
        resultsContainer.setAttribute('aria-label', 'Sugerencias de canciones');
        
        // Estilos inline para asegurar posicionamiento correcto
        Object.assign(resultsContainer.style, {
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '0',
            right: '0',
            zIndex: '9999',
            pointerEvents: 'none'
        });

        // Indicador de carga
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'search-loading';
        loadingIndicator.className = 'search-loading hidden';
        loadingIndicator.setAttribute('role', 'status');
        loadingIndicator.setAttribute('aria-live', 'polite');
        loadingIndicator.innerHTML = this.getLoadingHTML();
        
        // Estilos inline para loading
        Object.assign(loadingIndicator.style, {
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '0',
            right: '0',
            zIndex: '9998',
            pointerEvents: 'none'
        });

        // Insertar elementos en el form-group
        if (formGroup) {
            formGroup.appendChild(loadingIndicator);
            formGroup.appendChild(resultsContainer);
        }

        console.log('✅ Elementos de autocompletado creados con posicionamiento mejorado');
    }

    setupEventListeners() {
        const tituloInput = document.getElementById('titulo');
        if (!tituloInput) return;

        // Configurar atributos del input
        tituloInput.setAttribute('autocomplete', 'off');
        tituloInput.setAttribute('spellcheck', 'false');
        tituloInput.setAttribute('role', 'combobox');
        tituloInput.setAttribute('aria-expanded', 'false');
        tituloInput.setAttribute('aria-haspopup', 'listbox');

        // Event listeners principales
        tituloInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        tituloInput.addEventListener('keydown', (e) => this.handleKeyNavigation(e));
        tituloInput.addEventListener('focus', (e) => {
            if (e.target.value.trim().length >= 2) {
                this.handleSearch(e.target.value);
            }
        });

        // Cerrar al hacer clic fuera - mejorado
        document.addEventListener('click', (e) => {
            const isInsideAutocomplete = e.target.closest('.form-group') || 
                                       e.target.closest('.autocomplete-results') ||
                                       e.target.closest('.search-loading');
            
            if (!isInsideAutocomplete) {
                this.hideResults();
            }
        });

        // Prevenir que el dropdown interfiera con el scroll
        tituloInput.addEventListener('blur', (e) => {
            // Delay para permitir clicks en resultados
            setTimeout(() => {
                const activeElement = document.activeElement;
                const isInAutocomplete = activeElement && 
                                       (activeElement.closest('.autocomplete-results') || 
                                        activeElement.id === 'titulo');
                
                if (!isInAutocomplete) {
                    this.hideResults();
                }
            }, 150);
        });

        console.log('✅ Event listeners mejorados configurados');
    }

    showResults() {
        const container = this.getResultsContainer();
        if (container) {
            container.classList.remove('hidden');
            container.style.pointerEvents = 'auto';
            container.style.visibility = 'visible';
            
            // Calcular posición óptima
            this.adjustResultsPosition(container);
        }
    }

    hideResults() {
        const container = this.getResultsContainer();
        if (container) {
            container.classList.add('hidden');
            container.style.pointerEvents = 'none';
            container.style.visibility = 'hidden';
            
            // Limpiar estados activos
            container.querySelectorAll('.autocomplete-item.active').forEach(item => {
                item.classList.remove('active');
                item.setAttribute('aria-selected', 'false');
            });
        }

        // Loading indicator
        const loading = document.getElementById('search-loading');
        if (loading) {
            loading.classList.add('hidden');
            loading.style.pointerEvents = 'none';
            loading.style.visibility = 'hidden';
        }

        // Actualizar accesibilidad
        const tituloInput = document.getElementById('titulo');
        if (tituloInput) {
            tituloInput.setAttribute('aria-expanded', 'false');
        }

        // Limpiar indicadores de fuentes
        this.clearSourceIndicators();
    }

    adjustResultsPosition(container) {
        const tituloInput = document.getElementById('titulo');
        if (!tituloInput || !container) return;

        const inputRect = tituloInput.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const containerHeight = container.offsetHeight || 400; // Altura estimada
        
        // Verificar si hay espacio suficiente abajo
        const spaceBelow = viewportHeight - inputRect.bottom;
        const spaceAbove = inputRect.top;
        
        if (spaceBelow < containerHeight + 20 && spaceAbove > containerHeight + 20) {
            // Mostrar arriba si no hay espacio abajo
            container.style.top = 'auto';
            container.style.bottom = 'calc(100% + 8px)';
        } else {
            // Mostrar abajo (comportamiento normal)
            container.style.top = 'calc(100% + 8px)';
            container.style.bottom = 'auto';
        }
    }

    showLoading() {
        const loading = document.getElementById('search-loading');
        if (loading) {
            loading.classList.remove('hidden');
            loading.style.pointerEvents = 'none'; // No interfiere con interacciones
            loading.style.visibility = 'visible';
        }
    }

    displayResults(results, sources = []) {
        const container = this.getResultsContainer();
        if (!container) return;

        if (!results || results.length === 0) {
            this.displayNoResults(sources);
            return;
        }

        const sourcesHtml = sources.length > 0 ? 
            `<div class="sources-used">Fuentes: ${sources.join(', ')}</div>` : '';
        
        const resultsHtml = results.map((result, index) => 
            this.createResultItemHTML(result, index)
        ).join('');

        container.innerHTML = sourcesHtml + resultsHtml;
        
        // Configurar event listeners para los items
        this.setupResultItemListeners(container);
        
        // Mostrar resultados con posicionamiento ajustado
        this.showResults();
        
        // Actualizar atributos de accesibilidad
        const tituloInput = document.getElementById('titulo');
        if (tituloInput) {
            tituloInput.setAttribute('aria-expanded', 'true');
        }
    }

    setupResultItemListeners(container) {
        container.querySelectorAll('.autocomplete-item').forEach(item => {
            // Click event
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.selectResult(item);
            });
            
            // Mouse events
            item.addEventListener('mouseenter', () => this.setActiveItem(item));
            item.addEventListener('mouseleave', () => {
                // Solo quitar active si no está seleccionado por teclado
                if (!item.hasAttribute('data-keyboard-selected')) {
                    item.classList.remove('active');
                    item.setAttribute('aria-selected', 'false');
                }
            });
        });
    }

    handleKeyNavigation(e) {
        const container = this.getResultsContainer();
        if (!container || container.classList.contains('hidden')) {
            // Si no hay resultados visibles, permitir navegación normal
            return;
        }

        const items = container.querySelectorAll('.autocomplete-item');
        if (items.length === 0) return;

        const activeItem = container.querySelector('.autocomplete-item.active');
        let newIndex = -1;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!activeItem) {
                    newIndex = 0;
                } else {
                    const currentIndex = parseInt(activeItem.dataset.index);
                    newIndex = (currentIndex + 1) % items.length;
                }
                this.setActiveItemByIndex(items, newIndex, true);
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (!activeItem) {
                    newIndex = items.length - 1;
                } else {
                    const currentIndex = parseInt(activeItem.dataset.index);
                    newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
                }
                this.setActiveItemByIndex(items, newIndex, true);
                break;

            case 'Enter':
                e.preventDefault();
                if (activeItem) {
                    this.selectResult(activeItem);
                } else if (items.length > 0) {
                    // Si no hay item activo, seleccionar el primero
                    this.selectResult(items[0]);
                }
                break;

            case 'Escape':
                e.preventDefault();
                this.hideResults();
                // Enfocar de nuevo el input
                const tituloInput = document.getElementById('titulo');
                if (tituloInput) tituloInput.focus();
                break;

            case 'Tab':
                // Permitir navegación normal con Tab, pero cerrar dropdown
                this.hideResults();
                break;
        }
    }

    setActiveItemByIndex(items, index, keyboardSelected = false) {
        // Remover active y keyboard-selected de todos los items
        items.forEach(item => {
            item.classList.remove('active');
            item.setAttribute('aria-selected', 'false');
            item.removeAttribute('data-keyboard-selected');
        });

        // Activar el item seleccionado
        if (items[index]) {
            items[index].classList.add('active');
            items[index].setAttribute('aria-selected', 'true');
            
            if (keyboardSelected) {
                items[index].setAttribute('data-keyboard-selected', 'true');
            }
            
            // Scroll si es necesario
            items[index].scrollIntoView({ 
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }

    setActiveItem(item) {
        // Remover active de todos los items
        const container = this.getResultsContainer();
        if (container) {
            container.querySelectorAll('.autocomplete-item').forEach(i => {
                i.classList.remove('active');
                i.setAttribute('aria-selected', 'false');
                i.removeAttribute('data-keyboard-selected');
            });
        }

        // Activar item actual
        item.classList.add('active');
        item.setAttribute('aria-selected', 'true');
    }

    selectResult(item) {
        const data = {
            title: item.dataset.title,
            artist: item.dataset.artist,
            genre: item.dataset.genre,
            duration: item.dataset.duration
        };

        // Rellenar formulario
        this.fillForm(data);
        
        // Ocultar resultados inmediatamente
        this.hideResults();
        
        // Mostrar confirmación
        this.showSuccessMessage('✅ Información completada automáticamente');
        
        // Enfocar siguiente campo con pequeño delay
        setTimeout(() => {
            const tiempoInput = document.getElementById('tiempo');
            if (tiempoInput) {
                tiempoInput.focus();
                tiempoInput.select(); // Seleccionar texto existente si lo hay
            }
        }, 100);
    }

    // Método adicional para mejorar la experiencia móvil
    adjustForMobile() {
        const isMobile = window.innerWidth <= 768;
        const container = this.getResultsContainer();
        
        if (container && isMobile) {
            // En móviles, ajustar altura máxima
            container.style.maxHeight = '250px';
            
            // Ajustar padding de items para mejor touch
            container.querySelectorAll('.autocomplete-item').forEach(item => {
                item.style.minHeight = '60px';
                item.style.padding = '12px 16px';
            });
        }
    }

    // Override del método displayResults para incluir ajustes móviles
    displayResults(results, sources = []) {
        const container = this.getResultsContainer();
        if (!container) return;

        if (!results || results.length === 0) {
            this.displayNoResults(sources);
            return;
        }

        const sourcesHtml = sources.length > 0 ? 
            `<div class="sources-used">Fuentes: ${sources.join(', ')}</div>` : '';
        
        const resultsHtml = results.map((result, index) => 
            this.createResultItemHTML(result, index)
        ).join('');

        container.innerHTML = sourcesHtml + resultsHtml;
        
        // Configurar event listeners
        this.setupResultItemListeners(container);
        
        // Ajustar para móvil si es necesario
        this.adjustForMobile();
        
        // Mostrar resultados
        this.showResults();
        
        // Actualizar accesibilidad
        const tituloInput = document.getElementById('titulo');
        if (tituloInput) {
            tituloInput.setAttribute('aria-expanded', 'true');
        }
    }

    // Método para limpiar completamente el autocompletado
    destroy() {
        this.removeExistingElements();
        this.cache.clear();
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Remover event listeners
        const tituloInput = document.getElementById('titulo');
        if (tituloInput) {
            tituloInput.removeAttribute('role');
            tituloInput.removeAttribute('aria-expanded');
            tituloInput.removeAttribute('aria-haspopup');
        }
        
        console.log('🗑️ Autocompletado destruido completamente');
    }
}

// ========================================
//    INICIALIZACIÓN MEJORADA
// ========================================

let musicAutocompleteInstance = null;

function initializeImprovedMusicAutocomplete() {
    try {
        // Destruir instancia anterior si existe
        if (musicAutocompleteInstance) {
            musicAutocompleteInstance.destroy();
        }
        
        // Crear nueva instancia con mejoras de posicionamiento
        musicAutocompleteInstance = new HybridMusicAutocompleteFixed();
        window.musicAutocomplete = musicAutocompleteInstance;
        
        // Funciones globales
        window.clearMusicCache = () => musicAutocompleteInstance.clearCache();
        window.getMusicStats = () => console.table(musicAutocompleteInstance.getStats());
        window.toggleMusicAPI = (api, enabled) => musicAutocompleteInstance.toggleAPI(api, enabled);
        window.adjustAutocompleteMobile = () => musicAutocompleteInstance.adjustForMobile();
        
        // Listener para cambios de orientación/resize
        window.addEventListener('resize', () => {
            if (musicAutocompleteInstance) {
                musicAutocompleteInstance.adjustForMobile();
            }
        });
        
        console.log('🌟 Autocompletado con posicionamiento mejorado inicializado');
        
    } catch (error) {
        console.error('💥 Error inicializando autocompletado mejorado:', error);
        
        // Fallback a la clase original si hay problemas
        try {
            musicAutocompleteInstance = new HybridMusicAutocomplete();
            window.musicAutocomplete = musicAutocompleteInstance;
            console.log('🔄 Fallback a autocompletado básico activado');
        } catch (fallbackError) {
            console.error('💥 Error crítico en fallback:', fallbackError);
        }
    }
}

// Inicialización con verificación de dependencias
function safeInitialization() {
    // Verificar que Chart.js esté cargado antes de inicializar
    if (typeof Chart !== 'undefined') {
        initializeImprovedMusicAutocomplete();
    } else {
        // Reintentar después de un breve delay
        setTimeout(safeInitialization, 100);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInitialization);
} else {
    safeInitialization();
}

// Exportar clases
window.HybridMusicAutocompleteFixed = HybridMusicAutocompleteFixed;

// ========================================
//    UTILIDADES ADICIONALES
// ========================================

// Función para forzar reposicionamiento si es necesario
window.fixAutocompletePosition = function() {
    const container = document.getElementById('autocomplete-results');
    if (container && musicAutocompleteInstance) {
        musicAutocompleteInstance.adjustResultsPosition(container);
    }
};

// Función para debug de posicionamiento
window.debugAutocompletePosition = function() {
    const input = document.getElementById('titulo');
    const container = document.getElementById('autocomplete-results');
    
    if (input && container) {
        const inputRect = input.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        console.log('🔍 Debug Posicionamiento:', {
            input: {
                top: inputRect.top,
                bottom: inputRect.bottom,
                left: inputRect.left,
                right: inputRect.right,
                height: inputRect.height
            },
            container: {
                top: containerRect.top,
                bottom: containerRect.bottom,
                left: containerRect.left,
                right: containerRect.right,
                height: containerRect.height,
                zIndex: window.getComputedStyle(container).zIndex,
                position: window.getComputedStyle(container).position
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
    }
};