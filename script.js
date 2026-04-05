const landingScreen = document.getElementById('landingScreen');
const memoryScreen = document.getElementById('memoryScreen');
const enterButton = document.getElementById('enterButton');
const floatingLayer = document.getElementById('floatingLayer');
const screenOverlay = document.getElementById('screenOverlay');
const typedMessage = document.getElementById('typedMessage');
const typingCursor = document.getElementById('typingCursor');
const typingBox = document.querySelector('.typing-box');
const apologyPanel = document.querySelector('.apology-panel');
const responseCard = document.getElementById('responseCard');
const forgiveButton = document.getElementById('forgiveButton');
const madButton = document.getElementById('madButton');
const responseOverlay = document.getElementById('responseOverlay');
const responseText = document.getElementById('responseText');
const musicToggle = document.getElementById('musicToggle');
const bgMusic = document.getElementById('bg-music');
const floatingMusicButton = document.getElementById('floatingMusicButton');
const musicFallbackFrame = document.getElementById('musicFallbackFrame');
const pointerLayer = document.createElement('div');

pointerLayer.className = 'sparkle-layer';
pointerLayer.setAttribute('aria-hidden', 'true');
document.body.appendChild(pointerLayer);

const message = `Hey 🥺
I’m really sorry for what I said…
I didn’t mean to hurt you, but I know I did and that breaks my heart 💔
You are not just my Friend, you are my safe place 🫶
No matter how much we fight, you always stay, and I don’t say it enough but I’m so grateful for you 🥹💖
I admire you, your patience, your kindness, everything about you ✨
I’m so lucky to have you and I never want to lose you 😭
Please forgive me… I miss you so much 💕`;

const floatingEmojis = ['🥺', '💖', '💔', '✨', '💫', '💕'];
const emotionalTerms = [
  { term: 'miss you', className: 'glow-word--miss' },
  { term: 'safe place', className: 'glow-word--safe' },
  { term: 'grateful', className: 'glow-word--grateful' },
  { term: 'sorry', className: 'glow-word--sorry' },
  { term: 'Friend', className: 'glow-word--friend' },
];
const musicState = {
  active: false,
  audioContext: null,
  master: null,
  intervalId: null,
  beatIntervalId: null,
  notes: [261.63, 329.63, 392.0, 523.25, 440.0, 349.23],
};
const musicFadeState = {
  rafId: null,
};
let lastTrailStamp = 0;
let lastPointerPoint = { x: 0, y: 0 };

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightEmotionalTerms(value) {
  let output = escapeHtml(value);
  const tokens = [];

  emotionalTerms
    .slice()
    .sort((left, right) => right.term.length - left.term.length)
    .forEach(({ term, className }, index) => {
      const pattern = new RegExp(escapeRegExp(escapeHtml(term)), 'gi');
      const token = `[[HL_${index}]]`;

      output = output.replace(pattern, () => {
        tokens.push({ token, className, term });
        return token;
      });
    });

  tokens.forEach(({ token, className, term }) => {
    const tokenPattern = new RegExp(escapeRegExp(token), 'g');
    output = output.replace(
      tokenPattern,
      `<span class="glow-word ${className}">${escapeHtml(term)}</span>`
    );
  });

  return output.replace(/\n/g, '<br>');
}

function renderTypedMessage(value) {
  typedMessage.innerHTML = highlightEmotionalTerms(value);
}

function triggerHeartbeat() {
  if (!typingBox) {
    return;
  }

  typingBox.classList.remove('is-beating');
  void typingBox.offsetWidth;
  typingBox.classList.add('is-beating');

  window.setTimeout(() => {
    typingBox.classList.remove('is-beating');
  }, 900);
}

function createEffectParticle(x, y, symbol, className, extra = {}) {
  const particle = document.createElement('span');
  particle.className = className;
  particle.textContent = symbol;
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  particle.style.fontSize = extra.fontSize || `${14 + Math.random() * 14}px`;
  particle.style.animationDuration = extra.duration || `${900 + Math.random() * 900}ms`;
  particle.style.setProperty('--dx', extra.dx || `${Math.random() * 220 - 110}px`);
  particle.style.setProperty('--dy', extra.dy || `${Math.random() * 220 - 150}px`);
  (extra.target || document.body).appendChild(particle);

  window.setTimeout(() => particle.remove(), extra.removeAfter || 1800);
}

