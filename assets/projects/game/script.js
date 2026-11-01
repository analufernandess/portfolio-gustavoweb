/**
 * ========================================================
 * NYAN DONUT CAT - AVENTURA ARCO-ÍRIS ESPACIAL 🌈🐱🍩
 * Motor de Jogo Canvas 60 FPS, Física Suave, Áudio Nativo
 * e Efeitos Visuais Cósmicos de Alta Fidelidade
 * ========================================================
 */

(function () {
  'use strict';

  // --- CONFIGURAÇÃO DE CORES DO ARCO-ÍRIS ---
  const RAINBOW_COLORS = [
    { id: 'red', name: 'Vermelho Cósmico', hex: '#ff1a53', glow: 'rgba(255, 26, 83, 0.9)', freq: 523.25 }, // C5
    { id: 'orange', name: 'Laranja Solar', hex: '#ff7a00', glow: 'rgba(255, 122, 0, 0.9)', freq: 587.33 }, // D5
    { id: 'yellow', name: 'Amarelo Estelar', hex: '#ffea00', glow: 'rgba(255, 234, 0, 0.9)', freq: 659.25 }, // E5
    { id: 'green', name: 'Verde Aurora', hex: '#00ff75', glow: 'rgba(0, 255, 117, 0.9)', freq: 783.99 }, // G5
    { id: 'cyan', name: 'Azul Ciano', hex: '#00e5ff', glow: 'rgba(0, 229, 255, 0.9)', freq: 880.00 }, // A5
    { id: 'violet', name: 'Violeta Cósmico', hex: '#a82eff', glow: 'rgba(168, 46, 255, 0.9)', freq: 1046.50 } // C6
  ];

  // --- ELEMENTOS DO DOM ---
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const colorCounterEl = document.getElementById('color-counter');
  const timerDisplayEl = document.getElementById('timer-display');
  const soundBtn = document.getElementById('sound-btn');
  const soundIcon = document.getElementById('sound-icon');
  const helpBtn = document.getElementById('help-btn');
  const closeHelpBtn = document.getElementById('close-help-btn');
  const helpModal = document.getElementById('help-modal');
  const victoryModal = document.getElementById('victory-modal');
  const playAgainBtn = document.getElementById('play-again-btn');
  const finalTimeEl = document.getElementById('final-time');
  const controlsHint = document.getElementById('controls-hint');
  const dpadBtns = document.querySelectorAll('.dpad-btn');

  // --- MOTOR DE ÁUDIO NATIVO (WEB AUDIO API) ---
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.bgmTimer = null;
      this.bgmStep = 0;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playOrbCollect(colorIndex) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const baseFreq = RAINBOW_COLORS[colorIndex].freq;

      // Oscilador Principal (Onda Triangular harmônica suave)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Oscilador de Brilho Estelar (Sine de alta frequência)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 2, now + 0.05);

      gain2.gain.setValueAtTime(0.15, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.4);
    }

    playVictoryFanfare() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
      const now = this.ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0.2, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.4);
      });
    }

    startBgm() {
      if (!this.enabled || this.bgmTimer) return;
      this.init();
      // Arpejo espacial de fundo bem suave
      const arpeggio = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
      this.bgmTimer = setInterval(() => {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(arpeggio[this.bgmStep % arpeggio.length], now);

        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);

        this.bgmStep++;
      }, 300);
    }

    stopBgm() {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      if (this.enabled) {
        this.init();
        this.startBgm();
        soundIcon.textContent = '🔊';
      } else {
        this.stopBgm();
        soundIcon.textContent = '🔇';
      }
    }
  }

  const sound = new SoundManager();

  // --- ESTADO DO JOGO ---
  let width = 0;
  let height = 0;
  let dpr = 1;
  let gameRunning = true;
  let gameWon = false;
  let startTime = Date.now();
  let elapsedTime = 0;
  let globalTime = 0;

  // Teclado e Entrada
  const keys = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  // Cores Desbloqueadas
  let unlockedColors = [];

  // --- ENTIDADES DO JOGO ---

  // Partículas Estelares do Cenário Espacial
  const backgroundStars = [];
  const TOTAL_STARS = 120;

  function initStars() {
    backgroundStars.length = 0;
    for (let i = 0; i < TOTAL_STARS; i++) {
      backgroundStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.8,
        speed: Math.random() * 0.8 + 0.4,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.05 + 0.02,
        color: ['#ffffff', '#e0f2fe', '#fbcfe8', '#fef08a', '#c7d2fe'][Math.floor(Math.random() * 5)]
      });
    }
  }

  // Gatinho Donut
  const cat = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 6.8,
    friction: 0.88,
    width: 68,
    height: 48,
    facingRight: true,
    pawPhase: 0,
    tailAngle: 0,
    blinkTimer: 0,
    isBlinking: false,
    auraScale: 1,
    auraPulse: 0
  };

  // Histórico de Rastro para o Arco-Íris Ondulante
  const trailHistory = [];
  const MAX_TRAIL_LENGTH = 38;

  // Efeitos de Ondas de Choque (Pulso Expansivo)
  const shockwaves = [];

  // Partículas de Impacto / Centelhas de Arco-Íris
  const sparkParticles = [];

  // Partículas de Confetes (Vitória)
  const confettiParticles = [];

  // Bolinhas Colecionáveis (6 Cores do Arco-Íris)
  const collectibleOrbs = [];

  function createOrbs() {
    collectibleOrbs.length = 0;
    const padding = 100;
    const safeTop = 120;

    RAINBOW_COLORS.forEach((color, index) => {
      // Distribui as bolinhas de forma harmoniosa pela arena cósmica
      const marginX = width - padding * 2;
      const marginY = height - safeTop - padding;
      
      const x = padding + Math.random() * marginX;
      const y = safeTop + Math.random() * marginY;

      collectibleOrbs.push({
        index: index,
        id: color.id,
        name: color.name,
        color: color.hex,
        glowColor: color.glow,
        x: x,
        y: y,
        baseX: x,
        baseY: y,
        radius: 18,
        pulseOffset: index * (Math.PI / 3),
        sparkles: [
          { angle: 0, distance: 22, speed: 0.04, size: 2.5 },
          { angle: Math.PI * 0.7, distance: 26, speed: -0.035, size: 2 },
          { angle: Math.PI * 1.4, distance: 20, speed: 0.05, size: 3 }
        ],
        collected: false
      });
    });
  }

  // --- REDIMENSIONAMENTO E ADAPTAÇÃO DE TELA ---
  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    if (backgroundStars.length === 0) {
      initStars();
    }
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    // Reposiciona o gato caso saia da tela
    cat.x = Math.max(50, Math.min(width - 50, cat.x));
    cat.y = Math.max(120, Math.min(height - 50, cat.y));
  });

  // --- CONTROLES DE ENTRADA (TECLADO & TOUCH) ---
  window.addEventListener('keydown', (e) => {
    sound.init();
    sound.startBgm();
    hideControlsHint();

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.up = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.down = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = true;
        break;
    }
  });

  window.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.up = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.down = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = false;
        break;
    }
  });

  // Controles D-pad na Tela para Mobile
  dpadBtns.forEach((btn) => {
    const dir = btn.dataset.dir;

    const startDir = (e) => {
      e.preventDefault();
      sound.init();
      sound.startBgm();
      hideControlsHint();
      keys[dir] = true;
      btn.classList.add('active');
    };

    const stopDir = (e) => {
      e.preventDefault();
      keys[dir] = false;
      btn.classList.remove('active');
    };

    btn.addEventListener('touchstart', startDir, { passive: false });
    btn.addEventListener('touchend', stopDir, { passive: false });
    btn.addEventListener('touchcancel', stopDir, { passive: false });
    btn.addEventListener('mousedown', startDir);
    btn.addEventListener('mouseup', stopDir);
    btn.addEventListener('mouseleave', stopDir);
  });

  // Suporte a Toque Direto no Canvas para Conduzir o Gatinho
  let touchTarget = null;
  canvas.addEventListener('touchstart', (e) => {
    sound.init();
    sound.startBgm();
    hideControlsHint();
    if (e.touches.length > 0) {
      touchTarget = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      touchTarget = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    touchTarget = null;
  });

  function hideControlsHint() {
    if (controlsHint && !controlsHint.classList.contains('hidden')) {
      controlsHint.style.transition = 'opacity 0.6s ease';
      controlsHint.style.opacity = '0';
      setTimeout(() => {
        controlsHint.classList.add('hidden');
      }, 600);
    }
  }

  // --- BOTÕES DE INTERFACE ---
  soundBtn.addEventListener('click', () => {
    sound.toggle();
  });

  helpBtn.addEventListener('click', () => {
    helpModal.classList.remove('hidden');
  });

  closeHelpBtn.addEventListener('click', () => {
    helpModal.classList.add('hidden');
  });

  playAgainBtn.addEventListener('click', () => {
    victoryModal.classList.add('hidden');
    resetGame();
  });

  // --- ATUALIZAÇÃO DA HUD E BADGES ---
  function updateHUD() {
    const count = unlockedColors.length;
    colorCounterEl.textContent = `${count} / 6`;

    RAINBOW_COLORS.forEach((color) => {
      const badge = document.querySelector(`.color-badge[data-color="${color.id}"]`);
      if (badge) {
        if (unlockedColors.includes(color.id)) {
          badge.classList.add('unlocked');
        } else {
          badge.classList.remove('unlocked');
        }
      }
    });

    // Cronômetro formatado mm:ss
    if (!gameWon) {
      elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    }
    const mins = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
    const secs = String(elapsedTime % 60).padStart(2, '0');
    timerDisplayEl.textContent = `${mins}:${secs}`;
  }

  // --- EFEITOS DE IMPACTO E SHOCKWAVE ---
  function createOrbCollectionEffects(orb) {
    // 1. Onda de choque expansiva
    shockwaves.push({
      x: orb.x,
      y: orb.y,
      radius: 12,
      maxRadius: 85,
      color: orb.color,
      alpha: 1
    });

    // 2. Centelhas estelares explosivas
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5.5 + 2;
      sparkParticles.push({
        x: orb.x,
        y: orb.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.5,
        color: Math.random() > 0.3 ? orb.color : '#ffffff',
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.03 + 0.02
      });
    }

    // 3. Pulso de energia extra na aura do gatinho
    cat.auraPulse = 1.6;
  }

  // --- ATIVAÇÃO DA VITÓRIA ---
  function triggerVictory() {
    gameWon = true;
    sound.playVictoryFanfare();

    // Congela cronômetro no valor final
    const mins = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
    const secs = String(elapsedTime % 60).padStart(2, '0');
    finalTimeEl.textContent = `${mins}:${secs}`;

    // Cria confetes festivos cósmicos
    for (let i = 0; i < 180; i++) {
      confettiParticles.push({
        x: Math.random() * width,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 2.5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        size: Math.random() * 8 + 5,
        color: RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)].hex,
        shape: Math.random() > 0.5 ? 'rect' : 'circle'
      });
    }

    // Exibe o modal comemorativo após o voo triunfante inicial
    setTimeout(() => {
      victoryModal.classList.remove('hidden');
    }, 1800);
  }

  // --- REINICIALIZAÇÃO DO JOGO ---
  function resetGame() {
    unlockedColors = [];
    cat.x = width / 2;
    cat.y = height / 2;
    cat.vx = 0;
    cat.vy = 0;
    cat.facingRight = true;
    trailHistory.length = 0;
    shockwaves.length = 0;
    sparkParticles.length = 0;
    confettiParticles.length = 0;
    gameWon = false;
    startTime = Date.now();
    elapsedTime = 0;

    createOrbs();
    updateHUD();
  }

  // --- DESENHO: GATINHO DONUT (NYAN STYLE) ---
  function drawCat(x, y, facingRight) {
    ctx.save();
    ctx.translate(x, y);

    // Espelha horizontalmente se estiver indo para a esquerda
    if (!facingRight) {
      ctx.scale(-1, 1);
    }

    // Leve flutuação/bobbing vertical
    const bob = Math.sin(globalTime * 8) * 3;
    ctx.translate(0, bob);

    // ==========================================
    // 1. AURA RADIANTE E PULSANTE ATRÁS DO DONUT
    // (Onde o arco-íris se conecta ao corpo)
    // ==========================================
    const auraBaseRadius = 24 + unlockedColors.length * 4;
    const auraPulseAmount = Math.sin(globalTime * 10) * 4 + cat.auraPulse * 12;
    const auraRadius = auraBaseRadius + auraPulseAmount;

    ctx.save();
    ctx.translate(-22, 0); // Posicionada na traseira do donut

    // Halo externo difuso
    const auraGradient = ctx.createRadialGradient(0, 0, 4, 0, 0, auraRadius);
    const activeColorObj = unlockedColors.length > 0 
      ? RAINBOW_COLORS.find(c => c.id === unlockedColors[unlockedColors.length - 1]) 
      : null;
    const activeColorMid = activeColorObj 
      ? activeColorObj.glow.replace('0.9', '0.7') 
      : 'rgba(255, 96, 151, 0.7)';

    auraGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    auraGradient.addColorStop(0.35, activeColorMid);
    auraGradient.addColorStop(0.7, 'rgba(0, 229, 255, 0.35)');
    auraGradient.addColorStop(1, 'rgba(168, 46, 255, 0)');

    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // Pequenas centelhas luminosas na aura
    for (let i = 0; i < 4; i++) {
      const sparkAngle = globalTime * 3 + (i * Math.PI) / 2;
      const sparkDist = auraRadius * 0.65;
      const sx = Math.cos(sparkAngle) * sparkDist;
      const sy = Math.sin(sparkAngle) * sparkDist;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ==========================================
    // 2. CALDA CINZA DO GATINHO (Traseira)
    // ==========================================
    ctx.save();
    ctx.translate(-26, 6);
    const tailWag = Math.sin(globalTime * 9) * 0.35;
    ctx.rotate(-0.3 + tailWag);

    ctx.fillStyle = '#9ca3af'; // Cinza gatinho
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(-16, -4, 18, 8, 4);
    } else {
      ctx.rect(-16, -4, 18, 8);
    }
    ctx.fill();
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // ==========================================
    // 3. PATINHAS QUE REMAM NO ESPAÇO
    // ==========================================
    const pawCycle = Math.sin(globalTime * 12);
    ctx.fillStyle = '#9ca3af';
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1.5;

    // Patinhas traseiras
    ctx.beginPath();
    ctx.ellipse(-14, 18 + pawCycle * 3, 5, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Patinhas dianteiras
    ctx.beginPath();
    ctx.ellipse(14, 18 - pawCycle * 3, 5, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ==========================================
    // 4. CORPO DO DONUT (Massa Dourada + Glacê Rosa)
    // ==========================================
    ctx.save();
    // Glow sutil ao redor do donut
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 105, 180, 0.4)';

    // Massa do Donut (Assada e fofinha)
    ctx.fillStyle = '#e5a158';
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Borda da massa
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#c57f36';
    ctx.stroke();

    // Cobertura de Morango Rosa Brilhante
    ctx.fillStyle = '#ff6097';
    ctx.beginPath();
    ctx.ellipse(0, -1, 23, 19, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ondulações deliciosas do glacê
    ctx.fillStyle = '#ff7ba9';
    ctx.beginPath();
    ctx.arc(-14, 4, 6, 0, Math.PI * 2);
    ctx.arc(-2, 8, 6.5, 0, Math.PI * 2);
    ctx.arc(12, 5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Buraco do Donut (No centro)
    ctx.fillStyle = '#0f1035'; // Cor do espaço atrás do donut
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c57f36';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Brilho no glacê (Gloss highlight)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-8, -10, 8, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Confeitos Coloridos e Divertidos (Sprinkles)
    const sprinkles = [
      { x: -14, y: -8, color: '#fef08a', rot: 0.4 },
      { x: -8, y: -4, color: '#00e5ff', rot: -0.5 },
      { x: 12, y: -9, color: '#00ff75', rot: 0.6 },
      { x: 14, y: 2, color: '#ffea00', rot: -0.3 },
      { x: -12, y: 7, color: '#a82eff', rot: 0.8 },
      { x: 8, y: 9, color: '#ffffff', rot: 0.2 },
      { x: -1, y: -11, color: '#ff1a53', rot: -0.7 }
    ];

    sprinkles.forEach(s => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.fillStyle = s.color;
      ctx.fillRect(-3, -1, 6, 2.5);
      ctx.restore();
    });

    ctx.restore();

    // ==========================================
    // 5. CABEÇA DO GATINHO CINZA (À Frente)
    // ==========================================
    ctx.save();
    ctx.translate(18, -4);

    // Orelhinhas pontudas
    // Orelha esquerda
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(-4, -26);
    ctx.lineTo(2, -12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6b7280';
    ctx.stroke();

    // Miolo rosa da orelha esquerda
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(-8, -13);
    ctx.lineTo(-4, -22);
    ctx.lineTo(0, -13);
    ctx.closePath();
    ctx.fill();

    // Orelha direita
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath();
    ctx.moveTo(4, -12);
    ctx.lineTo(12, -25);
    ctx.lineTo(16, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Miolo rosa da orelha direita
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(6, -13);
    ctx.lineTo(12, -21);
    ctx.lineTo(14, -11);
    ctx.closePath();
    ctx.fill();

    // Rosto redondinho do gatinho
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath();
    ctx.ellipse(4, -4, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bochechas rosadas
    ctx.fillStyle = 'rgba(255, 105, 180, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-4, 1, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(12, 1, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Olhos doces e expressivos com piscada
    if (!cat.isBlinking) {
      // Olho esquerdo
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.ellipse(-1, -6, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Brilho do olho esquerdo
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2, -7.5, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Olho direito
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.ellipse(9, -6, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Brilho do olho direito
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(8, -7.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Olhos fechados piscando felizes (^ ^)
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-1, -4, 3, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(9, -4, 3, Math.PI, 0);
      ctx.stroke();
    }

    // Narizinho rosa fofo
    ctx.fillStyle = '#ff4081';
    ctx.beginPath();
    ctx.ellipse(4, -1, 2.2, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boquinha de gatinho :3
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(2, 2, 2.2, 0, Math.PI);
    ctx.arc(6, 2, 2.2, 0, Math.PI);
    ctx.stroke();

    // Bigodinhos brancos delicados
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    // Lado esquerdo
    ctx.beginPath();
    ctx.moveTo(-6, -1);
    ctx.lineTo(-14, -3);
    ctx.moveTo(-6, 2);
    ctx.lineTo(-13, 4);
    // Lado direito
    ctx.moveTo(14, -1);
    ctx.lineTo(21, -3);
    ctx.moveTo(14, 2);
    ctx.lineTo(20, 4);
    ctx.stroke();

    ctx.restore(); // Fim da cabeça do gatinho

    ctx.restore(); // Fim do gatinho completo
  }

  // --- DESENHO: RASTRO ONDULANTE DE ARCO-ÍRIS COM NEON GLOW ---
  function drawRainbowTrail() {
    if (trailHistory.length < 2 || unlockedColors.length === 0) return;

    ctx.save();

    const count = unlockedColors.length;
    const bandHeight = 4.8; // Altura de cada faixa de cor
    const totalHeight = count * bandHeight;
    const halfHeight = totalHeight / 2;

    // Desenha para cada cor desbloqueada
    unlockedColors.forEach((colorId, colorIndex) => {
      const colorObj = RAINBOW_COLORS.find(c => c.id === colorId);
      if (!colorObj) return;

      const yOffset = -halfHeight + colorIndex * bandHeight + bandHeight / 2;

      // 1. Camada de Glow Neon da Faixa
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = colorObj.glow;
      ctx.lineWidth = bandHeight + 1.5;
      ctx.strokeStyle = colorObj.hex;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      for (let i = 0; i < trailHistory.length; i++) {
        const pt = trailHistory[i];
        // Ondulação senoidal viva ao longo da fita
        const wave = Math.sin(globalTime * 12 - i * 0.35) * 5;
        const px = pt.x;
        const py = pt.y + yOffset + wave;

        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.restore();

      // 2. Linha de Destaque Central Brilhante (Highlight)
      ctx.save();
      ctx.lineWidth = bandHeight * 0.45;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      for (let i = 0; i < trailHistory.length; i++) {
        const pt = trailHistory[i];
        const wave = Math.sin(globalTime * 12 - i * 0.35) * 5;
        const px = pt.x;
        const py = pt.y + yOffset + wave;

        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.restore();
    });

    // 3. Estrelinhas Cintilantes ao Redor do Rastro
    for (let i = 4; i < trailHistory.length; i += 5) {
      const pt = trailHistory[i];
      const starWave = Math.sin(globalTime * 10 - i * 0.3) * 6;
      const starX = pt.x + (Math.sin(i * 1.5) * 12);
      const starY = pt.y + starWave + (Math.cos(i * 1.5) * (halfHeight + 6));
      const starAlpha = 0.5 + Math.sin(globalTime * 8 + i) * 0.5;

      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffffff';

      // Desenha mini-estrela de 4 pontas
      ctx.beginPath();
      ctx.moveTo(starX, starY - 4);
      ctx.lineTo(starX + 1.5, starY);
      ctx.lineTo(starX + 5, starY);
      ctx.lineTo(starX + 1.5, starY + 1.5);
      ctx.lineTo(starX, starY + 5);
      ctx.lineTo(starX - 1.5, starY + 1.5);
      ctx.lineTo(starX - 5, starY);
      ctx.lineTo(starX - 1.5, starY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // --- DESENHO: BOLINHAS COLECIONÁVEIS NEON COM AURAS ---
  function drawOrb(orb) {
    if (orb.collected) return;

    ctx.save();

    // Oscilação suave vertical (flutuação)
    const floatY = Math.sin(globalTime * 3.5 + orb.pulseOffset) * 6;
    const ox = orb.x;
    const oy = orb.y + floatY;

    // 1. Halo / Aura Radiante Pulsante Multicamadas
    const pulse = Math.sin(globalTime * 5 + orb.pulseOffset) * 0.25 + 1;
    const auraRadius = orb.radius * 2.2 * pulse;

    const auraGrad = ctx.createRadialGradient(ox, oy, orb.radius * 0.4, ox, oy, auraRadius);
    auraGrad.addColorStop(0, orb.glowColor);
    auraGrad.addColorStop(0.5, orb.glowColor.replace('0.9', '0.35'));
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(ox, oy, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Anel de Energia Fino
    ctx.strokeStyle = orb.color;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = orb.color;
    ctx.beginPath();
    ctx.arc(ox, oy, orb.radius * 1.35 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Núcleo da Bolinha Neon Ultra-Brilhante
    const coreGrad = ctx.createRadialGradient(ox - 3, oy - 3, 2, ox, oy, orb.radius);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, orb.color);
    coreGrad.addColorStop(1, orb.color);

    ctx.fillStyle = coreGrad;
    ctx.shadowBlur = 18;
    ctx.shadowColor = orb.color;
    ctx.beginPath();
    ctx.arc(ox, oy, orb.radius, 0, Math.PI * 2);
    ctx.fill();

    // 4. Brilho Especular Superior
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(ox - 4, oy - 5, 5, 2.5, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // 5. Mini Estrelinhas Orbitantes ao Redor da Bolinha
    orb.sparkles.forEach((sp) => {
      sp.angle += sp.speed;
      const sx = ox + Math.cos(sp.angle) * sp.distance;
      const sy = oy + Math.sin(sp.angle) * sp.distance;

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.shadowColor = orb.color;
      ctx.beginPath();
      ctx.arc(sx, sy, sp.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  // --- ATUALIZAÇÃO DA FÍSICA E LÓGICA ---
  function update(dt) {
    globalTime += dt;

    // Atualização da piscada do gatinho
    cat.blinkTimer += dt;
    if (cat.blinkTimer > 3.5) {
      cat.isBlinking = true;
      if (cat.blinkTimer > 3.7) {
        cat.isBlinking = false;
        cat.blinkTimer = 0;
      }
    }

    // Amortecimento do pulso da aura
    if (cat.auraPulse > 0) {
      cat.auraPulse = Math.max(0, cat.auraPulse - dt * 2.5);
    }

    // Se venceu, o gatinho entra em voo hipersônico triunfante
    if (gameWon) {
      cat.vx = 14;
      cat.vy = Math.sin(globalTime * 4) * 2;
      cat.facingRight = true;
      cat.x += cat.vx;
      cat.y += cat.vy;

      if (cat.x > width + 100) {
        cat.x = -80;
      }

      // Estica as estrelas para o efeito de hiperespaço
      backgroundStars.forEach((star) => {
        star.x -= star.speed * 22;
        if (star.x < 0) {
          star.x = width;
          star.y = Math.random() * height;
        }
      });
    } else {
      // Controles do Jogador
      let ax = 0;
      let ay = 0;

      if (keys.up) ay -= 1;
      if (keys.down) ay += 1;
      if (keys.left) ax -= 1;
      if (keys.right) ax += 1;

      // Suporte a toque direto na tela (Segue o dedo)
      if (touchTarget) {
        const dx = touchTarget.x - cat.x;
        const dy = touchTarget.y - cat.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 15) {
          ax = dx / dist;
          ay = dy / dist;
        }
      }

      // Normaliza aceleração diagonal
      if (ax !== 0 && ay !== 0 && !touchTarget) {
        ax *= 0.7071;
        ay *= 0.7071;
      }

      // Aplica aceleração e atrito para movimentação ultra suave
      cat.vx += ax * cat.speed * 0.35;
      cat.vy += ay * cat.speed * 0.35;
      cat.vx *= cat.friction;
      cat.vy *= cat.friction;

      cat.x += cat.vx;
      cat.y += cat.vy;

      // Define a direção em que o gatinho está olhando
      if (Math.abs(cat.vx) > 0.3) {
        cat.facingRight = cat.vx > 0;
      }

      // Limites da Arena (Garante visibilidade e não cobre o HUD superior)
      const margin = 40;
      const topMargin = 85;
      if (cat.x < margin) { cat.x = margin; cat.vx = 0; }
      if (cat.x > width - margin) { cat.x = width - margin; cat.vx = 0; }
      if (cat.y < topMargin) { cat.y = topMargin; cat.vy = 0; }
      if (cat.y > height - margin) { cat.y = height - margin; cat.vy = 0; }

      // Movimentação lenta das estrelas para profundidade cósmica
      backgroundStars.forEach((star) => {
        star.x -= star.speed * (0.8 + Math.abs(cat.vx) * 0.1);
        if (star.x < 0) {
          star.x = width;
          star.y = Math.random() * height;
        }
      });
    }

    // Grava histórico de posições para o rastro ondulante
    const rearX = cat.facingRight ? cat.x - 24 : cat.x + 24;
    trailHistory.unshift({ x: rearX, y: cat.y });
    if (trailHistory.length > MAX_TRAIL_LENGTH) {
      trailHistory.pop();
    }

    // Verificação de Coleta das Bolinhas
    if (!gameWon) {
      collectibleOrbs.forEach((orb) => {
        if (orb.collected) return;

        const dx = cat.x - orb.x;
        const dy = cat.y - orb.y;
        const dist = Math.hypot(dx, dy);

        // Magnetismo suave quando o gatinho está próximo
        if (dist < 85) {
          orb.x += (cat.x - orb.x) * 0.08;
          orb.y += (cat.y - orb.y) * 0.08;
        }

        // Colisão de coleta
        if (dist < 42) {
          orb.collected = true;
          unlockedColors.push(orb.id);
          sound.playOrbCollect(orb.index);
          createOrbCollectionEffects(orb);
          updateHUD();

          // Condição de Vitória: todas as 6 cores coletadas!
          if (unlockedColors.length === RAINBOW_COLORS.length) {
            triggerVictory();
          }
        }
      });
    }

    // Atualização das Ondas de Choque
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.radius += dt * 160;
      sw.alpha = 1 - (sw.radius / sw.maxRadius);
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        shockwaves.splice(i, 1);
      }
    }

    // Atualização das Centelhas Estelares
    for (let i = sparkParticles.length - 1; i >= 0; i--) {
      const sp = sparkParticles[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vx *= 0.95;
      sp.vy *= 0.95;
      sp.life -= sp.decay;
      if (sp.life <= 0) {
        sparkParticles.splice(i, 1);
      }
    }

    // Atualização dos Confetes na Vitória
    if (gameWon) {
      confettiParticles.forEach((c) => {
        c.x += c.vx;
        c.y += c.vy;
        c.rotation += c.rotationSpeed;
        if (c.y > height + 20) {
          c.y = -10;
          c.x = Math.random() * width;
        }
      });
    }
  }

  // --- RENDERIZAÇÃO PRINCIPAL DO CANVAS ---
  function render() {
    ctx.clearRect(0, 0, width, height);

    // 1. Estrelas de Fundo (com efeito de esticamento no hiperespaço)
    ctx.save();
    backgroundStars.forEach((star) => {
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.alpha;
      if (gameWon) {
        // Streaks de hiperespaço
        ctx.strokeStyle = star.color;
        ctx.lineWidth = star.size * 0.8;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x + star.speed * 25, star.y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();

    // 2. Ondas de Choque (Shockwaves)
    shockwaves.forEach((sw) => {
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.shadowBlur = 16;
      ctx.shadowColor = sw.color;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 3. Rastro de Arco-Íris Ondulante (Desenha ANTES do gatinho para ficar atrás)
    drawRainbowTrail();

    // 4. Bolinhas Colecionáveis Neon
    collectibleOrbs.forEach(drawOrb);

    // 5. O Gatinho Donut Fofo
    drawCat(cat.x, cat.y, cat.facingRight);

    // 6. Centelhas e Faíscas Estelares
    sparkParticles.forEach((sp) => {
      ctx.save();
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = Math.max(0, sp.life);
      ctx.shadowBlur = 8;
      ctx.shadowColor = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 7. Confetes de Celebração Cósmica (Vitória)
    if (gameWon) {
      confettiParticles.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate((c.rotation * Math.PI) / 180);
        ctx.fillStyle = c.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = c.color;

        if (c.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, c.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-c.size / 2, -c.size / 3, c.size, c.size * 0.7);
        }
        ctx.restore();
      });
    }
  }

  // --- GAME LOOP COM DELTA TIME ---
  let lastTime = performance.now();

  function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    if (gameRunning) {
      update(dt);
      render();
      updateHUD();
    }

    requestAnimationFrame(gameLoop);
  }

  // --- INICIALIZAÇÃO DO JOGO ---
  function init() {
    resizeCanvas();
    cat.x = width / 2;
    cat.y = height / 2;
    createOrbs();
    updateHUD();
    requestAnimationFrame(gameLoop);
  }

  init();

})();
