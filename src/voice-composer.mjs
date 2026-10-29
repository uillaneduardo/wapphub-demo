import {wavFromAudioBuffers} from "./audio-utils.mjs";

/** Captura local com pausa de verdade, escuta do trecho pausado e envio imediato. */
export function formatVoiceTime(milliseconds) {
  const total = Math.floor(Math.max(0, Number(milliseconds) || 0) / 1000);
  const minutes = Math.floor(total / 60), seconds = String(total % 60).padStart(2, "0");
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

export function setupVoiceComposer({getConversation, canStart, canTextSend, hasPendingAttachment, onSend, onSent, notify}) {
  const $ = id => document.getElementById(id);
  const form = $("composer"), mic = $("voice-start"), box = $("voice-composer");
  const recordView = $("voice-recording"), status = $("voice-record-status");
  const liveStatus = $("voice-live-status"), elapsed = $("voice-elapsed");
  const pause = $("voice-pause"), discard = $("voice-discard"), sendButton = $("voice-send");
  const wave = $("voice-wave"), pausedPlayer = $("voice-paused-player");
  const play = $("voice-play"), seek = $("voice-progress"), playbackTime = $("voice-preview-time");
  const audio = $("voice-audio"), textSend = form.querySelector('button[type="submit"]');

  let state = "idle", conversationId = null, generation = 0;
  let stream = null, recorder = null, audioContext = null, analyser = null;
  let chunks = [], decodedParts = [], recordedMs = 0, startedAt = null;
  let timer = null, frame = null, previewBlob = null, previewUrl = null;

  const clock = () => globalThis.performance?.now?.() ?? Date.now();
  const active = () => state !== "idle";
  const lengthMs = () => elapsedVoiceTime(recordedMs, startedAt, clock());
  const isRecording = () => state === "recording";
  const canSendNow = () => lengthMs() >= 250 && canTextSend(getConversation()) &&
    (state === "recording" || (state === "paused" && decodedParts.length > 0));

  function updateClock() {
    elapsed.textContent = formatVoiceTime(lengthMs());
    if (isRecording()) sendButton.disabled = !canSendNow();
  }
  function playbackDuration() {
    return Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : recordedMs / 1000;
  }
  function updatePlayback() {
    const duration = Math.max(0, playbackDuration());
    const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    seek.max = String(Math.max(.01, duration));
    seek.value = String(Math.min(current, duration));
    playbackTime.textContent = formatVoiceTime(current * 1000) + " / " + formatVoiceTime(duration * 1000);
    const playing = !audio.paused && !audio.ended;
    play.querySelector("use").setAttribute("href", playing ? "#i-pause" : "#i-play");
    play.setAttribute("aria-label", playing ? "Pausar escuta do trecho gravado" : "Ouvir trecho gravado");
  }
  function render() {
    const busy = active();
    form.classList.toggle("voice-active", busy);
    box.hidden = !busy;
    recordView.hidden = !busy;
    mic.disabled = busy || !canTextSend(getConversation());
    textSend.disabled = busy || !canTextSend(getConversation());
    const paused = state === "paused";
    pausedPlayer.hidden = !paused || !previewUrl;
    wave.hidden = !isRecording();
    status.textContent = ({
      requesting:"Aguardando microfone…", recording:"Gravando áudio",
      pausing:"Preparando trecho…", paused:"Gravação pausada",
      finishing:"Finalizando áudio…", sending:"Enviando áudio…"
    })[state] || "";
    liveStatus.textContent = status.textContent || "";
    pause.disabled = !["recording", "paused"].includes(state) || !canTextSend(getConversation());
    pause.querySelector("use").setAttribute("href", paused ? "#i-mic" : "#i-pause");
    pause.setAttribute("aria-label", paused ? "Retomar gravação" : "Pausar gravação");
    pause.title = paused ? "Retomar" : "Pausar";
    discard.disabled = state === "sending";
    sendButton.disabled = !canSendNow();
    sendButton.title = "Finalizar e enviar áudio";
    recordView.classList.toggle("is-paused", !isRecording());
    updateClock();
    updatePlayback();
  }
  function stopWave() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  }
  function drawWave() {
    const ctx = wave.getContext("2d");
    if (!ctx || !wave.clientWidth) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(wave.clientWidth * ratio));
    const height = Math.max(1, Math.round(wave.clientHeight * ratio));
    if (wave.width !== width || wave.height !== height) {wave.width = width; wave.height = height}
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--brand-accent").trim() || "#4f46e5";
    const samples = analyser ? new Uint8Array(analyser.fftSize) : null;
    if (samples) analyser.getByteTimeDomainData(samples);
    for (let i = 0; i < 26; i++) {
      let peak = 0;
      if (samples && isRecording()) {
        const first = Math.floor(i * samples.length / 26);
        const last = Math.floor((i + 1) * samples.length / 26);
        for (let j = first; j < last; j++) peak = Math.max(peak, Math.abs(samples[j] - 128) / 128);
      }
      const barHeight = Math.max(3 * ratio, Math.min(height * .88, (2 + peak * 33) * ratio));
      ctx.fillRect((i + .2) * width / 26, (height - barHeight) / 2,
        Math.max(2 * ratio, width / 26 * .57), barHeight);
    }
  }
  function animateWave() {
    stopWave();
    if (!isRecording()) return;
    if (document.documentElement.dataset.animations === "off" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      drawWave(); return;
    }
    const step = () => {
      if (!isRecording()) return;
      drawWave();
      frame = requestAnimationFrame(step);
    };
    step();
  }
  function stopVisualTimers() {
    stopWave();
    if (timer !== null) clearInterval(timer);
    timer = null;
  }
  async function releaseCapture() {
    stopVisualTimers();
    const current = recorder;
    recorder = null;
    if (current && current.state !== "inactive") {
      try { current.stop(); } catch { /* já finalizado */ }
    }
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    analyser = null;
    const context = audioContext;
    audioContext = null;
    if (context && context.state !== "closed") {
      try { await context.close(); } catch { /* liberado */ }
    }
  }
  function clearPreview() {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null; previewBlob = null;
  }
  function reset() {
    generation++;
    clearPreview();
    void releaseCapture();
    chunks = []; decodedParts = []; recordedMs = 0; startedAt = null;
    state = "idle";
    render();
  }
  function startSegment() {
    if (!stream?.active) throw new Error("Microfone não está disponível");
    const mime = selectVoiceMimeType(type => MediaRecorder.isTypeSupported?.(type) ?? false);
    const current = new MediaRecorder(stream, mime ? {mimeType:mime} : undefined);
    chunks = [];
    recorder = current;
    current.ondataavailable = event => {if (event.data?.size) chunks.push(event.data)};
    current.onerror = () => {
      if (current !== recorder) return;
      reset(); notify("A gravação foi interrompida pelo navegador.");
    };
    current.start(250);
    startedAt = clock();
    state = "recording";
    if (timer !== null) clearInterval(timer);
    timer = setInterval(updateClock, 125);
    render();
    animateWave();
  }
  async function requestMicrophone(token) {
    const captured = await navigator.mediaDevices.getUserMedia({audio:{
      echoCancellation:true, noiseSuppression:true, autoGainControl:true
    }});
    if (token !== generation) {
      captured.getTracks().forEach(track=>track.stop());
      return false;
    }
    stream = captured;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) throw new Error("Este navegador não permite prévia navegável do áudio.");
    audioContext = new Context();
    try {
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser); // Somente análise; nunca enviar microfone à saída.
      if (audioContext.state === "suspended") await audioContext.resume();
    } catch (error) {
      throw error;
    }
    stream.getAudioTracks().forEach(track=>track.addEventListener("ended",()=>{
      if (token === generation && state === "recording") void pauseCapture();
    },{once:true}));
    return token === generation;
  }
  async function start() {
    if (active()) return;
    const conversation = getConversation();
    if (!conversation || !canStart(conversation)) return;
    if (hasPendingAttachment()) {
      notify("Envie ou descarte o anexo antes de gravar áudio.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      notify("Para gravar, utilize HTTPS e um navegador com suporte ao microfone.");
      return;
    }
    const token = ++generation;
    conversationId = conversation.id;
    state = "requesting"; render();
    try {
      if (!await requestMicrophone(token)) return;
      startSegment();
    } catch(error) {
      if (token !== generation) return;
      reset();
      notify(["NotAllowedError","PermissionDeniedError"].includes(error?.name)
        ? "Autorize o microfone nas permissões do navegador."
        : "Não foi possível iniciar a gravação: " + (error?.message || "erro desconhecido"));
    }
  }
  // Cada pausa fecha um trecho válido, para que ele possa ser reproduzido e
  // navegado antes do envio. Na retomada um novo trecho se soma ao anterior.
  async function finalizeSegment(token) {
    const current = recorder;
    if (!current) throw new Error("Gravação não iniciada");
    const parts = chunks;
    const mimeType = current.mimeType || "audio/webm";
    await new Promise((resolve,reject)=>{
      current.onstop = resolve;
      try { current.stop(); } catch(error) {reject(error)}
    });
    if (token !== generation) return false;
    if (!parts.length) throw new Error("Nenhum áudio foi capturado");
    const blob = new Blob(parts,{type:mimeType});
    const audioData = await blob.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(audioData);
    if (token !== generation) return false;
    decodedParts.push(decoded);
    if (recorder === current) recorder = null;
    chunks = [];
    return true;
  }
  function buildPreview() {
    clearPreview();
    previewBlob = wavFromAudioBuffers(decodedParts);
    previewUrl = URL.createObjectURL(previewBlob);
    audio.src = previewUrl;
    audio.load();
  }
  async function pauseCapture() {
    if (state !== "recording") return;
    const token = generation;
    recordedMs = lengthMs();
    startedAt = null;
    state = "pausing";
    stopVisualTimers();
    render();
    try {
      if (!await finalizeSegment(token)) return;
      buildPreview();
      state = "paused";
      render();
    } catch(error) {
      if (token !== generation) return;
      reset();
      notify("Não foi possível preparar a gravação: " + (error?.message || "erro desconhecido"));
    }
  }
  async function resume() {
    if (state !== "paused" || !canTextSend(getConversation())) return;
    const token = generation;
    clearPreview();
    try {
      if (!stream?.active) {
        state = "requesting"; render();
        if (!await requestMicrophone(token)) return;
      }
      if (token !== generation) return;
      startSegment();
    } catch(error) {
      if (token !== generation) return;
      // Trechos anteriores continuam disponíveis para envio e escuta.
      if (decodedParts.length) buildPreview();
      state = "paused"; render();
      notify("Não foi possível retomar a gravação: " + (error?.message || "erro desconhecido"));
    }
  }
  function togglePause() {
    if (state === "recording") void pauseCapture();
    else if (state === "paused") void resume();
  }
  async function togglePlayback() {
    if (state !== "paused" || !previewUrl) return;
    if (!audio.paused) {audio.pause(); return}
    try {
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
    } catch {notify("Não foi possível ouvir o trecho gravado.")}
  }
  async function send() {
    if (!["recording","paused"].includes(state) || !canSendNow()) return;
    const conversation = getConversation();
    if (!conversation || conversation.id !== conversationId || !canStart(conversation)) return;
    const token = generation;
    const recording = state === "recording";
    if (recording) {
      recordedMs = lengthMs(); startedAt = null;
      state = "finishing";
      stopVisualTimers();
      render();
    }
    let sentUrl = null;
    try {
      if (recording && !await finalizeSegment(token)) return;
      if (token !== generation) return;
      if (!previewUrl) buildPreview();
      audio.pause();
      state = "sending"; render();
      sentUrl = previewUrl;
      const blob = previewBlob;
      previewUrl = null; // O URL fica reservado até a operação finalizar.
      // Gravação em WAV garante duração finita e seek real em dispositivos móveis.
      const result = await onSend(conversation,{
        kind:"audio",name:"Mensagem de voz",mimeType:blob.type,
        url:sentUrl,durationSeconds:recordedMs/1000
      });
      if (!result) throw new Error("A mensagem não foi registrada");
      if (token !== generation) return;
      reset();
      onSent(conversation);
    } catch(error) {
      if (sentUrl) URL.revokeObjectURL(sentUrl);
      if (token !== generation) return;
      if (!previewUrl && decodedParts.length) buildPreview();
      state = "paused";
      render();
      notify("Falha ao enviar áudio: " + (error?.message || "erro desconhecido"));
    }
  }
  mic.addEventListener("click",start);
  pause.addEventListener("click",togglePause);
  discard.addEventListener("click",reset);
  sendButton.addEventListener("click",send);
  play.addEventListener("click",togglePlayback);
  seek.addEventListener("input",()=>{
    if (state !== "paused" || !previewUrl) return;
    try {audio.currentTime = Number(seek.value)} catch { /* áudio não seekable */ }
    updatePlayback();
  });
  for(const event of ["loadedmetadata","durationchange","timeupdate","play","pause","ended","seeked"]) {
    audio.addEventListener(event, updatePlayback);
  }
  audio.addEventListener("error",()=>{
    if(state === "paused") notify("Não foi possível carregar o trecho gravado.");
  });
  window.addEventListener("pagehide",reset);
  render();
  return Object.freeze({
    isActive:active,
    syncPermissions(){if(active()&&!canTextSend(getConversation()))reset();else render()},
    setConversation(id){if(id!==conversationId){if(active())reset();conversationId=id}},
    onRouteChange(isInbox){if(!isInbox&&active())reset()}
  });
}
