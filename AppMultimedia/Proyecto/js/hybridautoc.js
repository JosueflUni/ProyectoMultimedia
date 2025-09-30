// ========================================
//    SISTEMA HÍBRIDO DE AUTOCOMPLETADO MUSICAL - VERSIÓN FINAL
//    🎵 MusicBrainz + iTunes + Base Local + Cache + Posicionamiento Mejorado
// ========================================

class HybridMusicAutocomplete {
    constructor() {
        this.searchTimeout = null;
        this.currentResults = [];
        this.isSearching = false;
        this.initialized = false;
        
        // 💾 Cache multinivel
        this.cache = new Map();
        this.localStorageKey = 'musicCache_v2';
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 horas
        
        // 🎯 APIs
        this.apis = {
            musicbrainz: { baseUrl: 'https://musicbrainz.org/ws/2', rateLimitMs: 1000, lastRequest: 0, enabled: true },
            itunes: { baseUrl: 'https://itunes.apple.com/search', rateLimitMs: 200, lastRequest: 0, enabled: true }
        };
        
        // 🎼 Base de datos local
        this.localDatabase = this.initializeLocalDatabase();
        
        // 📊 Estadísticas
        this.stats = { searches: 0, cacheHits: 0, apiCalls: 0, averageResponseTime: 0 };
        
        this.init();
    }

