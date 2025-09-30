// ========================================
//    MUSIC TRACKER - APLICACIÓN PRINCIPAL CORREGIDA
// ========================================

class MusicTracker {
    constructor() {
        this.musicData = this.loadDataFromStorage();
        this.genreChart = null;
        this.timeChart = null;
        
        console.log('🎵 Iniciando Music Tracker...');
        console.log('📊 Datos cargados:', this.musicData.length, 'canciones');
        
        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    // ========================================
    //    INICIALIZACIÓN
    // ========================================

    init() {
        try {
            this.setupEventListeners();
            this.updateDisplay();
            this.initializeCharts();
            console.log('✅ Music Tracker inicializado correctamente');
            console.log('📈 Gráficos creados');
        } catch (error) {
            console.error('❌ Error al inicializar:', error);
            this.showError('Error al inicializar la aplicación');
        }
    }

    setupEventListeners() {
        // Formulario de agregar canciones
        const songForm = document.getElementById('songForm');
        if (songForm) {
            songForm.addEventListener('submit', (e) => this.handleSongSubmit(e));
            console.log('📝 Event listener del formulario configurado');
        } else {
            console.error('❌ Formulario no encontrado');
        }
    }

    // ========================================
    //    GESTIÓN DE DATOS
    // ========================================

    loadDataFromStorage() {
        try {
            const stored = localStorage.getItem('musicData');
            if (stored) {
                const data = JSON.parse(stored);
                console.log('📂 Datos cargados desde localStorage:', data.length, 'canciones');
                return Array.isArray(data) ? data : [];
            }
            console.log('📂 No hay datos previos, iniciando con array vacío');
            return [];
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            return [];
        }
    }

    handleSongSubmit(e) {
        e.preventDefault();
        
        try {
            console.log('📝 Procesando nueva canción...');
            
            // Obtener datos del formulario
            const formData = this.getFormData();
            console.log('📋 Datos del formulario:', formData);
            
            // Validar datos
            if (!this.validateSongData(formData)) {
                this.showError('Por favor completa todos los campos correctamente');
                return;
            }

            // Crear objeto de canción
            const songData = this.createSongObject(formData);
            console.log('🎵 Objeto canción creado:', songData);
            
            // Agregar a los datos
            this.addSong(songData);
            
            // Limpiar formulario
            this.clearForm();
            
            // Actualizar interfaz
            this.updateDisplay();
            this.updateCharts();
            
            // Mostrar mensaje de éxito
            this.showSuccess('✅ Canción agregada exitosamente');
            
        } catch (error) {
            console.error('❌ Error al agregar canción:', error);
            this.showError('Error al agregar la canción. Inténtalo de nuevo.');
        }
    }

    getFormData() {
        const titulo = document.getElementById('titulo');
        const artista = document.getElementById('artista');
        const genero = document.getElementById('genero');
        const tiempo = document.getElementById('tiempo');

        if (!titulo || !artista || !genero || !tiempo) {
            throw new Error('Elementos del formulario no encontrados');
        }

        return {
            titulo: titulo.value.trim(),
            artista: artista.value.trim(),
            genero: genero.value,
            tiempo: parseInt(tiempo.value) || 0
        };
    }

    validateSongData(data) {
        const isValid = data.titulo && 
                       data.artista && 
                       data.genero && 
                       data.tiempo && 
                       data.tiempo > 0;
        
        console.log('✓ Validación de datos:', isValid ? 'ÉXITO' : 'FALLO', data);
        return isValid;
    }

    createSongObject(formData) {
        const now = new Date();
        return {
            id: Date.now() + Math.random(), // ID más único
            titulo: formData.titulo,
            artista: formData.artista,
            genero: formData.genero,
            tiempo: formData.tiempo,
            fecha: now.toLocaleDateString('es-ES'),
            timestamp: now.toISOString(),
            dateAdded: now.getTime() // Para ordenamiento
        };
    }

    addSong(songData) {
        this.musicData.push(songData);
        this.saveToLocalStorage();
        console.log('💾 Canción agregada. Total:', this.musicData.length);
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('musicData', JSON.stringify(this.musicData));
            console.log('💾 Datos guardados en localStorage');
        } catch (error) {
            console.error('❌ Error al guardar en localStorage:', error);
            this.showError('Error al guardar los datos');
        }
    }

    clearForm() {
        const form = document.getElementById('songForm');
        if (form) {
            form.reset();
            console.log('🗑️ Formulario limpiado');
        }
    }

    // ========================================
    //    ACTUALIZACIÓN DE INTERFAZ
    // ========================================

