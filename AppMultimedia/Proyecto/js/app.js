// ========================================
//    MUSIC TRACKER - APLICACIÓN PRINCIPAL
// ========================================

class MusicTracker {
    constructor() {
        this.musicData = JSON.parse(localStorage.getItem('musicData')) || [];
        this.genreChart = null;
        this.timeChart = null;
        
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
        this.setupEventListeners();
        this.updateDisplay();
        this.initializeCharts();
        console.log('Music Tracker inicializado correctamente');
    }

    setupEventListeners() {
        // Formulario de agregar canciones
        const songForm = document.getElementById('songForm');
        if (songForm) {
            songForm.addEventListener('submit', (e) => this.handleSongSubmit(e));
        }

        // Otros eventos que se puedan agregar en el futuro
        // Por ejemplo: botones de exportar datos, limpiar historial, etc.
    }

    // ========================================
    //    MANEJO DE DATOS
    // ========================================

    handleSongSubmit(e) {
        e.preventDefault();
        
        try {
            // Obtener datos del formulario
            const formData = this.getFormData();
            
            // Validar datos
            if (!this.validateSongData(formData)) {
                this.showError('Por favor completa todos los campos correctamente');
                return;
            }

            // Crear objeto de canción
            const songData = this.createSongObject(formData);
            
            // Agregar a los datos
            this.addSong(songData);
            
            // Limpiar formulario
            this.clearForm();
            
            // Actualizar interfaz
            this.updateDisplay();
            this.updateCharts();
            
            // Mostrar mensaje de éxito
            this.showSuccess('Canción agregada exitosamente');
            
        } catch (error) {
            console.error('Error al agregar canción:', error);
            this.showError('Error al agregar la canción. Inténtalo de nuevo.');
        }
    }

    getFormData() {
        return {
            titulo: document.getElementById('titulo').value.trim(),
            artista: document.getElementById('artista').value.trim(),
            genero: document.getElementById('genero').value,
            tiempo: parseInt(document.getElementById('tiempo').value)
        };
    }

    validateSongData(data) {
        return data.titulo && 
               data.artista && 
               data.genero && 
               data.tiempo && 
               data.tiempo > 0;
    }

    createSongObject(formData) {
        return {
            id: Date.now(),
            titulo: formData.titulo,
            artista: formData.artista,
            genero: formData.genero,
            tiempo: formData.tiempo,
            fecha: new Date().toLocaleDateString('es-ES'),
            timestamp: new Date().toISOString()
        };
    }

    addSong(songData) {
        this.musicData.push(songData);
        this.saveToLocalStorage();
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('musicData', JSON.stringify(this.musicData));
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
            this.showError('Error al guardar los datos');
        }
    }

    clearForm() {
        const form = document.getElementById('songForm');
        if (form) {
            form.reset();
        }
    }

    // ========================================
    //    ACTUALIZACIÓN DE INTERFAZ
    // ========================================

    updateDisplay() {
        this.updateSongsList();
        this.updateStats();
    }

    updateSongsList() {
        const songsList = document.getElementById('songsList');
        if (!songsList) return;

        const recentSongs = this.musicData.slice(-5).reverse();
        
        if (recentSongs.length === 0) {
            songsList.innerHTML = `
                <div class="no-songs">
                    <p>No hay canciones registradas aún.</p>
                    <p>¡Agrega tu primera canción!</p>
                </div>
            `;
            return;
        }

        songsList.innerHTML = recentSongs.map(song => this.createSongHTML(song)).join('');
    }

    createSongHTML(song) {
        return `
            <div class="song-item" data-id="${song.id}">
                <div class="song-info">
                    <div class="song-details">
                        <h4>${this.escapeHTML(song.titulo)}</h4>
                        <p>${this.escapeHTML(song.artista)} • ${this.escapeHTML(song.genero)}</p>
                    </div>
                    <div class="listening-time">${song.tiempo} min</div>
                </div>
            </div>
        `;
    }

    updateStats() {
        const stats = this.calculateStats();
        
        this.updateStatElement('totalSongs', stats.totalSongs);
        this.updateStatElement('totalTime', stats.totalTime);
        this.updateStatElement('favoriteGenre', stats.favoriteGenre);
        this.updateStatElement('averageTime', stats.averageTime);
    }

    calculateStats() {
        const totalSongs = this.musicData.length;
        const totalTime = this.musicData.reduce((sum, song) => sum + song.tiempo, 0);
        const averageTime = totalSongs > 0 ? Math.round(totalTime / totalSongs) : 0;
        
        // Calcular género favorito
        const genreCounts = {};
        this.musicData.forEach(song => {
            genreCounts[song.genero] = (genreCounts[song.genero] || 0) + 1;
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
        }
    }

    // ========================================
    //    GRÁFICOS
    // ========================================

    initializeCharts() {
        this.initializeGenreChart();
        this.initializeTimeChart();
        this.updateCharts();
    }

    initializeGenreChart() {
        const genreCtx = document.getElementById('genreChart');
        if (!genreCtx) return;

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
                            padding: 20,
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
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} min (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    initializeTimeChart() {
        const timeCtx = document.getElementById('timeChart');
        if (!timeCtx) return;

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
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
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
    }

    updateCharts() {
        this.updateGenreChart();
        this.updateTimeChart();
    }

    updateGenreChart() {
        if (!this.genreChart) return;

        const genreCounts = {};
        this.musicData.forEach(song => {
            genreCounts[song.genero] = (genreCounts[song.genero] || 0) + song.tiempo;
        });

        this.genreChart.data.labels = Object.keys(genreCounts);
        this.genreChart.data.datasets[0].data = Object.values(genreCounts);
        this.genreChart.update('active');
    }

    updateTimeChart() {
        if (!this.timeChart) return;

        const dailyTime = {};
        this.musicData.forEach(song => {
            dailyTime[song.fecha] = (dailyTime[song.fecha] || 0) + song.tiempo;
        });

        const sortedDates = Object.keys(dailyTime).sort((a, b) => {
            return new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'));
        });

        this.timeChart.data.labels = sortedDates;
        this.timeChart.data.datasets[0].data = sortedDates.map(date => dailyTime[date]);
        this.timeChart.update('active');
    }

    // ========================================
    //    UTILIDADES
    // ========================================

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Estilos inline para la notificación
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '1000',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease',
            backgroundColor: type === 'success' ? '#1DB954' : '#ff4444'
        });

        document.body.appendChild(notification);

        // Animación de entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // ========================================
    //    MÉTODOS PÚBLICOS PARA FUTURAS EXPANSIONES
    // ========================================

    // Exportar datos
    exportData() {
        const dataStr = JSON.stringify(this.musicData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `music_tracker_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // Limpiar todos los datos
    clearAllData() {
        if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
            this.musicData = [];
            this.saveToLocalStorage();
            this.updateDisplay();
            this.updateCharts();
            this.showSuccess('Todos los datos han sido eliminados');
        }
    }

    // Obtener estadísticas detalladas
    getDetailedStats() {
        return {
            totalSongs: this.musicData.length,
            totalTime: this.musicData.reduce((sum, song) => sum + song.tiempo, 0),
            genres: [...new Set(this.musicData.map(song => song.genero))],
            artists: [...new Set(this.musicData.map(song => song.artista))],
            averageTimePerSong: this.musicData.length > 0 
                ? Math.round(this.musicData.reduce((sum, song) => sum + song.tiempo, 0) / this.musicData.length) 
                : 0
        }
    }
}