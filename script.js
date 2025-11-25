// Pages
const pages = {
    sound: document.getElementById('page-sound'),
    home: document.getElementById('page-home'),
    rules: document.getElementById('page-rules'),
    menu: document.getElementById('page-menu'),
    game: document.getElementById('page-game')
};

// Elements
const btnActivateSound = document.getElementById('btn-activate-sound');
const btnToggleSound = document.getElementById('btn-toggle-sound');
const btnPlay = document.getElementById('btn-play');
const btnRules = document.getElementById('btn-rules');
const btnEndGame = document.getElementById('btn-end-game');
const diffs = document.querySelectorAll('.diff');
const btnBacks = document.querySelectorAll('.btn-back');
const chronoEl = document.getElementById('chrono');

// Audio fallback
const musicFallback = document.getElementById('music-fallback');
const soundEndFallback = document.getElementById('sound-end-fallback');

// Web Audio API
let audioCtx, musicGain, coupsGain, musicSource, coupsBuffer;
let useWebAudio = false;

// Chrono
let timerInterval = null;
let timeLeft = 0;

// INIT AUDIO
async function initAudio() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        musicGain = audioCtx.createGain();
        coupsGain = audioCtx.createGain();
        musicGain.connect(audioCtx.destination);
        coupsGain.connect(audioCtx.destination);

        // musique
        const resMusic = await fetch('Msiquedroledebazar.mp3');
        const dataMusic = await resMusic.arrayBuffer();
        const bufferMusic = await audioCtx.decodeAudioData(dataMusic);

        musicSource = audioCtx.createBufferSource();
        musicSource.buffer = bufferMusic;
        musicSource.loop = true;
        musicSource.connect(musicGain);
        musicGain.gain.value = 1;
        musicSource.start();

        // coups
        const resCoups = await fetch('coups.mp3');
        const dataCoups = await resCoups.arrayBuffer();
        coupsBuffer = await audioCtx.decodeAudioData(dataCoups);
        coupsGain.gain.value = 1;

        useWebAudio = true;
    } catch(e) {
        console.warn('Web Audio impossible, fallback audio classique');
        musicFallback.play();
        useWebAudio = false;
    }
}

// Jouer son coups
function playCoups() {
    if(useWebAudio && coupsBuffer) {
        const src = audioCtx.createBufferSource();
        src.buffer = coupsBuffer;
        src.connect(coupsGain);
        src.start();
    } else {
        soundEndFallback.currentTime = 0;
        soundEndFallback.play();
    }
}

// Show page
function showPage(page) {
    Object.values(pages).forEach(p=>p.classList.remove('active'));
    page.classList.add('active');

    if(useWebAudio){
        musicGain.gain.value = (page===pages.home) ? 1 : 0.003;
    } else {
        musicFallback.volume = (page===pages.home) ? 1 : 0.003;
    }
}

// Chrono
function startTimer(sec) {
    clearInterval(timerInterval);
    timeLeft = sec;
    updateChrono();
    btnEndGame.style.display = 'none';

    timerInterval = setInterval(()=>{
        timeLeft--;
        updateChrono();
        if(timeLeft<=0){
            clearInterval(timerInterval);
            chronoEl.textContent = '00:00';
            playCoups();
            btnEndGame.style.display='block';
        }
    },1000);
}

function updateChrono() {
    const m = Math.floor(timeLeft/60);
    const s = timeLeft%60;
    chronoEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// Événements
btnActivateSound.addEventListener('click', async () => {
    await initAudio();
    showPage(pages.home);
});

btnToggleSound.addEventListener('click', ()=>{
    if(useWebAudio){
        if(musicGain.gain.value>0){
            musicGain.gain.value=0;
            btnToggleSound.textContent='🔇';
        } else {
            musicGain.gain.value=1;
            btnToggleSound.textContent='🔊';
        }
    } else {
        musicFallback.muted = !musicFallback.muted;
        btnToggleSound.textContent = musicFallback.muted ? '🔇':'🔊';
    }
});

btnPlay.addEventListener('click', ()=>showPage(pages.menu));
btnRules.addEventListener('click', ()=>showPage(pages.rules));

btnBacks.forEach(b=>b.addEventListener('click', ()=>{
    clearInterval(timerInterval);
    btnEndGame.style.display='none';
    showPage(pages.home);
}));

diffs.forEach(d=>{
    d.addEventListener('click', ()=>{
        startTimer(parseInt(d.dataset.sec));
        showPage(pages.game);
    });
});

btnEndGame.addEventListener('click', ()=>showPage(pages.menu));