    updateDisplay() {
        console.log('🔄 Actualizando interfaz...');
        this.updateSongsList();
        this.updateStats();
        console.log('✅ Interfaz actualizada');
    }

    updateSongsList() {
        const songsList = document.getElementById('songsList');
        if (!songsList) {
            console.error('❌ Lista de canciones no encontrada');
            return;
        }

        // Ordenar por fecha más reciente
        const sortedSongs = [...this.musicData].sort((a, b) => {
            return (b.dateAdded || b.id) - (a.dateAdded || a.id);
        });

        const recentSongs = sortedSongs.slice(0, 10); // Mostrar más canciones
        
        if (recentSongs.length === 0) {
            songsList.innerHTML = `
                <div class="no-songs" style="text-align: center; padding: 30px; color: #666;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🎵</div>
                    <h3 style="margin-bottom: 10px;">No hay canciones registradas</h3>
                    <p>¡Agrega tu primera canción usando el formulario!</p>
                </div>
            `;
            return;
        }

        songsList.innerHTML = recentSongs.map((song, index) => this.createSongHTML(song, index)).join('');
        console.log('📋 Lista actualizada con', recentSongs.length, 'canciones');
    }

    createSongHTML(song, index) {
        return `
            <div class="song-item" data-id="${song.id}" style="animation-delay: ${index * 100}ms;">
                <div class="song-info">
                    <div class="song-details">
                        <h4 title="${this.escapeHTML(song.titulo)}">${this.escapeHTML(song.titulo)}</h4>
                        <p title="${this.escapeHTML(song.artista)} - ${this.escapeHTML(song.genero)}">
                            👤 ${this.escapeHTML(song.artista)} • 🎼 ${this.escapeHTML(song.genero)}
                            ${song.fecha ? ` • 📅 ${song.fecha}` : ''}
                        </p>
                    </div>
                    <div class="listening-time">⏱️ ${song.tiempo} min</div>
                </div>
            </div>
        `;
    }

    updateStats() {
        const stats = this.calculateStats();
        console.log('📊 Estadísticas calculadas:', stats);
        
        this.updateStatElement('totalSongs', stats.totalSongs);
        this.updateStatElement('totalTime', `${stats.totalTime}`);
        this.updateStatElement('favoriteGenre', stats.favoriteGenre);
        this.updateStatElement('averageTime', `${stats.averageTime}`);
    }

    calculateStats() {
        if (this.musicData.length === 0) {
            return {
                totalSongs: 0,
                totalTime: 0,
                averageTime: 0,
                favoriteGenre: '-'
            };
        }

        const totalSongs = this.musicData.length;
        const totalTime = this.musicData.reduce((sum, song) => sum + (song.tiempo || 0), 0);
        const averageTime = totalSongs > 0 ? Math.round(totalTime / totalSongs) : 0;
        
        // Calcular género favorito
        const genreCounts = {};
        this.musicData.forEach(song => {
            if (song.genero) {
                genreCounts[song.genero] = (genreCounts[song.genero] || 0) + 1;
            }
        });
        
        const favoriteGenre = Object.keys(genreCounts).length > 0 
            ? Object.keys(genreCounts).reduce((a, b) => genreCounts[a] > genreCounts[b] ? a : b)
            : '-';

        return {
            totalSongs,
            totalTime,
            averageTime,
            favoriteGenre
        };
    }

    updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`⚠️ Elemento estadística no encontrado: ${id}`);
        }
    }

    // ========================================
    //    GRÁFICOS
    // ========================================

    initializeCharts() {
        console.log('📈 Inicializando gráficos...');
        
        // Pequeño delay para asegurar que el DOM esté listo
        setTimeout(() => {
            this.initializeGenreChart();
            this.initializeTimeChart();
            this.updateCharts();
        }, 100);
    }

    initializeGenreChart() {
        const genreCtx = document.getElementById('genreChart');
        if (!genreCtx) {
            console.error('❌ Canvas del gráfico de géneros no encontrado');
            return;
        }

        // Destruir gráfico anterior si existe
        if (this.genreChart) {
            this.genreChart.destroy();
        }

        try {
            this.genreChart = new Chart(genreCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                            '#4BC0C0', '#FF9F40'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} min (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
            console.log('✅ Gráfico de géneros creado');
        } catch (error) {
            console.error('❌ Error creando gráfico de géneros:', error);
        }
    }

    initializeTimeChart() {
        const timeCtx = document.getElementById('timeChart');
        if (!timeCtx) {
            console.error('❌ Canvas del gráfico de tiempo no encontrado');
            return;
        }

        // Destruir gráfico anterior si existe
        if (this.timeChart) {
            this.timeChart.destroy();
        }

        try {
            this.timeChart = new Chart(timeCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Minutos escuchados',
                        data: [],
                        borderColor: '#1DB954',
                        backgroundColor: 'rgba(29, 185, 84, 0.1)',
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: '#1DB954',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + ' min';
                                }
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });
            console.log('✅ Gráfico de tiempo creado');
        } catch (error) {
            console.error('❌ Error creando gráfico de tiempo:', error);
        }
    }

    updateCharts() {
        console.log('🔄 Actualizando gráficos...');
        this.updateGenreChart();
        this.updateTimeChart();
    }

    updateGenreChart() {
        if (!this.genreChart) {
            console.warn('⚠️ Gráfico de géneros no inicializado');
            return;
        }

        const genreTime = {};
        this.musicData.forEach(song => {
            if (song.genero && song.tiempo) {
                genreTime[song.genero] = (genreTime[song.genero] || 0) + song.tiempo;
            }
        });

        this.genreChart.data.labels = Object.keys(genreTime);
        this.genreChart.data.datasets[0].data = Object.values(genreTime);
        this.genreChart.update('active');
        console.log('📊 Gráfico de géneros actualizado:', genreTime);
    }

    updateTimeChart() {
        if (!this.timeChart) {
            console.warn('⚠️ Gráfico de tiempo no inicializado');
            return;
        }

        const dailyTime = {};
        this.musicData.forEach(song => {
            if (song.fecha && song.tiempo) {
                dailyTime[song.fecha] = (dailyTime[song.fecha] || 0) + song.tiempo;
            }
        });

        // Ordenar fechas
        const sortedDates = Object.keys(dailyTime).sort((a, b) => {
            const dateA = new Date(a.split('/').reverse().join('-'));
            const dateB = new Date(b.split('/').reverse().join('-'));
            return dateA - dateB;
        });

        this.timeChart.data.labels = sortedDates;
        this.timeChart.data.datasets[0].data = sortedDates.map(date => dailyTime[date]);
        this.timeChart.update('active');
        console.log('📈 Gráfico de tiempo actualizado:', dailyTime);
    }

    // ========================================
    //    UTILIDADES
    // ========================================

    escapeHTML(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
        console.error('🚨', message);
    }

    showNotification(message, type = 'info') {
        // Remover notificaciones anteriores
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const styles = {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 25px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease',
            maxWidth: '400px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            backgroundColor: type === 'success' ? '#1DB954' : type === 'error' ? '#ff4444' : '#667eea'
        };

        Object.assign(notification.style, styles);
        document.body.appendChild(notification);

        // Animación de entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);

        // Remover después de 4 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);
    }

    // ========================================
    //    MÉTODOS PÚBLICOS
    // ========================================

    exportData() {
        try {
            const dataStr = JSON.stringify(this.musicData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `music_tracker_${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            this.showSuccess('📥 Datos exportados correctamente');
        } catch (error) {
            console.error('❌ Error exportando:', error);
            this.showError('Error al exportar los datos');
        }
    }

    clearAllData() {
        if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
            this.musicData = [];
            this.saveToLocalStorage();
            this.updateDisplay();
            this.updateCharts();
            this.showSuccess('🗑️ Todos los datos han sido eliminados');
        }
    }

    // Método para debug
    debugInfo() {
        console.log('🐛 DEBUG INFO:');
        console.log('📊 Total canciones:', this.musicData.length);
        console.log('💾 LocalStorage:', localStorage.getItem('musicData')?.length || 0, 'caracteres');
        console.log('📈 Gráficos:', {
            genreChart: !!this.genreChart,
            timeChart: !!this.timeChart
        });
        console.log('🎵 Datos:', this.musicData);
        return this.musicData;
    }
}

// ========================================
//    INICIALIZACIÓN GLOBAL
// ========================================

// Crear instancia global cuando el DOM esté listo
let musicTracker = null;

function initializeMusicTracker() {
    try {
        musicTracker = new MusicTracker();
        window.musicTracker = musicTracker;
        
        // Funciones globales de utilidad
        window.exportMusicData = () => musicTracker.exportData();
        window.clearMusicData = () => musicTracker.clearAllData();
        window.debugMusicTracker = () => musicTracker.debugInfo();
        
        console.log('🌟 Music Tracker inicializado globalmente');
    } catch (error) {
        console.error('💥 Error crítico al inicializar:', error);
    }
}

// Asegurar inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMusicTracker);
} else {
    initializeMusicTracker();
}

// Para debugging en consola
window.getMusicData = () => {
    if (window.musicTracker) {
        return window.musicTracker.musicData;
    }
    return JSON.parse(localStorage.getItem('musicData') || '[]');
};