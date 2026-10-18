/* Optional mobile exploration trial. The existing world and renderers stay authoritative. */
(() => {
  const memoryKey = "bosquet-lent-learning-v1";
  let learned = {};
  try { learned = JSON.parse(localStorage.getItem(memoryKey) || "{}") || {}; } catch {}
  const remember = (key) => {
    learned[key] = true;
    try { localStorage.setItem(memoryKey, JSON.stringify(learned)); } catch {}
  };
  const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = { id: null, x: 0, y: 0, originX: 0, originY: 0, radius: 46 };
  let controls, stick, knob, guide, action, skip, banner, scene = null, travelled = 0;
  let lastPosition = null;
  const api = {
    companionDepth: 0,
    init() {
      document.body.classList.add("exploration-prototype");
      const css = document.createElement("link");
      css.rel = "stylesheet"; css.href = "exploration.css"; document.head.append(css);
      controls = document.createElement("section");
      controls.id = "explorationControls";
      controls.innerHTML = `<span class="trial-label">Bosquet Lent</span>
        <div class="floating-stick" aria-hidden="true"><span></span></div>
        <div class="touch-lesson" aria-hidden="true"><span class="lesson-ring"></span>
          <svg viewBox="0 0 54 68"><path d="M20 36V10c0-7 9-7 9 0v18c4-5 9-2 9 3 5-3 10 0 9 5 6 0 8 4 6 10l-5 16H22L9 44c-4-6 3-11 7-6l4 4z" fill="#f4e7bd" stroke="#405c49" stroke-width="2" stroke-linejoin="round"/></svg>
          <span class="lesson-label">Glisse doucement</span></div>
        <div class="trial-actions"><button id="trialJump" aria-label="Sauter">↟</button>
          <button id="trialCompanion" aria-label="Afficher ou cacher le compagnon">♧</button>
          <button id="trialInteract">Interagir</button></div>
        <button id="trialSkip" hidden>Passer</button><p class="trial-caption" aria-live="polite"></p>`;
      document.body.append(controls);
      stick = controls.querySelector(".floating-stick"); knob = stick.firstElementChild;
      guide = controls.querySelector(".touch-lesson"); action = document.getElementById("trialInteract");
      skip = document.getElementById("trialSkip"); banner = controls.querySelector(".trial-caption");
      action.addEventListener("click", () => { if (!scene && running && !isModalOpen()) interact(); });
      document.getElementById("trialJump").addEventListener("click", () => {
        if (!scene && running && !isModalOpen()) triggerPlayerHop();
      });
      document.getElementById("trialCompanion").addEventListener("click", () => {
        if (!scene && running && !isModalOpen() && state.companion.unlocked) toggleCompanionPresence();
      });
      skip.addEventListener("click", () => api.finishScene());
      canvas.addEventListener("pointerdown", down);
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", end);
      canvas.addEventListener("lostpointercapture", end);
      window.addEventListener("blur", () => { api.release(true); keys.clear(); });
      document.addEventListener("visibilitychange", () => { api.release(true); keys.clear(); });
      window.addEventListener("resize", () => api.release(true));
      // Trial controls never leak input through a modal, pause, or cinematic.
      updateControls();
    },
    release(immediate = false) {
      const id = touch.id;
      touch.id = null; touch.x = 0; touch.y = 0;
      if (stick) stick.classList.remove("is-active");
      if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      if (immediate && typeof state !== "undefined") state.player.depthVelocity = 0;
    },
    getInput() {
      let x = touch.x, y = touch.y;
      if (keys.has("ArrowLeft") || keys.has("q") || keys.has("Q") || keys.has("a") || keys.has("A")) x -= 1;
      if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) x += 1;
      if (["ArrowUp", "z", "Z", "w", "W"].some(k => keys.has(k))) y -= 1;
      if (["ArrowDown", "s", "S"].some(k => keys.has(k))) y += 1;
      const length = Math.hypot(x, y);
      const magnitude = Math.min(1, length);
      const keyboard = touch.id === null;
      const run = keyboard ? (isRunInput() ? 1 : 0) : clamp((magnitude - 0.55) / 0.45, 0, 1);
      return { x: length > 1 ? x / length : x, y: length > 1 ? y / length : y, run, magnitude };
    },
    depthLimit(x) {
      // Existing forest only: no rebuilt map or changed river/bridge geometry.
      if (isInSecretWorld() || state.friendlyChallenge || state.shelter) return 0;
      return clamp((2400 - x) / 260, 0, 1);
    },
    obstacles(x) {
      const list = [];
      const base = Math.floor(x / 900) * 900;
      for (let segment = base - 900; segment <= base + 900; segment += 900) {
        const treeX = segment + 70;
        if (isRiverGap(treeX, 230)) continue;
        // Footprints of the two trunks already drawn by drawCoverForeground.
        list.push({ x: treeX - 46, depth: -18, rx: 29, ry: 20 });
        list.push({ x: treeX + 37, depth: -18, rx: 26, ry: 20 });
      }
      return list;
    },
    moveDepth(dt, input, previousX, speed) {
      const p = state.player;
      const limit = api.depthLimit(p.x);
      if (!limit) { p.depth = 0; p.depthVelocity = 0; return; }
      const target = input.y * speed * 0.62;
      p.depthVelocity = (p.depthVelocity || 0) + (target - (p.depthVelocity || 0)) * (1 - Math.exp(-8 * dt));
      if (!input.y && Math.abs(p.depthVelocity) < 0.25) p.depthVelocity = 0;
      const startDepth = p.depth || 0;
      const dx = p.x - previousX, dy = p.depthVelocity * dt;
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 5));
      const obstacles = api.obstacles(p.x);
      let x = previousX, depth = startDepth;
      const blocked = (px, pd) => obstacles.some(o => ((px - o.x) / o.rx) ** 2 + ((pd - o.depth) / o.ry) ** 2 < 1);
      for (let step = 0; step < steps; step++) {
        // Axis-separated resolution lets the player slide around a trunk.
        if (!blocked(x + dx / steps, depth)) x += dx / steps;
        const nextDepth = clamp(depth + dy / steps, -58 * api.depthLimit(x), 46 * api.depthLimit(x));
        if (!blocked(x, nextDepth)) depth = nextDepth;
      }
      p.x = x; p.depth = depth;
      if (Math.abs(x - previousX) < 0.01 && Math.abs(dx) > 0.1) p.vx = 0;
      if (Math.abs(depth - startDepth) < 0.01 && Math.abs(dy) > 0.1) p.depthVelocity = 0;
      api.companionDepth += (depth - api.companionDepth) * (1 - Math.exp(-3 * dt));
    },
    onStart(reset) {
      api.release(); lastPosition = null;
      window.scrollTo(0, 0);
      document.querySelector(".game-shell").scrollTop = 0;
      if (reset) { api.companionDepth = 0; beginScene("intro", 2.6); }
      updateControls();
      // Orientation lock is separate from fullscreen and can be refused by browsers.
      if (screen.orientation?.lock && document.fullscreenElement) screen.orientation.lock("landscape").catch(() => {});
    },
    finishScene() {
      scene = null; skip.hidden = true; banner.textContent = "";
      state.camera.zoom = 1;
      api.release(); keys.clear();
    },
    updateScene(dt) {
      updateControls();
      if (!scene) return false;
      if (!running || document.hidden || isModalOpen()) return true;
      scene.elapsed += dt; state.time += dt;
      const t = clamp(scene.elapsed / scene.duration, 0, 1);
      const smooth = t * t * (3 - 2 * t);
      const normalX = Math.max(0, state.player.x - innerWidth * 0.45);
      state.camera.x = normalX + (reducedMotion ? 0 : (1 - smooth) * 64);
      state.camera.zoom = reducedMotion ? 1 : 1 + (1 - smooth) * 0.045;
      state.player.vx = 0; state.player.depthVelocity = 0;
      if (scene.kind === "discovery") {
        state.player.action = "rare"; state.player.actionUntil = state.time + 0.1;
      }
      if (t === 1) api.finishScene();
      return true;
    },
    updateGuidance(dt) {
      const p = state.player;
      if (lastPosition) travelled += Math.hypot(p.x - lastPosition.x, (p.depth || 0) - lastPosition.depth);
      lastPosition = { x: p.x, depth: p.depth || 0 };
      if (travelled > 50 && !learned.move) remember("move");
      if ((state.activeQuest || state.completedQuests > 0) && !learned.letter) remember("letter");
      if (learned.move && p.x > 760 && p.x < 1000 && !learned.discovery && !state.activeSecretWorld) {
        remember("discovery"); beginScene("discovery", 1.25);
      }
      updateControls();
    },
    drawOverlay() {
      if (!controls) return;
      updateControls();
      if (!running || isModalOpen()) return;
      if (!learned.move && !scene && touch.id === null) {
        guide.hidden = false; guide.classList.remove("is-tap");
        guide.style.left = `${Math.min(140, innerWidth * 0.22)}px`;
        guide.style.top = `${innerHeight - 92}px`;
        guide.querySelector(".lesson-label").textContent = "Glisse doucement";
      } else if (!learned.letter && !scene && touch.id === null && getInteractionTarget()?.kind === "letter") {
        const letter = getInteractionTarget().entry;
        guide.hidden = false; guide.classList.add("is-tap");
        guide.style.left = `${letter.x - state.camera.x}px`;
        guide.style.top = `${world.ground - 26}px`;
        guide.querySelector(".lesson-label").textContent = "Touche l’enveloppe";
      } else guide.hidden = true;
    }
  };
  function beginScene(kind, duration) {
    api.release(); keys.clear();
    scene = { kind, duration: reducedMotion ? 0.4 : duration, elapsed: 0 };
    skip.hidden = false;
    banner.textContent = kind === "intro" ? "Une lettre, un nouveau chemin…" : "Prendre le temps de découvrir";
  }
  function updateControls() {
    if (!controls) return;
    controls.classList.toggle("is-playing", running && !isModalOpen());
    controls.classList.toggle("is-scene", Boolean(scene));
    const target = running && !isModalOpen() ? getInteractionTarget() : null;
    action.disabled = !target || Boolean(scene);
    const names = { letter: "Lire", item: "Ramasser", villager: "Parler", secret: "Explorer", rest: "Se reposer", lantern: "Allumer" };
    action.textContent = names[target?.kind] || "Interagir";
    document.getElementById("trialCompanion").hidden = !state.companion.unlocked;
    if ((!running || isModalOpen()) && touch.id !== null) api.release();
  }
  function down(event) {
    if (!running || isModalOpen() || scene || touch.id !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
    const target = getInteractionTarget();
    if (target && Math.abs(event.clientX - (target.entry.x - state.camera.x)) < 46 && Math.abs(event.clientY - (world.ground - 30)) < 60) {
      event.preventDefault(); interact(); return;
    }
    if (event.clientX > innerWidth * 0.58 || event.clientY < innerHeight * 0.4) return;
    event.preventDefault();
    touch.id = event.pointerId;
    touch.originX = clamp(event.clientX, 54, innerWidth - 54);
    touch.originY = clamp(event.clientY, 54, innerHeight - 54);
    stick.style.left = `${touch.originX}px`; stick.style.top = `${touch.originY}px`;
    knob.style.transform = "translate(-50%, -50%)";
    stick.classList.add("is-active"); guide.hidden = true;
    canvas.setPointerCapture(event.pointerId);
  }
  function move(event) {
    if (event.pointerId !== touch.id) return;
    if (!running || isModalOpen() || scene) { api.release(); return; }
    event.preventDefault();
    const dx = event.clientX - touch.originX, dy = event.clientY - touch.originY;
    const length = Math.hypot(dx, dy), distance = Math.min(length, touch.radius);
    const amount = clamp((distance / touch.radius - 0.1) / 0.9, 0, 1);
    const eased = amount * amount * (3 - 2 * amount);
    touch.x = length ? dx / length * eased : 0;
    touch.y = length ? dy / length * eased : 0;
    const px = length ? dx / length * distance : 0, py = length ? dy / length * distance : 0;
    knob.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
  }
  function end(event) { if (event.pointerId === touch.id) api.release(); }
  window.bosquetExploration = api;
})();