function burstSparkles(x, y, count = 10, target = document.body) {
  const symbols = ['✨', '💫', '🌟', '💖'];

  for (let index = 0; index < count; index += 1) {
    createEffectParticle(x, y, symbols[index % symbols.length], 'sparkle-trail', {
      duration: `${720 + Math.random() * 520}ms`,
      dx: `${Math.random() * 240 - 120}px`,
      dy: `${Math.random() * 220 - 140}px`,
      fontSize: `${10 + Math.random() * 10}px`,
      target,
      removeAfter: 1400,
    });
  }
}

function handlePointerTrail(event) {
  const now = performance.now();

  if (now - lastTrailStamp < 55) {
    return;
  }

  lastTrailStamp = now;
  lastPointerPoint = { x: event.clientX, y: event.clientY };

  createEffectParticle(event.clientX, event.clientY, '✨', 'sparkle-trail', {
    duration: `${700 + Math.random() * 520}ms`,
    dx: `${Math.random() * 120 - 60}px`,
    dy: `${Math.random() * 130 - 110}px`,
    fontSize: `${10 + Math.random() * 10}px`,
    target: pointerLayer,
    removeAfter: 1200,
  });
}

function handlePointerTap(event) {
  lastPointerPoint = { x: event.clientX, y: event.clientY };
  burstSparkles(event.clientX, event.clientY, 8, pointerLayer);
}

function setEmotionMode(mode) {
  responseOverlay.classList.remove('is-forgiveness', 'is-sad');
  responseCard.classList.remove('is-forgiveness', 'is-sad');

  if (mode) {
    responseOverlay.classList.add(`is-${mode}`);
    responseCard.classList.add(`is-${mode}`);
  }
}

function syncMusicState(isPlaying) {
  musicState.active = isPlaying;
  musicToggle.textContent = isPlaying ? 'Music: on' : 'Music: off';
  musicToggle.setAttribute('aria-pressed', String(isPlaying));

  if (floatingMusicButton) {
    floatingMusicButton.textContent = isPlaying ? '🎧 Song playing 💖' : '🎧 Play our song 💖';
    floatingMusicButton.setAttribute('aria-pressed', String(isPlaying));
  }
}

function fadeAudio(element, from, to, duration) {
  if (musicFadeState.rafId) {
    window.cancelAnimationFrame(musicFadeState.rafId);
  }

  const start = performance.now();
  element.volume = from;

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const nextVolume = from + (to - from) * progress;
    element.volume = Math.max(0, Math.min(1, nextVolume));

    if (progress < 1) {
      musicFadeState.rafId = window.requestAnimationFrame(step);
    } else {
      musicFadeState.rafId = null;
    }
  };

  musicFadeState.rafId = window.requestAnimationFrame(step);
}

async function playMusic() {
  if (!bgMusic) {
    return;
  }

  try {
    bgMusic.currentTime = 0;
    bgMusic.volume = 0;
    await bgMusic.play();
    fadeAudio(bgMusic, 0, 0.38, 2200);
    syncMusicState(true);

    if (musicState.audioContext && musicState.audioContext.state === 'suspended') {
      await musicState.audioContext.resume();
    }
  } catch (error) {
    if (musicFallbackFrame) {
      musicFallbackFrame.src = 'https://www.youtube.com/embed/bnVkf-z28YU?autoplay=1&loop=1&playlist=bnVkf-z28YU&controls=0&mute=0';
      musicFallbackFrame.classList.add('is-visible');
      syncMusicState(true);
    } else if (floatingMusicButton) {
      floatingMusicButton.classList.add('is-error');
      window.setTimeout(() => floatingMusicButton.classList.remove('is-error'), 1400);
    }
  }
}

function pauseMusic() {
  if (!bgMusic) {
    return;
  }

  fadeAudio(bgMusic, bgMusic.volume, 0, 1200);
  window.setTimeout(() => {
    bgMusic.pause();
    syncMusicState(false);
  }, 1250);
}

function createFloatingEmojis() {
  const count = 30;
  const animationNames = ['floatEmoji', 'floatEmojiSoft', 'floatEmojiDrift'];

  floatingLayer.innerHTML = '';

  for (let index = 0; index < count; index += 1) {
    const emoji = document.createElement('span');
    emoji.className = 'floating-emoji floating-emoji-rain';
    emoji.textContent = floatingEmojis[index % floatingEmojis.length];
    emoji.style.left = `${Math.random() * 100}%`;
    emoji.style.top = `${Math.random() * 100}%`;
    emoji.style.animationDuration = `${18 + Math.random() * 16}s`;
    emoji.style.animationDelay = `${Math.random() * -24}s`;
    emoji.style.fontSize = `${14 + Math.random() * 22}px`;
    emoji.style.animationName = animationNames[index % animationNames.length];
    emoji.style.setProperty('--drift-x', `${Math.random() * 60 - 30}px`);
    emoji.style.setProperty('--drift-y', `${Math.random() * 150 + 80}px`);
    floatingLayer.appendChild(emoji);
  }
}

