/**
 * Gravador local do compositor da demo. Não comunica com nenhum provider.
 * O objeto de mídia gerado segue o contrato de mensagens do adaptador mock.
 */
export function formatVoiceTime(milliseconds) {
  const total = Math.floor(Math.max(0, Number(milliseconds) || 0) / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return minutes >= 60
    ? Math.floor(minutes / 60) + ":" + String(minutes % 60).padStart(2, "0") + ":" + seconds
    : String(minutes).padStart(2, "0") + ":" + seconds;
}

export function elapsedVoiceTime(accrued, startedAt, now) {
  return Math.max(0, accrued + (startedAt === null ? 0 : Math.max(0, now - startedAt)));
}

export function selectVoiceMimeType(isSupported) {
  for (const type of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) {
    if (isSupported(type)) return type;
  }
  return "";
}

export function setupVoiceComposer({getConversation, canStart, hasPendingAttachment, onSend, onSent, notify}) {
  const $ = id => document.getElementById(id);
  const form = $("composer");
  const mic = $("voice-start");
  const box = $("voice-composer");
  const recordView = $("voice-recording");
  const previewView = $("voice-preview");
  const recordStatus = $("voice-record-status");
  const liveStatus = $("voice-live-status");
  const elapsed = $("voice-elapsed");
  const pause = $("voice-pause");
  const stop = $("voice-stop");
  const discard = $("voice-discard");
  const wave = $("voice-wave");
  const play = $("voice-play");
  const playIcon = play.querySelector("use");
  const playbackTime = $("voice-preview-time");
  const progress = $("voice-progress");
  const previewDiscard = $("voice-preview-discard");
  const sendVoice = $("voice-send");
  const audio = $("voice-audio");
  const textSend = form.querySelector('button[type="submit"]');

  let state = "idle";
  let conversationId = null;
  let generation = 0;
  let recorder = null;
  let stream = null;
  let audioContext = null;
  let analyser = null;
  let recorderParts = [];
  let accruedMs = 0;
  let segmentStartedAt = null;
  let tickId = null;
  let frameId = null;
  let previewBlob = null;
  let previewUrl = null;

  const clock = () => globalThis.performance?.now?.() ?? Date.now();
  const active = () => state !== "idle";
  const isCapturing = () => ["requesting", "recording", "paused", "stopping"].includes(state);

  function updateClock() {
    elapsed.textContent = formatVoiceTime(elapsedVoiceTime(accruedMs, segmentStartedAt, clock()));
  }
  function previewDuration() {
    const duration = Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration : accruedMs / 1000;
    return Math.max(0, duration);
  }
  function updatePlayback() {
    const duration = previewDuration();
    const position = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    progress.max = String(Math.max(duration, 0.01));
    progress.value = String(Math.min(position, duration));
    playbackTime.textContent = formatVoiceTime(position * 1000) + " / " + formatVoiceTime(duration * 1000);
    const playing = !audio.paused && !audio.ended;
    playIcon.setAttribute("href", playing ? "#i-pause" : "#i-play");
    play.setAttribute("aria-label", playing ? "Pausar prévia" : "Reproduzir prévia");
    sendVoice.disabled = state !== "preview" || playing;
  }
  function render() {
    const busy = active();
    form.classList.toggle("voice-active", busy);
    box.hidden = !busy;
    recordView.hidden = !isCapturing();
    previewView.hidden = !["preview", "sending"].includes(state);
    mic.disabled = busy;
    textSend.disabled = busy;
    recordStatus.textContent = ({
      requesting: "Solicitando acesso ao microfone…",
      recording: "Gravando áudio",
      paused: "Gravação pausada",
      stopping: "Finalizando gravação…"
    })[state] || "";
    liveStatus.textContent = ({
      idle: "",
      requesting: "Aguardando autorização para gravar",
      recording: "Gravação em andamento",
      paused: "Gravação pausada",
      stopping: "Preparando prévia do áudio",
      preview: "Áudio pronto para reproduzir ou enviar",
      sending: "Enviando áudio de demonstração"
    })[state];
    const canControl = state === "recording" || state === "paused";
    pause.disabled = !canControl;
    stop.disabled = !canControl;
    discard.disabled = state === "stopping";
    pause.querySelector("use").setAttribute("href", state === "paused" ? "#i-play" : "#i-pause");
    pause.setAttribute("aria-label", state === "paused" ? "Retomar gravação" : "Pausar gravação");
    pause.title = state === "paused" ? "Retomar" : "Pausar";
    recordView.classList.toggle("is-paused", state === "paused");
    previewDiscard.disabled = state === "sending";
    play.disabled = state === "sending";
    progress.disabled = state === "sending";
    if (isCapturing()) updateClock();
    updatePlayback();
  }
  function stopWave() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
  }
  function drawWave() {
    const ctx = wave.getContext("2d");
    if (!ctx) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(wave.clientWidth * ratio));
    const height = Math.max(1, Math.round(wave.clientHeight * ratio));
    if (wave.width !== width || wave.height !== height) {
      wave.width = width;
      wave.height = height;
    }
    ctx.clearRect(0, 0, width, height);
    const bars = 30;
    const samples = analyser ? new Uint8Array(analyser.fftSize) : null;
    if (samples) analyser.getByteTimeDomainData(samples);
    const color = getComputedStyle(document.documentElement).getPropertyValue("--brand-accent").trim() || "#4f46e5";
    ctx.fillStyle = color;
    for (let i = 0; i < bars; i++) {
      let peak = 0;
      if (samples && state === "recording") {
        const from = Math.floor(i * samples.length / bars);
        const to = Math.floor((i + 1) * samples.length / bars);
        for (let j = from; j < to; j++) peak = Math.max(peak, Math.abs(samples[j] - 128) / 128);
      }
      const barHeight = Math.max(3 * ratio, Math.min(height * .85, (3 + peak * 35) * ratio));
      const x = (i + .15) * width / bars;
      ctx.fillRect(x, (height - barHeight) / 2, Math.max(2 * ratio, width / bars * .55), barHeight);
    }
  }
  function animateWave() {
    stopWave();
    if (state !== "recording") return;
    if (document.documentElement.dataset.animations === "off" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      drawWave();
      return;
    }
    const frame = () => {
      if (state !== "recording") return;
      drawWave();
      frameId = requestAnimationFrame(frame);
    };
    frame();
  }
  async function releaseCapture() {
    stopWave();
    if (tickId !== null) clearInterval(tickId);
    tickId = null;
    if (recorder) {
      recorder.onstop = null;
      recorder.ondataavailable = null;
      recorder.onerror = null;
      if (recorder.state !== "inactive") {
        try { recorder.stop(); } catch { /* already stopped */ }
      }
    }
    recorder = null;
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    analyser = null;
    const context = audioContext;
    audioContext = null;
    if (context && context.state !== "closed") {
      try { await context.close(); } catch { /* released */ }
    }
  }
  function reset() {
    ++generation;
    void releaseCapture();
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    previewBlob = null;
    recorderParts = [];
    accruedMs = 0;
    segmentStartedAt = null;
    state = "idle";
    render();
  }
  async function start() {
    if (active()) return;
    const conversation = getConversation();
    if (!conversation || !canStart(conversation)) return;
    if (hasPendingAttachment()) {
      notify("Descarte ou envie o anexo antes de gravar uma mensagem de voz.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      notify("Este navegador não oferece captura de áudio. Use HTTPS e um navegador compatível.");
      return;
    }
    const token = ++generation;
    conversationId = conversation.id;
    state = "requesting";
    render();
    try {
      const captured = await navigator.mediaDevices.getUserMedia({audio: {
        echoCancellation: true, noiseSuppression: true, autoGainControl: true
      }});
      if (token !== generation) {
        captured.getTracks().forEach(track => track.stop());
        return;
      }
      stream = captured;
      const mimeType = selectVoiceMimeType(type => MediaRecorder.isTypeSupported?.(type) ?? false);
      recorder = new MediaRecorder(stream, mimeType ? {mimeType} : undefined);
      recorderParts = [];
      const sourceRecorder = recorder;
      sourceRecorder.ondataavailable = event => {
        if (token === generation && event.data?.size) recorderParts.push(event.data);
      };
      sourceRecorder.onerror = () => {
        if (token !== generation) return;
        reset();
        notify("A gravação foi interrompida pelo navegador.");
      };
      sourceRecorder.onstop = async () => {
        if (token !== generation) return;
        const parts = recorderParts.slice();
        const type = sourceRecorder.mimeType || parts[0]?.type || "audio/webm";
        await releaseCapture();
        if (token !== generation) return;
        if (!parts.length || parts.every(part => !part.size)) {
          reset();
          notify("Não foi possível gerar o áudio. Tente novamente.");
          return;
        }
        previewBlob = new Blob(parts, {type});
        previewUrl = URL.createObjectURL(previewBlob);
        audio.src = previewUrl;
        audio.load();
        recorderParts = [];
        state = "preview";
        render();
        play.focus();
      };
      sourceRecorder.start(250);
      segmentStartedAt = clock();
      accruedMs = 0;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        try {
          audioContext = new AudioContextClass();
          const source = audioContext.createMediaStreamSource(stream);
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser); // Não conectar ao destino: impede retorno no alto-falante.
          if (audioContext.state === "suspended") void audioContext.resume().catch(() => {});
        } catch { analyser = null; }
      }
      stream.getAudioTracks().forEach(track => {
        track.addEventListener("ended", () => {
          if (token === generation && (state === "recording" || state === "paused")) {
            stopRecording();
          }
        }, {once: true});
      });
      state = "recording";
      render();
      animateWave();
      tickId = setInterval(updateClock, 125);
    } catch (error) {
      if (token !== generation) return;
      reset();
      notify(error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError"
        ? "Acesso ao microfone negado. Autorize o microfone nas permissões do navegador."
        : "Não foi possível iniciar a gravação: " + (error?.message || "erro desconhecido"));
    }
  }
  function togglePause() {
    if (!recorder) return;
    try {
      if (state === "recording") {
        recorder.pause();
        accruedMs = elapsedVoiceTime(accruedMs, segmentStartedAt, clock());
        segmentStartedAt = null;
        state = "paused";
        stopWave();
        drawWave();
      } else if (state === "paused") {
        recorder.resume();
        segmentStartedAt = clock();
        state = "recording";
        animateWave();
      }
      render();
    } catch {
      notify("O navegador não conseguiu alterar a pausa da gravação.");
    }
  }
  function stopRecording() {
    if (!recorder || (state !== "recording" && state !== "paused")) return;
    try {
      accruedMs = elapsedVoiceTime(accruedMs, segmentStartedAt, clock());
      segmentStartedAt = null;
      state = "stopping";
      stopWave();
      if (tickId !== null) clearInterval(tickId);
      tickId = null;
      recorder.stop();
      render();
    } catch {
      reset();
      notify("Não foi possível finalizar a gravação.");
    }
  }
  async function togglePlayback() {
    if (state !== "preview") return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
    } catch {
      notify("O navegador não conseguiu reproduzir a prévia.");
    }
  }
  async function send() {
    if (state !== "preview" || !audio.paused || !previewBlob || !previewUrl) return;
    const conversation = getConversation();
    if (!conversation || conversation.id !== conversationId || !canStart(conversation)) return;
    const token = generation;
    const ownedUrl = previewUrl;
    const blob = previewBlob;
    const duration = accruedMs;
    previewUrl = null; // Protege o URL em um envio pendente, inclusive ao trocar de conversa.
    state = "sending";
    render();
    try {
      const sent = await onSend(conversation, {
        kind: "audio",
        name: "Mensagem de voz",
        mimeType: blob.type || "audio/webm",
        url: ownedUrl,
        durationSeconds: Math.round(duration / 1000)
      });
      if (!sent) throw new Error("A mensagem não foi registrada.");
      if (token === generation) reset(); // O URL pertence agora à mensagem enviada.
      onSent(conversation);
    } catch (error) {
      if (token === generation) {
        previewUrl = ownedUrl;
        state = "preview";
        render();
      } else {
        URL.revokeObjectURL(ownedUrl);
      }
      notify("Falha ao enviar áudio: " + (error?.message || "erro desconhecido"));
    }
  }

  mic.addEventListener("click", start);
  pause.addEventListener("click", togglePause);
  stop.addEventListener("click", stopRecording);
  discard.addEventListener("click", reset);
  previewDiscard.addEventListener("click", reset);
  play.addEventListener("click", togglePlayback);
  sendVoice.addEventListener("click", send);
  progress.addEventListener("input", () => {
    if (state !== "preview") return;
    try { audio.currentTime = Number(progress.value); } catch { /* media not seekable */ }
    updatePlayback();
  });
  for (const event of ["loadedmetadata", "durationchange", "timeupdate", "play", "pause", "ended"]) {
    audio.addEventListener(event, updatePlayback);
  }
  audio.addEventListener("error", () => {
    if (state === "preview") notify("Não foi possível carregar a prévia do áudio.");
  });
  window.addEventListener("pagehide", reset);
  render();
  return Object.freeze({
    isActive: active,
    setConversation(id) {
      if (id !== conversationId) {
        if (active()) reset();
        conversationId = id;
      }
    },
    onRouteChange(isInbox) {
      if (!isInbox && active()) reset();
    }
  });
}
