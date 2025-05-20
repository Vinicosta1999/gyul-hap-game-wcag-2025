// Código JavaScript corrigido
// Implementação do pool de áudio
const audioPool = [];
const MAX_POOL_SIZE = 10;

function getAudioInstance() {
    if (audioPool.length > 0) {
        return audioPool.pop();
    }
    return new Audio();
}

function releaseAudioInstance(audio) {
    if (audioPool.length < MAX_POOL_SIZE) {
        audio.pause();
        audio.currentTime = 0;
        audioPool.push(audio);
    }
}

// Função para carregar sons com fallback
function loadSound(src) {
    const audio = getAudioInstance();
    audio.src = src;
    audio.onerror = () => {
        console.warn(`Failed to load sound: ${src}`);
        releaseAudioInstance(audio);
    };
    return audio;
}

// Modificação do código de áudio existente
// ... (restante do código original com as devidas correções)