function revealMemoryScreen() {
  landingScreen.classList.add('is-hidden');
  memoryScreen.classList.add('is-active', 'is-transitioning');
  document.body.classList.add('is-memory-mode');
  memoryScreen.setAttribute('aria-hidden', 'false');

  createTransitionSparkles();

  window.setTimeout(() => {
    memoryScreen.classList.remove('is-transitioning');
    createFloatingEmojis();
    startTyping();
  }, 1100);
}

function createTransitionSparkles() {
  const sparks = ['✨', '💕', '💖', '💫', '🫶'];

  for (let index = 0; index < 32; index += 1) {
    const spark = document.createElement('span');
    spark.className = 'scene-sparkle';
    spark.textContent = sparks[index % sparks.length];
    spark.style.left = `${44 + (Math.random() * 16 - 8)}vw`;
    spark.style.top = `${42 + (Math.random() * 18 - 9)}vh`;
    spark.style.setProperty('--dx', `${(Math.random() * 360 - 180).toFixed(0)}px`);
    spark.style.setProperty('--dy', `${(Math.random() * 320 - 220).toFixed(0)}px`);
    spark.style.fontSize = `${14 + Math.random() * 22}px`;
    spark.style.animationDuration = `${1200 + Math.random() * 900}ms`;
    screenOverlay.appendChild(spark);

    window.setTimeout(() => spark.remove(), 1500);
  }
}

function startTyping() {
  typedMessage.textContent = '';
  const content = message;
  let index = 0;
  const seenTerms = new Set();

  function checkForPulse(buffer) {
    const lower = buffer.toLowerCase();
    let shouldPulse = false;

    emotionalTerms.forEach(({ term }) => {
      const key = term.toLowerCase();
      if (lower.includes(key) && !seenTerms.has(key)) {
        seenTerms.add(key);
        shouldPulse = true;
      }
    });

    if (shouldPulse) {
      triggerHeartbeat();
    }
  }

  const typeNext = () => {
    const currentContent = content.slice(0, index + 1);
    renderTypedMessage(currentContent);
    index += 1;
    checkForPulse(currentContent);

    if (index < content.length) {
      const delay = content[index - 1] === '\n' ? 260 : 32 + Math.random() * 45;
      if (content[index - 1] === '\n') {
        triggerHeartbeat();
      }
      window.setTimeout(typeNext, delay);
    } else {
      typingCursor.style.opacity = '0';
      triggerHeartbeat();
    }
  };

  typingCursor.style.opacity = '1';
  window.setTimeout(typeNext, 300);
}

function createHeartBurst(anchorElement, emojiSet, target = document.body) {
  const rect = anchorElement.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  for (let index = 0; index < 26; index += 1) {
    const heart = document.createElement('span');
    heart.className = 'heart-burst';
    heart.textContent = emojiSet[index % emojiSet.length];
    heart.style.left = `${originX}px`;
    heart.style.top = `${originY}px`;
    heart.style.setProperty('--dx', `${(Math.random() * 320 - 160).toFixed(0)}px`);
    heart.style.setProperty('--dy', `${(Math.random() * 320 - 220).toFixed(0)}px`);
    heart.style.fontSize = `${16 + Math.random() * 22}px`;
    heart.style.animationDuration = `${850 + Math.random() * 600}ms`;
    target.appendChild(heart);

    window.setTimeout(() => heart.remove(), 1500);
  }
}

function createMoodRain(symbols, count, className, durationRange, spreadX, spreadY) {
  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('span');
    particle.className = className;
    particle.textContent = symbols[index % symbols.length];
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = `${-10 - Math.random() * 20}vh`;
    particle.style.animationDuration = `${durationRange[0] + Math.random() * (durationRange[1] - durationRange[0])}ms`;
    particle.style.setProperty('--dx', `${Math.random() * spreadX - spreadX / 2}px`);
    particle.style.setProperty('--dy', `${Math.random() * spreadY + spreadY}px`);
    particle.style.fontSize = `${14 + Math.random() * 18}px`;
    screenOverlay.appendChild(particle);

    window.setTimeout(() => particle.remove(), durationRange[1] + 1800);
  }
}

