// Web Audio API Alarm Synthesizer
class AlarmSynthesizer {
    constructor() {
        this.audioCtx = null;
        this.oscillator1 = null;
        this.oscillator2 = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.sweepInterval = null;
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    start() {
        if (this.isPlaying) return;
        this.init();
        
        // Resume context if suspended (browser security autoplays)
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.isPlaying = true;

        // Create Nodes
        this.oscillator1 = this.audioCtx.createOscillator();
        this.oscillator2 = this.audioCtx.createOscillator();
        this.gainNode = this.audioCtx.createGain();

        // Configure oscillators
        this.oscillator1.type = 'sawtooth';
        this.oscillator2.type = 'sine';

        // Sirene sweep logic (600Hz to 1100Hz back and forth)
        let frequency = 600;
        let direction = 1;
        
        this.oscillator1.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
        this.oscillator2.frequency.setValueAtTime(frequency * 0.98, this.audioCtx.currentTime);

        this.sweepInterval = setInterval(() => {
            if (!this.isPlaying) return;
            
            if (direction === 1) {
                frequency += 80;
                if (frequency >= 1100) direction = -1;
            } else {
                frequency -= 80;
                if (frequency <= 600) direction = 1;
            }
            
            // Apply frequency glide
            const time = this.audioCtx.currentTime + 0.05;
            this.oscillator1.frequency.exponentialRampToValueAtTime(frequency, time);
            this.oscillator2.frequency.exponentialRampToValueAtTime(frequency * 0.98, time);
        }, 50);

        // Connect Nodes
        this.oscillator1.connect(this.gainNode);
        this.oscillator2.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);

        // Siren gain/volume pulsing
        this.gainNode.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.1);

        this.oscillator1.start();
        this.oscillator2.start();
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        
        if (this.sweepInterval) {
            clearInterval(this.sweepInterval);
            this.sweepInterval = null;
        }

        try {
            this.oscillator1.stop();
            this.oscillator2.stop();
            this.oscillator1.disconnect();
            this.oscillator2.disconnect();
            this.gainNode.disconnect();
        } catch (e) {
            // Safe catch
        }

        this.oscillator1 = null;
        this.oscillator2 = null;
        this.gainNode = null;
    }
}

// Global instances
const alarmSynth = new AlarmSynthesizer();
let eventSource = null;
let appState = {
    status: 'INITIALIZING',
    lastCheckedTime: null,
    lastError: null,
    isMonitoring: true,
    checkIntervalMs: 10000,
    isMuted: false,
    hasBaseline: false
};

// Connect to Server-Sent Events (SSE)
function connectSSE() {
    if (eventSource) {
        eventSource.close();
    }

    const connIndicator = document.getElementById('server-connection');

    eventSource = new EventSource('/events');

    eventSource.onopen = () => {
        connIndicator.textContent = 'BAĞLI';
        connIndicator.className = 'status-value connected';
    };

    eventSource.onerror = (e) => {
        connIndicator.textContent = 'BAĞLANTI KESİLDİ';
        connIndicator.className = 'status-value';
        
        // Retry connection in 3 seconds
        setTimeout(connectSSE, 3000);
    };

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'status') {
            handleStatusUpdate(data);
        } else if (data.type === 'logs') {
            handleLogsUpdate(data.logs);
        }
    };
}

