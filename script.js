const audioPlayer = document.getElementById('audioPlayer');
const audioSource = document.getElementById('audioSource');
const audioInput = document.getElementById('audioInput');
const titleInput = document.getElementById('titleInput');
const artistInput = document.getElementById('artistInput');
const lrcInput = document.getElementById('lrcInput');
const loadLyricsBtn = document.getElementById('loadLyricsBtn');

const songTitle = document.getElementById('songTitle');
const artistName = document.getElementById('artistName');
const lyricsBox = document.getElementById('lyricsBox');
const themeToggle = document.getElementById('themeToggle');
const playPauseBtn = document.getElementById('playPauseBtn');
const songProgress = document.getElementById('songProgress');
const currentTimeLabel = document.getElementById('currentTimeLabel');
const durationLabel = document.getElementById('durationLabel');

// Tombol Shuffle & Repeat
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

const showInputToggle = document.getElementById('showInputToggle');
const inputModal = document.getElementById('inputModal');
const closeInputModalBtn = document.getElementById('closeInputModalBtn');

const settingsToggle = document.getElementById('settingsToggle');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const resetBgBtn = document.getElementById('resetBgBtn');

const bgImageInput = document.getElementById('bgImageInput');
const bgOverlay = document.getElementById('bgOverlay');
const footerTextInput = document.getElementById('footerTextInput');
const footerText = document.getElementById('footerText');

// Visualizer Canvas
const canvas = document.getElementById('rgbVisualizer');
const ctx = canvas.getContext('2d');
let audioCtx, analyser, sourceNode, isAudioInitialized = false;
let parsedLyrics = [];

// Status Player State
let isShuffleActive = false;
let isRepeatActive = false;

const defaultLrc = `[00.00] I'm gonna find my way
[05.00] Through the darkest night
[10.00] And into the light
[15.00] Cause I believe in you...`;

lrcInput.value = defaultLrc;

function formatTime(seconds) {
    let m = Math.floor(seconds / 60);
    let s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

// Inisialisasi Audio Visualizer API
function initAudioVisualizer() {
    if (isAudioInitialized) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        
        sourceNode = audioCtx.createMediaElementSource(audioPlayer);
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        analyser.fftSize = 32;
        isAudioInitialized = true;
        drawVisualizer();
    } catch (e) {
        console.log("Audio API Error: ", e);
    }
}

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const bufferLength = analyser ? analyser.frequencyBinCount : 16;
    const dataArray = new Uint8Array(bufferLength);

    if (analyser && !audioPlayer.paused) {
        analyser.getByteFrequencyData(dataArray);
    } else {
        dataArray.fill(10);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let barWidth = (canvas.width / bufferLength) * 1.5;
    let x = 4;

    for (let i = 0; i < bufferLength; i++) {
        let barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
        ctx.fillStyle = i % 2 === 0 ? '#ff7b00' : '#718096';
        
        let radius = 4;
        let yPos = canvas.height - barHeight - 4;
        
        ctx.beginPath();
        ctx.roundRect(x, yPos, barWidth - 3, barHeight, [radius, radius, 0, 0]);
        ctx.fill();

        x += barWidth + 2;
    }
}

function parseLrc(text) {
    const lines = text.split('\n');
    const result = [];
    const regex = /\[(\d+)(?::(\d+))?\.(\d+)\](.*)/;

    lines.forEach(line => {
        const match = line.match(regex);
        if (match) {
            let minutes = match[2] ? parseInt(match[1]) : 0;
            let seconds = match[2] ? parseInt(match[2]) : parseInt(match[1]);
            let milliseconds = parseInt(match[3]) / 100;
            let totalTime = (minutes * 60) + seconds + milliseconds;
            let textContent = match[4].trim();
            result.push({ time: totalTime, text: textContent });
        }
    });
    return result.sort((a, b) => a.time - b.time);
}

function renderLyrics(lyricsArray) {
    lyricsBox.innerHTML = '';
    if (lyricsArray.length === 0) {
        lyricsBox.innerHTML = `<div class="line active">Tidak ada lirik</div>`;
        return;
    }
    lyricsArray.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = `line ${index === 0 ? 'active' : ''}`;
        div.setAttribute('data-time', item.time);
        div.textContent = item.text;
        lyricsBox.appendChild(div);
    });
}