function showResponse(text, mode) {
  responseText.textContent = text;
  responseOverlay.classList.add('is-visible');
  responseOverlay.setAttribute('aria-hidden', 'false');
  setEmotionMode(mode);

  responseOverlay.classList.add('is-open');

  if (mode === 'forgiveness') {
    createMoodRain(['💕', '✨', '💖', '🫶', '💞'], 36, 'ending-heart', [1800, 3200], 220, 420);
    burstSparkles(window.innerWidth / 2, window.innerHeight / 2, 18, screenOverlay);
    createHeartBurst(responseOverlay, ['💕', '✨', '💖', '🫶', '💞'], responseOverlay);
  } else if (mode === 'sad') {
    createMoodRain(['💔', '🥀', '💔', '✨'], 26, 'ending-broken-heart', [2200, 3600], 160, 500);
    burstSparkles(window.innerWidth / 2, window.innerHeight / 2, 10, screenOverlay);
  }
}

function hideResponse() {
  responseOverlay.classList.remove('is-visible');
  responseOverlay.classList.remove('is-open');
  responseOverlay.setAttribute('aria-hidden', 'true');
  setEmotionMode(null);
}

function playTone(frequency, startTime, duration, gainValue) {
  if (!musicState.audioContext || !musicState.master) {
    return;
  }

  const oscillator = musicState.audioContext.createOscillator();
  const gainNode = musicState.audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.04);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gainNode);
  gainNode.connect(musicState.master);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.1);
}

function playAmbientLoop() {
  if (!musicState.audioContext) {
    musicState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    musicState.master = musicState.audioContext.createGain();
    musicState.master.gain.value = 0.035;
    musicState.master.connect(musicState.audioContext.destination);
  }

  const start = musicState.audioContext.currentTime;
  const sequence = [
    [musicState.notes[0], 0],
    [musicState.notes[2], 0.45],
    [musicState.notes[1], 0.9],
    [musicState.notes[4], 1.35],
    [musicState.notes[0], 1.8],
    [musicState.notes[3], 2.25],
  ];

  sequence.forEach(([frequency, offset]) => {
    playTone(frequency, start + offset, 1.9, 0.45);
  });

  document.body.classList.add('music-active');

  if (musicState.beatIntervalId) {
    window.clearInterval(musicState.beatIntervalId);
  }

  musicState.beatIntervalId = window.setInterval(() => {
    document.body.classList.toggle('music-beat');
    window.setTimeout(() => document.body.classList.remove('music-beat'), 420);
  }, 1900);

  musicState.intervalId = window.setInterval(() => {
    const loopStart = musicState.audioContext.currentTime + 0.05;
    sequence.forEach(([frequency, offset]) => {
      playTone(frequency, loopStart + offset, 1.9, 0.42);
    });
  }, 5000);
}

function stopAmbientLoop() {
  if (musicState.intervalId) {
    window.clearInterval(musicState.intervalId);
    musicState.intervalId = null;
  }

  if (musicState.beatIntervalId) {
    window.clearInterval(musicState.beatIntervalId);
    musicState.beatIntervalId = null;
  }

  document.body.classList.remove('music-active', 'music-beat');

  if (musicState.audioContext) {
    musicState.audioContext.close();
    musicState.audioContext = null;
    musicState.master = null;
  }
}

enterButton.addEventListener('click', () => {
  revealMemoryScreen();
});

musicToggle.addEventListener('click', async () => {
  if (!musicState.active) {
    syncMusicState(true);
    if (musicState.audioContext && musicState.audioContext.state === 'suspended') {
      await musicState.audioContext.resume();
    }
    playAmbientLoop();
    playMusic();
    return;
  }

  syncMusicState(false);
  stopAmbientLoop();
  pauseMusic();
});

window.playMusic = playMusic;

forgiveButton.addEventListener('click', () => {
  showResponse('Thank you for staying in my life Friend 🫶💖', 'forgiveness');
});

madButton.addEventListener('click', () => {
  showResponse('I’ll keep trying until you smile again Friend 🥺💞', 'sad');
});

responseOverlay.addEventListener('click', hideResponse);

window.addEventListener('pointermove', handlePointerTrail, { passive: true });
window.addEventListener('pointerdown', handlePointerTap, { passive: true });

createFloatingEmojis();