// Handle real-time status packets
function handleStatusUpdate(data) {
    appState = { ...appState, ...data };
    
    // 1. Update Monitor State UI
    const stateText = document.getElementById('monitor-state-text');
    const intervalText = document.getElementById('monitor-interval-text');
    const toggleBtn = document.getElementById('toggle-monitor-btn');
    const headerPulse = document.getElementById('header-pulse');
    
    if (appState.isMonitoring) {
        stateText.textContent = 'AKTİF';
        stateText.className = 'status-display text-cyan';
        intervalText.textContent = `Sorgulama Aralığı: ${appState.checkIntervalMs / 1000}sn`;
        toggleBtn.innerHTML = '<span class="material-icons-round">pause</span> Durdur';
        toggleBtn.className = 'btn btn-secondary';
        headerPulse.className = 'pulse-indicator status-cyan';
    } else {
        stateText.textContent = 'DURDURULDU';
        stateText.className = 'status-display text-muted';
        intervalText.textContent = 'İzleme pasif durumda';
        toggleBtn.innerHTML = '<span class="material-icons-round">play_arrow</span> Başlat';
        toggleBtn.className = 'btn btn-primary';
        headerPulse.className = 'pulse-indicator';
    }

    // 2. Update Mute Button UI
    const muteBtn = document.getElementById('toggle-mute-btn');
    if (appState.isMuted) {
        muteBtn.innerHTML = '<span class="material-icons-round">volume_off</span> Sesi Aç';
        muteBtn.className = 'btn btn-warning';
    } else {
        muteBtn.innerHTML = '<span class="material-icons-round">volume_up</span> Sesi Kapat';
        muteBtn.className = 'btn btn-secondary';
    }

    // 3. Update Interval Settings Input
    const intervalSlider = document.getElementById('interval-slider');
    const intervalVal = document.getElementById('interval-val');
    intervalSlider.value = appState.checkIntervalMs / 1000;
    intervalVal.textContent = appState.checkIntervalMs / 1000;

    // Update URL and Cookie inputs if they are not active/focused
    const urlInput = document.getElementById('target-url-input');
    const cookieInput = document.getElementById('cookie-input');
    const urlLink = document.getElementById('target-url-link');

    if (urlInput && document.activeElement !== urlInput) {
        urlInput.value = appState.targetUrl || '';
    }
    if (cookieInput && document.activeElement !== cookieInput) {
        cookieInput.value = appState.sessionCookie || '';
    }
    if (urlLink) {
        urlLink.href = appState.targetUrl || 'https://ista-wld.ng112.gov.tr/NG112UC/environmentCheck.html';
        urlLink.textContent = appState.targetUrl || 'https://ista-wld.ng112.gov.tr/NG112UC/environmentCheck.html';
    }

    // 4. Update Screen Condition Card
    const condCard = document.getElementById('condition-card');
    const condIcon = document.getElementById('condition-icon');
    const condText = document.getElementById('condition-text');
    const lastCheckText = document.getElementById('last-checked-text');
    
    let condClass = 'text-green';
    let condIconName = 'check_circle';
    let condLabel = 'BAŞLATILIYOR';

    if (appState.status === 'INITIALIZING') {
        condLabel = 'BAŞLATILIYOR';
        condIconName = 'pending';
        condClass = 'text-cyan';
    } else if (appState.status === 'NO_CHANGE') {
        condLabel = 'DEĞİŞİKLİK YOK';
        condIconName = 'check_circle';
        condClass = 'text-green';
    } else if (appState.status === 'CHANGED') {
        condLabel = 'DEĞİŞİKLİK VAR!';
        condIconName = 'warning';
        condClass = 'text-red';
    } else if (appState.status === 'ERROR') {
        condLabel = 'SUNUCU HATASI';
        condIconName = 'report_problem';
        condClass = 'text-orange';
    }

    condText.textContent = condLabel;
    condText.className = `status-display ${condClass}`;
    condIcon.textContent = condIconName;
    condIcon.className = `material-icons-round ${condClass}`;
    
    // Update timestamp
    if (appState.lastCheckedTime) {
        const date = new Date(appState.lastCheckedTime);
        lastCheckText.textContent = `Son Kontrol: ${date.toLocaleTimeString()}`;
    } else {
        lastCheckText.textContent = 'Son Kontrol: Bekleniyor';
    }

    // 5. Manage Alarms
    const alarmOverlay = document.getElementById('alarm-overlay');
    if (appState.status === 'CHANGED' && !appState.isMuted) {
        alarmOverlay.classList.remove('hidden');
        alarmSynth.start();
        
        // Fetch and show diff immediately
        loadDiff();
    } else {
        alarmOverlay.classList.add('hidden');
        alarmSynth.stop();
    }
}