parsedLyrics = parseLrc(defaultLrc);
renderLyrics(parsedLyrics);

// Play / Pause Control
playPauseBtn.addEventListener('click', () => {
    initAudioVisualizer();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseBtn.textContent = '⏸';
    } else {
        audioPlayer.pause();
        playPauseBtn.textContent = '▶';
    }
});

// Fungsionalitas Tombol Shuffle (Acak)
shuffleBtn.addEventListener('click', () => {
    isShuffleActive = !isShuffleActive;
    shuffleBtn.classList.toggle('active-state', isShuffleActive);
    // Jika shuffle aktif, beri notifikasi kecil atau efek acak waktu pemutaran (opsional)
});

// Fungsionalitas Tombol Repeat (Ulangi)
repeatBtn.addEventListener('click', () => {
    isRepeatActive = !isRepeatActive;
    repeatBtn.classList.toggle('active-state', isRepeatActive);
    audioPlayer.loop = isRepeatActive;
});

// Tombol Skip Prev / Next (Kembali ke awal atau restart lagu)
prevBtn.addEventListener('click', () => {
    audioPlayer.currentTime = 0;
});

nextBtn.addEventListener('click', () => {
    if (!isNaN(audioPlayer.duration)) {
        audioPlayer.currentTime = audioPlayer.duration;
    }
});

audioPlayer.addEventListener('timeupdate', () => {
    if (!isNaN(audioPlayer.duration)) {
        let progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        songProgress.value = progressPercent;
        currentTimeLabel.textContent = formatTime(audioPlayer.currentTime);
        durationLabel.textContent = formatTime(audioPlayer.duration);
    }

    const currentTime = audioPlayer.currentTime;
    const lineElements = lyricsBox.querySelectorAll('.line');

    parsedLyrics.forEach((item, index) => {
        let nextTime = parsedLyrics[index + 1] ? parsedLyrics[index + 1].time : Infinity;
        if (currentTime >= item.time && currentTime < nextTime) {
            const currentActive = lyricsBox.querySelector('.line.active');
            const targetLine = lineElements[index];
            if (currentActive !== targetLine) {
                currentActive?.classList.remove('active');
                targetLine.classList.add('active');
                lyricsBox.scrollTo({
                    top: targetLine.offsetTop - lyricsBox.clientHeight / 2 + targetLine.clientHeight / 2,
                    behavior: 'smooth'
                });
            }
        }
    });
});

songProgress.addEventListener('input', () => {
    if (!isNaN(audioPlayer.duration)) {
        audioPlayer.currentTime = (songProgress.value / 100) * audioPlayer.duration;
    }
});

// Load Media & Lirik
loadLyricsBtn.addEventListener('click', () => {
    songTitle.textContent = titleInput.value || 'Perfect Day';
    artistName.textContent = artistInput.value || 'The Weekend';

    parsedLyrics = parseLrc(lrcInput.value);
    renderLyrics(parsedLyrics);

    if (audioInput.files && audioInput.files[0]) {
        audioSource.src = URL.createObjectURL(audioInput.files[0]);
        audioPlayer.load();
    }
    inputModal.classList.remove('active');
    alert('Media & lirik berhasil dimuat!');
});

// Modal Toggles
showInputToggle.addEventListener('click', () => inputModal.classList.add('active'));
closeInputModalBtn.addEventListener('click', () => inputModal.classList.remove('active'));
settingsToggle.addEventListener('click', () => settingsModal.classList.add('active'));
closeSettingsModalBtn.addEventListener('click', () => settingsModal.classList.remove('active'));

// Theme Toggle Button (Light/Dark Mode)
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
});

// Save Settings
saveSettingsBtn.addEventListener('click', () => {
    if (bgImageInput.files && bgImageInput.files[0]) {
        bgOverlay.style.backgroundImage = `url('${URL.createObjectURL(bgImageInput.files[0])}')`;
    }
    footerText.textContent = footerTextInput.value;
    settingsModal.classList.remove('active');
});

// Reset Background
resetBgBtn.addEventListener('click', () => {
    bgOverlay.style.backgroundImage = 'none';
    bgImageInput.value = '';
    alert('Background berhasil direset!');
});
