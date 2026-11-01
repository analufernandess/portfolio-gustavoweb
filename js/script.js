/**
 * ==========================================================================
 * PORTFÓLIO PESSOAL — ANA FERNANDES
 * MOTOR TÉRMICO PROCEDURAL (CANVAS & VANILLA JS)
 * INSPIRAÇÃO: GALLERY PLAY (MAPA TÉRMICO FLUIDO & REATIVO)
 * ==========================================================================
 */

(function () {
  'use strict';

  // --- Progressive Enhancement: Ativar estilização de revelação apenas com JS ---
  document.documentElement.classList.add('js-ready');

  // --- Elementos do DOM ---
  const canvas = document.getElementById('thermal-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const clockEl = document.getElementById('live-clock');

  // --- Paleta de Temperatura Térmica ---
  const THERMAL_PALETTE = {
    red: '#ff3700',      // Núcleo de calor máximo
    yellow: '#e6c82a',   // Alta temperatura
    green: '#00b181',    // Temperatura média
    cyan: '#00acd7',     // Transição de dissipação
    blue: '#213ded',     // Borda fria
    black: '#080808'     // Ambiente escuro
  };

  // --- Configurações de Resolução & Escala ---
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // --- Estado do Cursor e Posição Suavizada (Lerp) ---
  const mouse = {
    x: width * 0.5,
    y: height * 0.5,
    targetX: width * 0.5,
    targetY: height * 0.5,
    velocity: 0,
    lastX: width * 0.5,
    lastY: height * 0.5,
    active: false,
    radius: Math.min(width, height) * 0.22
  };

  // --- Blobs Térmicos Autônomos (Ambiente Vivo) ---
  // Criamos vórtices de calor que se movem de forma orgânica mesmo sem interação do mouse
  const ambientBlobs = [
    {
      x: width * 0.25,
      y: height * 0.35,
      baseRadius: Math.min(width, height) * 0.28,
      speedX: 0.0008,
      speedY: 0.0011,
      angle: 0,
      phase: 0
    },
    {
      x: width * 0.75,
      y: height * 0.45,
      baseRadius: Math.min(width, height) * 0.32,
      speedX: 0.0009,
      speedY: 0.0007,
      angle: Math.PI * 0.5,
      phase: 1.5
    },
    {
      x: width * 0.5,
      y: height * 0.7,
      baseRadius: Math.min(width, height) * 0.25,
      speedX: 0.0012,
      speedY: 0.0009,
      angle: Math.PI,
      phase: 3.0
    }
  ];

  // --- Histórico de Partículas Térmicas (Trilha do Mouse) ---
  const thermalTrail = [];
  const MAX_TRAIL_LENGTH = 18;

  // --- Fótons Térmicos Flutuantes (Haoqi Inspired Atmospheric Embers) ---
  const embers = [];
  const EMBER_COUNT = 22;
  const EMBER_COLORS = ['#00acd7', '#e6c82a', '#ff3700', '#00b181'];

  for (let i = 0; i < EMBER_COUNT; i++) {
    embers.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -Math.random() * 0.45 - 0.15,
      radius: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.55 + 0.25,
      color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
      pulseSpeed: Math.random() * 0.0025 + 0.001
    });
  }

  // --- Dinâmica de Rolagem & Velocidade do Scroll (Scroll-Driven Thermal) ---
  let lastScrollY = window.scrollY || window.pageYOffset || 0;
  let currentScrollY = lastScrollY;
  let scrollVelocity = 0;
  let targetScrollVelocity = 0;

  window.addEventListener(
    'scroll',
    function () {
      currentScrollY = window.scrollY || window.pageYOffset || 0;
      const delta = Math.abs(currentScrollY - lastScrollY);
      targetScrollVelocity = Math.min(delta, 50);
      lastScrollY = currentScrollY;
    },
    { passive: true }
  );

  // --- Rastreamento do Mouse / Touch ---
  function onPointerMove(clientX, clientY) {
    mouse.targetX = clientX;
    mouse.targetY = clientY;
    mouse.active = true;

    // Calcular velocidade para modular a intensidade térmica
    const dx = clientX - mouse.lastX;
    const dy = clientY - mouse.lastY;
    mouse.velocity = Math.min(Math.sqrt(dx * dx + dy * dy), 40);
    mouse.lastX = clientX;
    mouse.lastY = clientY;

    // Adicionar ponto de calor à trilha
    thermalTrail.push({
      x: clientX,
      y: clientY,
      radius: Math.min(width, height) * 0.18 + mouse.velocity * 3,
      alpha: 1.0,
      decay: 0.025
    });

    if (thermalTrail.length > MAX_TRAIL_LENGTH) {
      thermalTrail.shift();
    }
  }

  window.addEventListener(
    'mousemove',
    function (e) {
      onPointerMove(e.clientX, e.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    function (e) {
      if (e.touches.length > 0) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'mouseleave',
    function () {
      mouse.active = false;
    },
    { passive: true }
  );

  // --- Função para Desenhar Mancha Térmica Radial Multicamadas ---
  function drawThermalSpot(x, y, radius, intensity) {
    if (radius <= 0 || intensity <= 0) return;

    const safeIntensity = Math.min(Math.max(intensity, 0), 1);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    // Escala termográfica exata:
    // Vermelho (centro muito quente) -> Amarelo -> Verde -> Ciano -> Azul -> Dissipação no escuro
    gradient.addColorStop(0.0, `rgba(255, 55, 0, ${0.95 * safeIntensity})`);
    gradient.addColorStop(0.2, `rgba(230, 200, 42, ${0.85 * safeIntensity})`);
    gradient.addColorStop(0.42, `rgba(0, 177, 129, ${0.65 * safeIntensity})`);
    gradient.addColorStop(0.68, `rgba(0, 172, 215, ${0.45 * safeIntensity})`);
    gradient.addColorStop(0.88, `rgba(33, 61, 237, ${0.25 * safeIntensity})`);
    gradient.addColorStop(1.0, 'rgba(8, 8, 8, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Loop Principal de Renderização ---
  let lastTime = performance.now();

  function animateThermal(currentTime) {
    const dt = Math.min(currentTime - lastTime, 100);
    lastTime = currentTime;

    // Limpar o canvas a cada frame
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';

    // Dinâmica de rolagem: amortecimento e cálculo de profundidade
    scrollVelocity += (targetScrollVelocity - scrollVelocity) * 0.12;
    targetScrollVelocity *= 0.88;

    const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    const scrollProgress = Math.min(Math.max(currentScrollY / maxScroll, 0), 1);
    const scrollBoost = Math.min(scrollVelocity / 35, 0.35);

    // 1. Atualizar e renderizar manchas autônomas de fundo com reação ao scroll
    ambientBlobs.forEach(function (blob, index) {
      blob.angle += blob.speedX * dt;
      blob.phase += blob.speedY * dt;

      // Movimento harmônico elíptico suave + Parallax sutil em profundidade
      const offsetX = Math.cos(blob.angle) * (width * 0.15);
      const offsetY = Math.sin(blob.phase) * (height * 0.15);
      const currentX = blob.x + offsetX;
      const currentY = blob.y + offsetY + (scrollProgress - 0.5) * -110;

      // Pulsação suave do raio modulada pela velocidade da rolagem
      const pulse = (1 + Math.sin(currentTime * 0.0015 + index) * 0.12) * (1 + scrollBoost * 0.22);
      const currentRadius = blob.baseRadius * pulse;
      const currentIntensity = 0.42 + scrollBoost * 0.22;

      drawThermalSpot(currentX, currentY, currentRadius, currentIntensity);
    });

    // 2. Interpolação suave (Lerp) da posição do cursor
    mouse.x += (mouse.targetX - mouse.x) * 0.12;
    mouse.y += (mouse.targetY - mouse.y) * 0.12;

    // Se o mouse estiver ativo ou desacelerando, desenha a mancha primária do cursor
    if (mouse.active || mouse.velocity > 0.1) {
      const heatFactor = 0.65 + Math.min(mouse.velocity / 30, 0.35);
      drawThermalSpot(mouse.x, mouse.y, mouse.radius, heatFactor);
    }

    // 3. Renderizar e esmaecer a trilha térmica de inércia
    for (let i = thermalTrail.length - 1; i >= 0; i--) {
      const point = thermalTrail[i];
      drawThermalSpot(point.x, point.y, point.radius, point.alpha * 0.55);

      point.alpha -= point.decay;
      point.radius += 1.2; // Dissipação radial gradual

      if (point.alpha <= 0) {
        thermalTrail.splice(i, 1);
      }
    }

    // 4. Renderizar e atualizar fótons térmicos atmosféricos (Haoqi Inspired Embers)
    embers.forEach(function (ember) {
      ember.x += ember.vx;
      ember.y += ember.vy;

      // Interação gravitacional de repulsão suave com o cursor do mouse
      const dx = ember.x - mouse.x;
      const dy = ember.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 110 && dist > 0) {
        const force = (110 - dist) / 110;
        ember.x += (dx / dist) * force * 2.2;
        ember.y += (dy / dist) * force * 2.2;
      }

      // Reciclagem contínua das partículas no espaço visível
      if (ember.y < -15) {
        ember.y = height + 15;
        ember.x = Math.random() * width;
      }
      if (ember.x < -15) ember.x = width + 15;
      if (ember.x > width + 15) ember.x = -15;

      // Desenhar fóton com pulso orgânico
      ctx.save();
      const pulseAlpha = ember.alpha * (0.8 + Math.sin(currentTime * ember.pulseSpeed) * 0.2);
      ctx.globalAlpha = Math.min(Math.max(pulseAlpha, 0.1), 0.9);
      ctx.fillStyle = ember.color;
      ctx.shadowColor = ember.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(ember.x, ember.y, ember.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(animateThermal);
  }

  requestAnimationFrame(animateThermal);

  // --- Atualização do Relógio de Telemetria (Horário de Brasília) ---
  function updateTelemetryClock() {
    if (!clockEl) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hours}:${minutes}:${seconds}`;
  }

  updateTelemetryClock();
  setInterval(updateTelemetryClock, 1000);

  // --- Funcionalidade de Cópia Rápida do E-mail ---
  const copyBtn = document.getElementById('copy-email-btn');
  const copyFeedback = document.getElementById('copy-feedback');
  const targetEmail = 'luhh90740@gmail.com';

  if (copyBtn && copyFeedback) {
    copyBtn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(targetEmail).then(handleSuccess).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }

      function handleSuccess() {
        copyFeedback.classList.add('show');
        copyBtn.textContent = 'COPIADO!';
        copyBtn.style.background = 'var(--thermal-yellow)';
        copyBtn.style.color = '#000000';

        // Pulso térmico no centro da tela ao copiar
        thermalTrail.push({
          x: window.innerWidth * 0.5,
          y: window.innerHeight * 0.6,
          radius: Math.min(width, height) * 0.35,
          alpha: 1.0,
          decay: 0.015
        });

        setTimeout(function () {
          copyFeedback.classList.remove('show');
          copyBtn.textContent = 'COPIAR E-MAIL';
          copyBtn.style.background = '';
          copyBtn.style.color = '';
        }, 3000);
      }

      function fallbackCopy() {
        const tempInput = document.createElement('input');
        tempInput.value = targetEmail;
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
          document.execCommand('copy');
          handleSuccess();
        } catch (err) {
          console.error('Falha ao copiar:', err);
        }
        document.body.removeChild(tempInput);
      }
    });
  }

  // ==========================================================================
  // MOTOR DE REVELAÇÃO PROGRESSIVA (SCROLL-DRIVEN REVEAL OBSERVER)
  // ==========================================================================
  const revealElements = document.querySelectorAll('.reveal-item, .reveal-card, .reveal-fade');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');

            // Stagger dinâmico para elementos filhos (.stagger-chip)
            const chips = entry.target.querySelectorAll('.stagger-chip');
            chips.forEach(function (chip, idx) {
              chip.style.transitionDelay = (idx * 45) + 'ms';
              chip.classList.add('is-revealed');
            });

            // Ativar decodificação de telemetria nos elementos com [data-cipher]
            const cipherChildren = entry.target.querySelectorAll('[data-cipher]');
            cipherChildren.forEach(function (cel) {
              runCipherDecode(cel, 450);
            });
            if (entry.target.hasAttribute('data-cipher')) {
              runCipherDecode(entry.target, 450);
            }

            // Parar de observar após a primeira revelação suave
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });

    // --- Destaque de Foco Ativo nos Cards de Projetos (NexStudio Inspired) ---
    const projectCards = document.querySelectorAll('.project-card');
    const focusObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            projectCards.forEach(function (card) {
              card.classList.remove('in-focus');
            });
            entry.target.classList.add('in-focus');
          }
        });
      },
      {
        root: null,
        threshold: [0.35, 0.65]
      }
    );

    projectCards.forEach(function (card) {
      focusObserver.observe(card);
    });
  } else {
    // Fallback gracioso para navegadores legados
    revealElements.forEach(function (el) {
      el.classList.add('is-revealed');
    });
    document.querySelectorAll('.stagger-chip').forEach(function (chip) {
      chip.classList.add('is-revealed');
    });
  }

  // ==========================================================================
  // SECTION SPY & TELEMETRIA DINÂMICA
  // ==========================================================================
  const trackedSections = [
    { id: 'sobre-mim', label: 'SYS: ACTIVE // [01: TRAJETÓRIA]' },
    { id: 'projetos', label: 'SYS: ACTIVE // [02: REPOSITÓRIOS]' },
    { id: 'contato', label: 'SYS: ACTIVE // [03: COMUNICAÇÃO]' }
  ];

  const navLinks = document.querySelectorAll('.telemetry-nav .nav-link');
  const statusTextEl = document.querySelector('.status-indicator .status-text');

  function updateSectionTelemetry() {
    const scrollPosition = (window.scrollY || window.pageYOffset || 0) + window.innerHeight * 0.35;
    let activeSectionId = '';

    for (let i = 0; i < trackedSections.length; i++) {
      const sec = trackedSections[i];
      const el = document.getElementById(sec.id);
      if (el) {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPosition >= top && scrollPosition < top + height) {
          activeSectionId = sec.id;
          if (statusTextEl) {
            statusTextEl.textContent = sec.label;
          }
          break;
        }
      }
    }

    if (!activeSectionId && (window.scrollY || window.pageYOffset || 0) < 300) {
      if (statusTextEl) {
        statusTextEl.textContent = 'SYS: ACTIVE // [HERO]';
      }
    }

    navLinks.forEach(function (link) {
      const targetHash = link.getAttribute('href');
      if (targetHash === '#' + activeSectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateSectionTelemetry, { passive: true });
  updateSectionTelemetry();

  // ==========================================================================
  // MOTOR DE DECODIFICAÇÃO DE TELEMETRIA (CIPHER DECODE — HAOQI INSPIRED)
  // ==========================================================================
  const CIPHER_GLYPHS = '0123456789ABCDEF#%&*<>_/[];:';

  function runCipherDecode(element, duration) {
    if (!element || element.dataset.cipherRunning === 'true') return;
    element.dataset.cipherRunning = 'true';

    const originalText = element.dataset.cipherOriginal || element.textContent.trim();
    if (!element.dataset.cipherOriginal) {
      element.dataset.cipherOriginal = originalText;
    }

    const decodeTime = duration || 420;
    const startTime = performance.now();

    function updateFrame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / decodeTime, 1);
      const revealedCount = Math.floor(progress * originalText.length);

      let output = '';
      for (let i = 0; i < originalText.length; i++) {
        const char = originalText[i];
        if (i < revealedCount || char === ' ' || char === '/' || char === '[' || char === ']' || char === ':') {
          output += char;
        } else {
          output += CIPHER_GLYPHS[Math.floor(Math.random() * CIPHER_GLYPHS.length)];
        }
      }

      element.textContent = output;

      if (progress < 1) {
        requestAnimationFrame(updateFrame);
      } else {
        element.textContent = originalText;
        delete element.dataset.cipherRunning;
      }
    }

    requestAnimationFrame(updateFrame);
  }

  // Interatividade adicional no hover dos marcadores de telemetria
  document.querySelectorAll('[data-cipher]').forEach(function (cel) {
    cel.addEventListener('mouseenter', function () {
      runCipherDecode(cel, 350);
    });
  });

  // ==========================================================================
  // INTERAÇÕES HÁPTICAS: 3D TILT, VIDRO ESPECULAR & MAGNETISMO
  // ==========================================================================
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion;

  if (canHover) {
    // 1. Holofote Especular de Vidro (.glass-spotlight) e 3D Tilt (.tilt-3d)
    const spotlightCards = document.querySelectorAll('.glass-spotlight');

    spotlightCards.forEach(function (card) {
      const isTilt = card.classList.contains('tilt-3d');

      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Atualizar coordenadas relativas para o gradiente de luz interna
        card.style.setProperty('--mouse-x', x + 'px');
        card.style.setProperty('--mouse-y', y + 'px');

        // Cálculo de rotação 3D suave baseado no centro do card
        if (isTilt) {
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = -((y - centerY) / centerY) * 4.2;
          const rotateY = ((x - centerX) / centerX) * 4.2;

          card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.012, 1.012, 1)`;
        }
      });

      card.addEventListener('mouseleave', function () {
        if (isTilt) {
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        }
      });
    });

    // 2. Microinterações Magnéticas em Botões (.magnetic-el)
    const magneticBtns = document.querySelectorAll('.magnetic-el');

    magneticBtns.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) * 0.22;
        const deltaY = (e.clientY - centerY) * 0.22;

        btn.style.transform = `translate(${deltaX.toFixed(1)}px, ${deltaY.toFixed(1)}px)`;
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = 'translate(0px, 0px)';
      });
    });

    // 3. Sensor de Profundidade Parallax no Thermal Core Matrix (.thermal-core-device)
    const coreDevice = document.querySelector('.thermal-core-device');
    if (coreDevice) {
      coreDevice.addEventListener('mousemove', function (e) {
        const rect = coreDevice.getBoundingClientRect();
        const offsetX = Math.max(-12, Math.min(12, (e.clientX - (rect.left + rect.width / 2)) * 0.16));
        const offsetY = Math.max(-12, Math.min(12, (e.clientY - (rect.top + rect.height / 2)) * 0.16));

        coreDevice.style.setProperty('--core-rx', offsetX.toFixed(1) + 'px');
        coreDevice.style.setProperty('--core-ry', offsetY.toFixed(1) + 'px');
      });

      coreDevice.addEventListener('mouseleave', function () {
        coreDevice.style.setProperty('--core-rx', '0px');
        coreDevice.style.setProperty('--core-ry', '0px');
      });
    }
  }
})();