// Render server logs
function handleLogsUpdate(logs) {
    const logList = document.getElementById('log-list');
    if (logs.length === 0) {
        logList.innerHTML = '<div class="log-placeholder">Log kaydı henüz oluşmadı.</div>';
        return;
    }

    logList.innerHTML = logs.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        let logClass = 'log-info';
        
        if (log.type === 'alert') logClass = 'log-alert';
        else if (log.type === 'error') logClass = 'log-error';

        return `
            <div class="log-item ${logClass}">
                <div class="log-time">${time}</div>
                <div class="log-msg">${log.message}</div>
            </div>
        `;
    }).join('');
}

// Fetch visual diff from api and render it
async function loadDiff() {
    const diffContainer = document.getElementById('diff-content');
    
    if (appState.status !== 'CHANGED' && appState.status !== 'ERROR') {
        diffContainer.innerHTML = `
            <div class="diff-placeholder">
                <span class="material-icons-round">done_all</span>
                <p>Sayfa şu an referans şablonuyla (baseline) birebir aynı.</p>
                <span class="sub-placeholder">Herhangi bir değişiklik veya hata olduğunda, HTML karşılaştırması satır bazlı olarak burada listelenecektir.</span>
            </div>
        `;
        return;
    }

    if (appState.status === 'ERROR') {
        diffContainer.innerHTML = `
            <div class="diff-placeholder">
                <span class="material-icons-round text-orange">cloud_off</span>
                <p>Bağlantı Hatası Detayları</p>
                <span class="sub-placeholder" style="color: var(--color-orange);">${appState.lastError || 'Bilinmeyen bağlantı hatası.'}</span>
            </div>
        `;
        return;
    }

    diffContainer.innerHTML = '<div class="diff-placeholder"><p>Karşılaştırma detayları yükleniyor...</p></div>';

    try {
        const response = await fetch('/api/diff');
        const data = await response.json();
        
        if (!data.baseline || !data.current) {
            diffContainer.innerHTML = '<div class="diff-placeholder"><p>Karşılaştırma verileri eksik.</p></div>';
            return;
        }

        // Format HTML to display line by line
        const formatHtml = (html) => {
            // Add newlines before tags to break long string into readable lines
            return html
                .replace(/>\s*</g, '>\n<')
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
        };

        const baselineLines = formatHtml(data.baseline);
        const currentLines = formatHtml(data.current);

        // Simple line-by-line diff implementation (simplified LCS/comparison)
        let diffHtml = '<div class="diff-view">';
        
        let i = 0;
        let j = 0;
        
        while (i < baselineLines.length || j < currentLines.length) {
            const lineBase = baselineLines[i];
            const lineCurr = currentLines[j];

            if (lineBase === lineCurr) {
                diffHtml += `<div class="diff-line normal">${escapeHtml(lineBase)}</div>`;
                i++;
                j++;
            } else {
                // If they differ, look ahead to see if it is an addition or deletion
                let lookAheadMatch = false;
                
                // Check if current line exists later in baseline (meaning lines were deleted)
                for (let k = i + 1; k < Math.min(i + 10, baselineLines.length); k++) {
                    if (baselineLines[k] === lineCurr) {
                        // Lines from i to k-1 were deleted
                        for (let d = i; d < k; d++) {
                            diffHtml += `<div class="diff-line removed">- ${escapeHtml(baselineLines[d])}</div>`;
                        }
                        i = k;
                        lookAheadMatch = true;
                        break;
                    }
                }
                
                if (!lookAheadMatch) {
                    // Check if baseline line exists later in current (meaning lines were added)
                    for (let k = j + 1; k < Math.min(j + 10, currentLines.length); k++) {
                        if (currentLines[k] === lineBase) {
                            // Lines from j to k-1 were added
                            for (let a = j; a < k; a++) {
                                diffHtml += `<div class="diff-line added">+ ${escapeHtml(currentLines[a])}</div>`;
                            }
                            j = k;
                            lookAheadMatch = true;
                            break;
                        }
                    }
                }

                if (!lookAheadMatch) {
                    // Fallback: show replacement (line deleted, line added)
                    if (lineBase !== undefined) {
                        diffHtml += `<div class="diff-line removed">- ${escapeHtml(lineBase)}</div>`;
                        i++;
                    }
                    if (lineCurr !== undefined) {
                        diffHtml += `<div class="diff-line added">+ ${escapeHtml(lineCurr)}</div>`;
                        j++;
                    }
                }
            }
            
            // Safeguard to prevent infinite loops
            if (i >= baselineLines.length && j >= currentLines.length) break;
        }

        diffHtml += '</div>';
        diffContainer.innerHTML = diffHtml;

    } catch (e) {
        diffContainer.innerHTML = `<div class="diff-placeholder"><p>Detay yükleme hatası: ${e.message}</p></div>`;
    }
}