    init() {
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
            console.log('🎵 Autocompletado inicializado -', this.localDatabase.length, 'canciones locales');
        } catch (error) {
            console.error('❌ Error inicializando:', error);
        }
    }

    // ========================================
    //    CACHE
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
                console.log('💾 Cache:', this.cache.size, 'entradas');
            }
        } catch (error) {
            console.warn('⚠️ Error cache:', error);
        }
    }

    saveCacheToStorage() {
        try {
            const cacheData = {};
            const now = Date.now();
            this.cache.forEach((results, key) => {
                cacheData[key] = { results, timestamp: now };
            });
            localStorage.setItem(this.localStorageKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('⚠️ Error guardando cache');
        }
    }

    getCachedResults(query) {
        return this.cache.get(query.toLowerCase().trim());
    }

    setCachedResults(query, results) {
        this.cache.set(query.toLowerCase().trim(), results);
        if (this.stats.searches % 5 === 0) this.saveCacheToStorage();
    }

    // ========================================
    //    BASE DE DATOS LOCAL
    // ========================================

    initializeLocalDatabase() {
        return [
            // Rock Clásico
            { title: 'Bohemian Rhapsody', artist: 'Queen', genre: 'Rock', duration: 6, year: 1975, popularity: 100 },
            { title: 'Stairway to Heaven', artist: 'Led Zeppelin', genre: 'Rock', duration: 8, year: 1971, popularity: 98 },
            { title: 'Hotel California', artist: 'Eagles', genre: 'Rock', duration: 7, year: 1976, popularity: 95 },
            { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', genre: 'Rock', duration: 6, year: 1987, popularity: 90 },
            { title: 'Smoke on the Water', artist: 'Deep Purple', genre: 'Rock', duration: 5, year: 1972, popularity: 88 },
            
            // Pop
            { title: 'Billie Jean', artist: 'Michael Jackson', genre: 'Pop', duration: 5, year: 1982, popularity: 100 },
            { title: 'Thriller', artist: 'Michael Jackson', genre: 'Pop', duration: 6, year: 1982, popularity: 95 },
            { title: 'Yesterday', artist: 'The Beatles', genre: 'Pop', duration: 2, year: 1965, popularity: 100 },
            { title: 'Hey Jude', artist: 'The Beatles', genre: 'Pop', duration: 7, year: 1968, popularity: 95 },
            { title: 'Shape of You', artist: 'Ed Sheeran', genre: 'Pop', duration: 4, year: 2017, popularity: 95 },
            { title: 'Blinding Lights', artist: 'The Weeknd', genre: 'Pop', duration: 3, year: 2019, popularity: 92 },
            
            // Alternativo/Grunge
            { title: 'Smells Like Teen Spirit', artist: 'Nirvana', genre: 'Grunge', duration: 5, year: 1991, popularity: 95 },
            { title: 'Come As You Are', artist: 'Nirvana', genre: 'Grunge', duration: 4, year: 1991, popularity: 85 },
            { title: 'Creep', artist: 'Radiohead', genre: 'Alternative', duration: 4, year: 1992, popularity: 85 },
            { title: 'Wonderwall', artist: 'Oasis', genre: 'Britpop', duration: 4, year: 1995, popularity: 85 },
            
            // Latino
            { title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', genre: 'Reggaeton', duration: 4, year: 2017, popularity: 98 },
            { title: 'Con Altura', artist: 'Rosalía ft. J Balvin', genre: 'Reggaeton', duration: 3, year: 2019, popularity: 85 },
            { title: 'Maldito Duende', artist: 'Héroes del Silencio', genre: 'Rock Español', duration: 4, year: 1990, popularity: 85 },
            
            // Electronic
            { title: 'Levels', artist: 'Avicii', genre: 'Electronic', duration: 3, year: 2011, popularity: 90 },
            { title: 'Titanium', artist: 'David Guetta ft. Sia', genre: 'Electronic', duration: 4, year: 2011, popularity: 85 },
            
            // Hip-Hop/R&B
            { title: 'Lose Yourself', artist: 'Eminem', genre: 'Hip-Hop', duration: 5, year: 2002, popularity: 95 },
            { title: 'Crazy in Love', artist: 'Beyoncé', genre: 'R&B', duration: 4, year: 2003, popularity: 85 },
            
            // Otros
            { title: 'No Woman No Cry', artist: 'Bob Marley', genre: 'Reggae', duration: 7, year: 1974, popularity: 90 },
            { title: 'What a Wonderful World', artist: 'Louis Armstrong', genre: 'Jazz', duration: 2, year: 1967, popularity: 90 }
        ];
    }

    searchLocalDatabase(query) {
        const q = query.toLowerCase().trim();
        const words = q.split(' ').filter(w => w.length > 1);
        
        return this.localDatabase
            .map(song => {
                let score = 0;
                const title = song.title.toLowerCase();
                const artist = song.artist.toLowerCase();
                
                if (title.startsWith(q)) score += 100;
                if (artist.startsWith(q)) score += 90;
                if (title.includes(q)) score += 70;
                if (artist.includes(q)) score += 60;
                
                words.forEach(w => {
                    if (title.includes(w)) score += 40;
                    if (artist.includes(w)) score += 35;
                });
                
                score += (song.popularity || 50) * 0.2;
                
                return { ...song, score, source: 'local' };
            })
            .filter(s => s.score > 15)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
    }

    // ========================================
    //    INTERFAZ - POSICIONAMIENTO MEJORADO
    // ========================================

    createAutocompleteElements() {
        const input = document.getElementById('titulo');
        if (!input) return;

        const formGroup = input.closest('.form-group');
        if (formGroup) {
            formGroup.style.position = 'relative';
            formGroup.style.zIndex = '10';
            formGroup.style.marginBottom = '30px';
        }

        this.removeExistingElements();

        // Contenedor de resultados
        const results = document.createElement('div');
        results.id = 'autocomplete-results';
        results.className = 'autocomplete-results hidden';
        Object.assign(results.style, {
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '0',
            right: '0',
            zIndex: '9999'
        });

        // Indicador de carga
        const loading = document.createElement('div');
        loading.id = 'search-loading';
        loading.className = 'search-loading hidden';
        loading.innerHTML = `
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
        Object.assign(loading.style, {
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '0',
            right: '0',
            zIndex: '9998'
        });

        if (formGroup) {
            formGroup.appendChild(loading);
            formGroup.appendChild(results);
        }
    }

    removeExistingElements() {
        ['autocomplete-results', 'search-loading'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }

    setupEventListeners() {
        const input = document.getElementById('titulo');
        if (!input) return;

        input.setAttribute('autocomplete', 'off');
        input.setAttribute('spellcheck', 'false');

        input.addEventListener('input', (e) => this.handleSearch(e.target.value));
        input.addEventListener('keydown', (e) => this.handleKeyNavigation(e));
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.form-group') && !e.target.closest('.autocomplete-results')) {
                this.hideResults();
            }
        });
    }

    // ========================================
    //    BÚSQUEDA HÍBRIDA
    // ========================================

    async handleSearch(query) {
        if (this.searchTimeout) clearTimeout(this.searchTimeout);

        const q = query.trim();
        if (q.length < 2) {
            this.hideResults();
            return;
        }

        if (this.isSearching) return;

        const startTime = Date.now();
        this.stats.searches++;
        
        this.searchTimeout = setTimeout(() => this.performSearch(q, startTime), 300);
    }

    async performSearch(query, startTime) {
        this.isSearching = true;
        
        try {
            this.showLoading();
            let results = [];
            let sources = [];

            // Cache
            this.activateSource('cache');
            const cached = this.getCachedResults(query);
            if (cached?.length) {
                this.stats.cacheHits++;
                this.displayResults(cached, ['💾 Cache']);
                this.updateStats(startTime);
                return;
            }

            // Local
            this.activateSource('local');
            const local = this.searchLocalDatabase(query);
            if (local.length) {
                results.push(...local);
                sources.push('📚 Local');
                this.displayResults(local, sources);
            }

            // APIs externas
            const apis = [];
            
            if (this.canMakeRequest('musicbrainz')) {
                this.activateSource('musicbrainz');
                apis.push(this.searchMusicBrainz(query).then(r => ({ source: '🎵 MusicBrainz', results: r })));
            }
            
            if (this.canMakeRequest('itunes')) {
                this.activateSource('itunes');
                apis.push(this.searchItunes(query).then(r => ({ source: '🍎 iTunes', results: r })));
            }

            if (apis.length) {
                this.stats.apiCalls += apis.length;
                
                const apiResults = await Promise.race([
                    Promise.all(apis),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
                ]).catch(() => []);

                apiResults.forEach(({ source, results: r }) => {
                    if (r?.length) {
                        results.push(...r);
                        sources.push(source);
                    }
                });
            }

            const final = this.processResults(results);
            
            if (final.length) {
                this.setCachedResults(query, final);
                this.displayResults(final, sources);
            } else {
                this.displayNoResults(sources);
            }

            this.updateStats(startTime);

        } catch (error) {
            console.error('Error búsqueda:', error);
            this.showError('Error en la búsqueda');
        } finally {
            this.hideLoading();
            this.isSearching = false;
        }
    }

    // ========================================
    //    APIs EXTERNAS
    // ========================================

    canMakeRequest(api) {
        const a = this.apis[api];
        return a?.enabled && (Date.now() - a.lastRequest) >= a.rateLimitMs;
    }

    async searchMusicBrainz(query) {
        try {
            this.apis.musicbrainz.lastRequest = Date.now();
            
            const response = await fetch(
                `${this.apis.musicbrainz.baseUrl}/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=6`,
                { 
                    headers: { 'User-Agent': 'MusicTracker/1.0' },
                    signal: AbortSignal.timeout(4000)
                }
            );
            
            if (!response.ok) return [];
            
            const data = await response.json();
            return (data.recordings || [])
                .filter(r => r.title && r['artist-credit']?.[0]?.name)
                .map(r => ({
                    title: r.title,
                    artist: r['artist-credit'][0].name,
                    genre: r.tags?.[0]?.name || 'Unknown',
                    duration: r.length ? Math.round(r.length / 60000) : 3,
                    year: r['first-release-date']?.substring(0, 4) || null,
                    source: 'musicbrainz',
                    score: 75
                }));
        } catch (error) {
            return [];
        }
    }

    async searchItunes(query) {
        try {
            this.apis.itunes.lastRequest = Date.now();
            
            const response = await fetch(
                `${this.apis.itunes.baseUrl}?term=${encodeURIComponent(query)}&media=music&entity=song&limit=6`,
                { signal: AbortSignal.timeout(3000) }
            );
            
            if (!response.ok) return [];
            
            const data = await response.json();
            return (data.results || [])
                .filter(t => t.trackName && t.artistName)
                .map(t => ({
                    title: t.trackName,
                    artist: t.artistName,
                    genre: t.primaryGenreName || 'Pop',
                    duration: t.trackTimeMillis ? Math.round(t.trackTimeMillis / 60000) : 3,
                    year: t.releaseDate?.substring(0, 4) || null,
                    source: 'itunes',
                    score: 70
                }));
        } catch (error) {
            return [];
        }
    }

    processResults(results) {
        const seen = new Set();
        const unique = results.filter(item => {
            if (!item.title || !item.artist) return false;
            const key = `${item.title}-${item.artist}`.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return unique
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 8);
    }

    // ========================================
    //    VISUALIZACIÓN
    // ========================================

    displayResults(results, sources = []) {
        const container = document.getElementById('autocomplete-results');
        if (!container || !results?.length) {
            this.displayNoResults(sources);
            return;
        }

        const sourcesHtml = sources.length ? 
            `<div class="sources-used">Fuentes: ${sources.join(', ')}</div>` : '';
        
        const itemsHtml = results.map((r, i) => `
            <div class="autocomplete-item ${r.source}" 
                 data-index="${i}"
                 data-title="${this.escape(r.title)}"
                 data-artist="${this.escape(r.artist)}"
                 data-genre="${this.escape(r.genre)}"
                 data-duration="${r.duration || 3}">
                <div class="song-info">
                    <div class="song-title">
                        ${this.getIcon(r.source)} ${this.escape(r.title)}
                    </div>
                    <div class="song-details">
                        👤 ${this.escape(r.artist)} • 🎼 ${this.escape(r.genre)}
                        ${r.year ? ` • 📅 ${r.year}` : ''}
                    </div>
                </div>
                <div class="song-duration">⏱️ ${r.duration || 3} min</div>
            </div>
        `).join('');

        container.innerHTML = sourcesHtml + itemsHtml;
        this.setupItemListeners(container);
        this.showResults();
    }

    setupItemListeners(container) {
        container.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.selectResult(item);
            });
            item.addEventListener('mouseenter', () => this.setActive(item));
        });
    }

    displayNoResults(sources) {
        const container = document.getElementById('autocomplete-results');
        if (!container) return;

        container.innerHTML = `
            ${sources.length ? `<div class="sources-used">Consultadas: ${sources.join(', ')}</div>` : ''}
            <div class="no-results">
                🎵 Sin resultados
                <p style="margin-top: 8px; font-size: 13px; opacity: 0.8;">
                    Intenta con otros términos
                </p>
            </div>
        `;
        this.showResults();
    }

    selectResult(item) {
        const fields = ['titulo', 'artista', 'genero', 'tiempo'];
        const data = ['title', 'artist', 'genre', 'duration'];
        
        fields.forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) {
                el.value = item.dataset[data[i]];
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        this.hideResults();
        
        if (window.musicTracker?.showSuccess) {
            window.musicTracker.showSuccess('✅ Información completada');
        }

        setTimeout(() => document.getElementById('tiempo')?.focus(), 100);
    }

    // ========================================
    //    NAVEGACIÓN TECLADO
    // ========================================

    handleKeyNavigation(e) {
        const container = document.getElementById('autocomplete-results');
        if (!container || container.classList.contains('hidden')) return;

        const items = container.querySelectorAll('.autocomplete-item');
        if (!items.length) return;

        const active = container.querySelector('.active');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                const nextIdx = active ? (parseInt(active.dataset.index) + 1) % items.length : 0;
                this.setActive(items[nextIdx]);
                break;

            case 'ArrowUp':
                e.preventDefault();
                const prevIdx = active ? (parseInt(active.dataset.index) || items.length) - 1 : items.length - 1;
                this.setActive(items[prevIdx]);
                break;

            case 'Enter':
                e.preventDefault();
                if (active) this.selectResult(active);
                else if (items[0]) this.selectResult(items[0]);
                break;

            case 'Escape':
                e.preventDefault();
                this.hideResults();
                break;

            case 'Tab':
                this.hideResults();
                break;
        }
    }

    setActive(item) {
        document.querySelectorAll('.autocomplete-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    // ========================================
    //    UTILIDADES
    // ========================================

    showResults() {
        const c = document.getElementById('autocomplete-results');
        if (c) {
            c.classList.remove('hidden');
            c.style.pointerEvents = 'auto';
            c.style.visibility = 'visible';
        }
    }

    hideResults() {
        ['autocomplete-results', 'search-loading'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('hidden');
                el.style.pointerEvents = 'none';
                el.style.visibility = 'hidden';
            }
        });
        
        document.querySelectorAll('.source.active').forEach(s => s.classList.remove('active'));
    }

    showLoading() {
        const l = document.getElementById('search-loading');
        if (l) {
            l.classList.remove('hidden');
            l.style.visibility = 'visible';
        }
    }

    hideLoading() {
        const l = document.getElementById('search-loading');
        if (l) {
            l.classList.add('hidden');
            l.style.visibility = 'hidden';
        }
    }

    activateSource(name) {
        const s = document.getElementById(`source-${name}`);
        if (s) s.classList.add('active');
    }

    showError(msg) {
        const c = document.getElementById('autocomplete-results');
        if (c) {
            c.innerHTML = `<div class="error-message">⚠️ ${msg}</div>`;
            this.showResults();
        }
    }

    updateStats(startTime) {
        const time = Date.now() - startTime;
        this.stats.averageResponseTime = Math.round(
            (this.stats.averageResponseTime * (this.stats.searches - 1) + time) / this.stats.searches
        );
    }

    getIcon(source) {
        return { local: '📚', musicbrainz: '🎵', itunes: '🍎', cache: '💾' }[source] || '🎵';
    }

    escape(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    // API Pública
    clearCache() {
        this.cache.clear();
        localStorage.removeItem(this.localStorageKey);
        console.log('🗑️ Cache limpiado');
    }

    getStats() {
        return { ...this.stats };
    }

    destroy() {
        this.removeExistingElements();
        this.cache.clear();
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
    }
}

// ========================================
//    INICIALIZACIÓN
// ========================================

let musicAutocomplete = null;

function initMusicAutocomplete() {
    try {
        if (musicAutocomplete) musicAutocomplete.destroy();
        
        musicAutocomplete = new HybridMusicAutocomplete();
        window.musicAutocomplete = musicAutocomplete;
        
        // Funciones globales
        window.clearMusicCache = () => musicAutocomplete.clearCache();
        window.getMusicStats = () => console.table(musicAutocomplete.getStats());
        
        console.log('🌟 Autocompletado listo');
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMusicAutocomplete);
} else {
    initMusicAutocomplete();
}