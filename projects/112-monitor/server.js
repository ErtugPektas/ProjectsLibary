const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const BASELINE_FILE = path.join(__dirname, 'baseline.html');
const LOG_FILE = path.join(__dirname, 'logs.json');

// Global state variables
let isMonitoring = true;
let checkIntervalMs = 10000; // default 10 seconds
let isMuted = false;
let monitorStatus = 'INITIALIZING'; // INITIALIZING, NO_CHANGE, CHANGED, ERROR
let lastCheckedTime = null;
let lastError = null;
let baselineHtml = null;
let lastCleanedHtml = null;
let sseClients = [];
let monitorTimeout = null;

let targetUrl = 'https://ista-wld.ng112.gov.tr/NG112UC/environmentCheck.html';
let sessionCookie = '';

// Initialize log and baseline files if they exist
if (fs.existsSync(BASELINE_FILE)) {
    baselineHtml = fs.readFileSync(BASELINE_FILE, 'utf8');
    monitorStatus = 'NO_CHANGE';
}

function getLogs() {
    if (!fs.existsSync(LOG_FILE)) {
        return [];
    }
    try {
        return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

function writeLog(entry) {
    const logs = getLogs();
    logs.unshift({
        timestamp: new Date().toISOString(),
        ...entry
    });
    // Limit log size to 1000 entries
    if (logs.length > 1000) logs.pop();
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
    broadcast({ type: 'logs', logs: logs.slice(0, 50) }); // Send top 50 to client
}

// Clean dynamic components from JSF/PrimeFaces HTML output
function cleanHtml(html) {
    if (!html) return '';
    // 1. Remove jsessionid (e.g. ;jsessionid=...)
    let cleaned = html.replace(/;jsessionid=[a-zA-Z0-9_\-!]+/g, '');
    
    // 2. Remove ViewState hidden input fields
    cleaned = cleaned.replace(/<input[^>]*javax\.faces\.ViewState[^>]*>/gi, '');
    
    // 3. Remove as_fid hidden input fields
    cleaned = cleaned.replace(/<input[^>]*as_fid[^>]*>/gi, '');
    
    // 4. Normalize captcha dynamic properties (like random math in refreshCaptcha)
    cleaned = cleaned.replace(/src="captcha\.png[^"]*"/gi, 'src="captcha.png"');
    
    // 5. Replace all whitespace/tabs/newlines with a single space
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

// Play sound on Windows using Powershell
function triggerWindowsAlarm(type = 'change') {
    if (isMuted) return;
    
    let command = '';
    if (type === 'test') {
        command = `powershell -Command "[Console]::Beep(600, 200); [Console]::Beep(800, 200); (New-Object -ComObject Sapi.SpVoice).Speak('Ses testi başarılı!')"`;
    } else if (type === 'error') {
        command = `powershell -Command "[Console]::Beep(400, 500); [Console]::Beep(400, 500); (New-Object -ComObject Sapi.SpVoice).Speak('Sayfa hatası oluştu!')"`;
    } else {
        // System change alert
        command = `powershell -Command "[Console]::Beep(800, 300); [Console]::Beep(1000, 300); [Console]::Beep(800, 300); [Console]::Beep(1000, 300); (New-Object -ComObject Sapi.SpVoice).Speak('Ortam kontrol sayfasında değişiklik tespit edildi!')"`;
    }
    
    exec(command, (err) => {
        if (err) {
            console.error('Error playing Windows sound:', err);
        }
    });
}

// Fetch the website
function fetchPage() {
    return new Promise((resolve, reject) => {
        const url = targetUrl;
        
        // bypass SSL validation issues
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (err) {
            return reject(new Error('Geçersiz URL formatı'));
        }

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            agent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'tr,en-US;q=0.7,en;q=0.3'
            },
            timeout: 5000
        };

        if (sessionCookie) {
            options.headers['Cookie'] = sessionCookie;
        }

        const reqLib = parsedUrl.protocol === 'https:' ? https : http;

        const req = reqLib.get(options, (res) => {
            const { statusCode } = res;
            if (statusCode !== 200) {
                return reject(new Error(`Server returned HTTP status ${statusCode}`));
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                resolve(rawData);
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Bağlantı zaman aşımına uğradı'));
        });
    });
}

// Core monitoring loop
async function runCheck() {
    if (!isMonitoring) return;
    
    lastCheckedTime = new Date().toISOString();
    
    try {
        const html = await fetchPage();
        const cleaned = cleanHtml(html);
        
        lastCleanedHtml = cleaned;
        lastError = null;

        if (!baselineHtml) {
            // First time running, set the baseline
            baselineHtml = cleaned;
            fs.writeFileSync(BASELINE_FILE, html, 'utf8'); // save raw baseline
            monitorStatus = 'NO_CHANGE';
            
            writeLog({
                type: 'info',
                message: 'Başlangıç durum şablonu (baseline) oluşturuldu.'
            });
        } else if (cleaned !== baselineHtml) {
            // Screen has changed!
            if (monitorStatus !== 'CHANGED') {
                monitorStatus = 'CHANGED';
                writeLog({
                    type: 'alert',
                    message: 'Sayfa içeriğinde değişiklik tespit edildi!'
                });
                triggerWindowsAlarm('change');
            }
        } else {
            // No changes
            if (monitorStatus !== 'NO_CHANGE') {
                monitorStatus = 'NO_CHANGE';
                writeLog({
                    type: 'info',
                    message: 'Sayfa tekrar eski (baseline) durumuna döndü.'
                });
            }
        }
    } catch (err) {
        console.error('Monitor check error:', err.message);
        lastError = err.message;
        
        if (monitorStatus !== 'ERROR') {
            monitorStatus = 'ERROR';
            writeLog({
                type: 'error',
                message: `Bağlantı Hatası: ${err.message}`
            });
            triggerWindowsAlarm('error');
        }
    }
    
    // Broadcast status to web dashboard
    sendStatusUpdate();
    
    // Schedule next run
    if (isMonitoring) {
        monitorTimeout = setTimeout(runCheck, checkIntervalMs);
    }
}

// Broadcast helper for SSE
function broadcast(data) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(client => client.write(payload));
}

function sendStatusUpdate() {
    broadcast({
        type: 'status',
        status: monitorStatus,
        lastCheckedTime,
        lastError,
        isMonitoring,
        checkIntervalMs,
        isMuted,
        hasBaseline: !!baselineHtml,
        targetUrl,
        sessionCookie
    });
}

// Start and stop monitor functions
function startMonitor() {
    if (isMonitoring) return;
    isMonitoring = true;
    sendStatusUpdate();
    runCheck();
}

function stopMonitor() {
    isMonitoring = false;
    if (monitorTimeout) {
        clearTimeout(monitorTimeout);
        monitorTimeout = null;
    }
    sendStatusUpdate();
}

// HTTP Server
const server = http.createServer((req, res) => {
    // Enable CORS for frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // SSE Endpoint
    if (pathname === '/events') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        
        sseClients.push(res);
        
        // Send initial setup data
        res.write(`data: ${JSON.stringify({
            type: 'status',
            status: monitorStatus,
            lastCheckedTime,
            lastError,
            isMonitoring,
            checkIntervalMs,
            isMuted,
            hasBaseline: !!baselineHtml,
            targetUrl,
            sessionCookie
        })}\n\n`);
        
        res.write(`data: ${JSON.stringify({
            type: 'logs',
            logs: getLogs().slice(0, 50)
        })}\n\n`);

        req.on('close', () => {
            sseClients = sseClients.filter(c => c !== res);
        });
        return;
    }

    // API endpoints
    if (pathname === '/api/settings' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const settings = JSON.parse(body);
                let needsReset = false;

                if (settings.targetUrl !== undefined && settings.targetUrl !== targetUrl) {
                    targetUrl = settings.targetUrl;
                    needsReset = true;
                }
                if (settings.sessionCookie !== undefined && settings.sessionCookie !== sessionCookie) {
                    sessionCookie = settings.sessionCookie;
                    needsReset = true;
                }

                if (needsReset) {
                    // Reset baseline for the new page configuration
                    if (fs.existsSync(BASELINE_FILE)) {
                        fs.unlinkSync(BASELINE_FILE);
                    }
                    baselineHtml = null;
                    monitorStatus = 'INITIALIZING';
                    writeLog({
                        type: 'info',
                        message: 'Adres veya oturum çerezi değiştiği için referans sıfırlandı. Yeni şablon oluşturuluyor...'
                    });
                }

                if (settings.isMonitoring !== undefined) {
                    if (settings.isMonitoring) startMonitor();
                    else stopMonitor();
                }
                if (settings.checkIntervalMs !== undefined) {
                    checkIntervalMs = Math.max(2000, parseInt(settings.checkIntervalMs)); // Min 2 seconds
                    if (isMonitoring) {
                        stopMonitor();
                        startMonitor();
                    }
                }
                if (settings.isMuted !== undefined) {
                    isMuted = !!settings.isMuted;
                }

                if (needsReset && isMonitoring) {
                    stopMonitor();
                    startMonitor();
                } else {
                    sendStatusUpdate();
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid settings' }));
            }
        });
        return;
    }

    if (pathname === '/api/test-sound' && req.method === 'POST') {
        triggerWindowsAlarm('test');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    if (pathname === '/api/reset-baseline' && req.method === 'POST') {
        if (fs.existsSync(BASELINE_FILE)) {
            fs.unlinkSync(BASELINE_FILE);
        }
        baselineHtml = null;
        monitorStatus = 'INITIALIZING';
        writeLog({
            type: 'info',
            message: 'Referans şablonu (baseline) sıfırlandı. İlk kontrolde yeni şablon alınacaktır.'
        });
        sendStatusUpdate();
        
        // Trigger check immediately to populate baseline
        if (isMonitoring) {
            stopMonitor();
            startMonitor();
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    if (pathname === '/api/diff' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            baseline: baselineHtml,
            current: lastCleanedHtml
        }));
        return;
    }

    // Static files serving
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
    
    // Safety check to prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end(`Server error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Start listening and the monitor loop
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    
    // Create public directory if it doesn't exist
    if (!fs.existsSync(PUBLIC_DIR)) {
        fs.mkdirSync(PUBLIC_DIR);
    }
    
    // Start initial check loop
    runCheck();
});