// Escape HTML tags to prevent execution in dashboard diff viewer
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Send settings payload to server
async function updateSettings(settings) {
    try {
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
    } catch (e) {
        console.error('Failed to update settings:', e);
    }
}

// Bind UI actions
function setupEventListeners() {
    // Start / Stop Toggle
    document.getElementById('toggle-monitor-btn').addEventListener('click', () => {
        // Initialize AudioContext if not done (gesture required)
        alarmSynth.init();
        updateSettings({ isMonitoring: !appState.isMonitoring });
    });

    // Mute Toggle
    document.getElementById('toggle-mute-btn').addEventListener('click', () => {
        alarmSynth.init();
        updateSettings({ isMuted: !appState.isMuted });
    });

    // Silence Alarm overlay button
    document.getElementById('silence-alarm-btn').addEventListener('click', () => {
        updateSettings({ isMuted: true });
    });

    // Test Sound
    document.getElementById('test-sound-btn').addEventListener('click', async () => {
        alarmSynth.init();
        // Play local browser test sound first
        const testOsc = alarmSynth.audioCtx.createOscillator();
        const testGain = alarmSynth.audioCtx.createGain();
        testOsc.type = 'sine';
        testOsc.frequency.setValueAtTime(800, alarmSynth.audioCtx.currentTime);
        testGain.gain.setValueAtTime(0.1, alarmSynth.audioCtx.currentTime);
        
        testOsc.connect(testGain);
        testGain.connect(alarmSynth.audioCtx.destination);
        testOsc.start();
        testGain.gain.exponentialRampToValueAtTime(0.001, alarmSynth.audioCtx.currentTime + 1.0);
        setTimeout(() => testOsc.stop(), 1000);

        // Call backend to test Windows alarm
        try {
            await fetch('/api/test-sound', { method: 'POST' });
        } catch (e) {
            console.error('Failed to trigger OS sound test:', e);
        }
    });

    // Reset baseline
    document.getElementById('reset-baseline-btn').addEventListener('click', async () => {
        if (confirm('Referans durumu sıfırlansın mı? Sayfanın şu anki hali yeni referans şablonu (baseline) olarak kaydedilecektir.')) {
            try {
                await fetch('/api/reset-baseline', { method: 'POST' });
            } catch (e) {
                console.error(e);
            }
        }
    });

    // Refresh diff
    document.getElementById('refresh-diff-btn').addEventListener('click', loadDiff);

    // Interval slider
    const intervalSlider = document.getElementById('interval-slider');
    const intervalVal = document.getElementById('interval-val');
    
    intervalSlider.addEventListener('input', (e) => {
        intervalVal.textContent = e.target.value;
    });

    intervalSlider.addEventListener('change', (e) => {
        updateSettings({ checkIntervalMs: e.target.value * 1000 });
    });

    // Target URL input change
    document.getElementById('target-url-input').addEventListener('change', (e) => {
        updateSettings({ targetUrl: e.target.value.trim() });
    });

    // Cookie input change
    document.getElementById('cookie-input').addEventListener('change', (e) => {
        updateSettings({ sessionCookie: e.target.value.trim() });
    });
}

// Start
window.addEventListener('load', () => {
    setupEventListeners();
    connectSSE();
    
    // Auto refresh diff periodically if page is in warning state
    setInterval(() => {
        if (appState.status === 'CHANGED' || appState.status === 'ERROR') {
            loadDiff();
        }
    }, 5000);
});
