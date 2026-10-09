// Chaos.exe — all interactions are local; no backend required.
(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const app = $("#app");
  const meterNumber = $("#meterNumber");
  const meterFill = $("#meterFill");
  const levelLabel = $("#levelLabel");
  const clickCountLabel = $("#clickCount");
  const moodIcon = $("#moodIcon");
  const moodText = $("#moodText");
  const senseValue = $("#senseValue");
  const dramaValue = $("#dramaValue");
  const pointsValue = $("#pointsValue");
  const statusMessage = $("#statusMessage");
  const eventFeed = $("#eventFeed");
  const eventCount = $("#eventCount");
  const toastStack = $("#toastStack");
  const bossButton = $("#bossButton");
  const bossOverlay = $("#bossOverlay");
  const soundToggle = $("#soundToggle");

  let chaos = 0;
  let clicks = 0;
  let points = 0;
  let events = 0;
  let soundOn = false;
  let bossShown = false;
  let audioContext = null;
  let lastToastTime = 0;

  const roasts = [
    "Bhai, itna bhi kya click kar raha hai? Button tera baap ka hai?",
    "Mummy: Phone rakh de. Website:Aunty fr, main bhi iski bakchodi se cooked ho chuki hoon",
    "Error 404: Dimaag not found. Even Google said bhai rehne de.",
    "Tumhara patience dekh ke loading screen bhi ro rahi hai.",
    "Aapko milta hai ek imaginary trophy. Delivery charges alag.",
    "System bol raha hai: 'Bhai mujhe ghar jaana hai.'",
    "Breaking: Local human ne ek aur button daba diya.",
    "Tum click nahi kar rahe, apni kismat refresh kar rahe ho.",
    "Ye website nahi, tumhara digital situationship hai.",
    "Congratulations! Tumne apni hi productivity ko uninstall kar diya.",
    "Bhai, itni mehnat padhai mein kar leta toh NASA mein hota.",
    "IT waale ne bola tha 'simple site hai'. Ab woh Himalaya mein hai."
  ];
  const gyaan = [
    "Life ka golden rule: Ctrl+S dabate rehna. Feelings bhi save nahi hoti.",
    "Agar zindagi lemon de, toh uska screenshot le. Proof chahiye hota hai.",
    "Success ek journey hai. Tum filhaal loading screen par ho.",
    "Kal se pakka. Ye duniya ka sabse purana software hai.",
    "Apne dreams follow karo. Bas pehle alarm toh sun lo.",
    "Jab kuch samajh na aaye, confidently 'as per my last email' bol do."
  ];
  const statuses = [
    "Sab kuch control mein hai. (Jhooth.)",
    "System thoda sa hurt hua hai.",
    "IT waale ko call mat karna. Woh already ro raha hai.",
    "Mujhe reboot chahiye, tumhe hobbies.",
    "Ab toh bas bhagwan bharose.",
    "Main resign kar raha hoon. Notice period: 0 seconds."
  ];

  function playTone(kind = "click") {
    if (!soundOn) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext) audioContext = new AudioCtx();
      if (audioContext.state === "suspended") audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      const settings = {
        click: [520, 0.055, "square"],
        error: [170, 0.18, "sawtooth"],
        level: [760, 0.12, "triangle"],
        boss: [95, 0.5, "sawtooth"]
      }[kind] || [440, 0.08, "sine"];
      oscillator.type = settings[2];
      oscillator.frequency.setValueAtTime(settings[0], now);
      if (kind === "boss") oscillator.frequency.exponentialRampToValueAtTime(35, now + settings[1]);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + settings[1]);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + settings[1] + 0.02);
    } catch (error) {
      // Audio is an optional enhancement; the website still works without it.
    }
  }

  function getLevel(value = chaos) {
    if (value >= 100) return 4;
    if (value >= 60) return 3;
    if (value >= 30) return 2;
    if (value >= 10) return 1;
    return 0;
  }

  function getMood() {
    const level = getLevel();
    return [
      ["🙂", "Main bilkul normal hoon."],
      ["😐", "Bhai, ye kya kar diya?"],
      ["😵‍💫", "Mera processor ghoom raha hai."],
      ["🤬", "MAIN HR KO COMPLAINT KARUNGA."],
      ["💀", "SYSTEM NE SANYAAS LE LIYA."]
    ][level];
  }

  function updateUI() {
    const shownChaos = Math.min(100, chaos);
    meterNumber.textContent = shownChaos;
    meterFill.style.width = `${shownChaos}%`;
    clickCountLabel.textContent = `CLICKS: ${clicks}`;
    senseValue.textContent = `${Math.max(0, 100 - shownChaos)}%`;
    dramaValue.textContent = `${shownChaos}%`;
    pointsValue.textContent = `+${points}`;
    const level = getLevel();
    const levelNames = ["LEVEL 0 · INNOCENT", "LEVEL 1 · SUS", "LEVEL 2 · UNSTABLE", "LEVEL 3 · FULL PAGAL", "LEVEL MAX · COOKED"];
    levelLabel.textContent = levelNames[level];
    const [emoji, mood] = getMood();
    moodIcon.textContent = emoji;
    moodText.textContent = mood;
    statusMessage.textContent = statuses[Math.min(level, statuses.length - 1)];
    $("#systemStatus").textContent = level >= 3 ? "SYSTEM STATUS: COOKED" : level >= 1 ? "SYSTEM STATUS: SUS" : "SYSTEM STATUS: SUS";
    $("#scoreClicks").textContent = clicks;
    $("#scoreChaos").textContent = `${shownChaos}%`;
    $("#scoreTitle").textContent = getTitle();
    bossButton.disabled = shownChaos < 100;
    bossButton.textContent = shownChaos < 100 ? `UNLOCK AT ${100 - shownChaos}% MORE` : "FACE THE CONSEQUENCES";
    if (shownChaos >= 100) {
      document.body.classList.add("chaos-max");
      $("#bossTitle").innerHTML = "FINAL BOSS<br><span>UNLOCKED.</span>";
      $("#bossDescription").textContent = "Tumne kar dikhaya. Ab saamne aao, digital yoddha.";
      $("#bossFace").textContent = "ಠ益ಠ";
    } else {
      document.body.classList.remove("chaos-max");
    }
  }

  function getTitle() {
    if (chaos >= 100) return "Certified Digital Menace";
    if (chaos >= 75) return "CEO of Bakchodi";
    if (chaos >= 50) return "Professional Button Destroyer";
    if (chaos >= 25) return "Part-Time Problem";
    if (clicks >= 1) return "Curious Bystander";
    return "Innocent Bystander";
  }

  function addFeed(message, type = "normal") {
    events += 1;
    eventCount.textContent = `EVENTS: ${events}`;
    const entry = document.createElement("div");
    entry.className = "feed-entry";
    const time = document.createElement("span");
    time.className = "feed-time";
    time.textContent = "NOW";
    const content = document.createElement("span");
    content.textContent = message;
    if (type === "warning") content.style.color = "var(--pink)";
    if (type === "good") content.style.color = "var(--green)";
    entry.append(time, content);
    eventFeed.prepend(entry);
    while (eventFeed.children.length > 7) eventFeed.lastElementChild.remove();
  }

  function toast(message, title = "SYSTEM NOTIFICATION", icon = "⚠️") {
    const now = Date.now();
    if (now - lastToastTime < 250) return;
    lastToastTime = now;
    const item = document.createElement("div");
    item.className = "toast";
    const iconEl = document.createElement("span");
    iconEl.className = "toast-icon";
    iconEl.textContent = icon;
    const textWrap = document.createElement("div");
    const heading = document.createElement("strong");
    heading.textContent = title;
    const body = document.createElement("span");
    body.textContent = message;
    textWrap.append(heading, body);
    item.append(iconEl, textWrap);
    toastStack.prepend(item);
    while (toastStack.children.length > 3) toastStack.lastElementChild.remove();
    window.setTimeout(() => {
      item.classList.add("toast-out");
      window.setTimeout(() => item.remove(), 350);
    }, 7000);
  }

  function visualChaos() {
    if (chaos >= 30) {
      app.classList.remove("glitch-active");
      void app.offsetWidth;
      app.classList.add("glitch-active");
      window.setTimeout(() => app.classList.remove("glitch-active"), 1000);
    }
    if (chaos >= 60 && Math.random() < 0.55) {
      document.body.classList.remove("body-flash");
      void document.body.offsetWidth;
      document.body.classList.add("body-flash");
      window.setTimeout(() => document.body.classList.remove("body-flash"), 350);
    }
    if (chaos >= 80 && Math.random() < 0.35) {
      document.body.classList.add("shake");
      window.setTimeout(() => document.body.classList.remove("shake"), 400);
    }
  }

  function doAction({ gain = 8, message, title = "SYSTEM NOTIFICATION", icon = "⚠️", feedType = "normal", sound = "click" } = {}) {
    if (chaos >= 100) {
      toast("Bhai, meter full hai. Ab final boss se mil.", "CAPACITY EXCEEDED", "💀");
      playTone("error");
      return;
    }
    const previousLevel = getLevel();
    clicks += 1;
    chaos = Math.min(100, chaos + gain);
    points += Math.floor(gain * 10) + Math.floor(Math.random() * 15);
    updateUI();
    playTone(sound);
    if (message) toast(message, title, icon);
    addFeed(message || roasts[Math.floor(Math.random() * roasts.length)], feedType);
    visualChaos();
    const newLevel = getLevel();
    if (newLevel > previousLevel) {
      const levelMessages = {
        1: "LEVEL UP! Ab website ko tumse personal problem hai.",
        2: "CHAOS LEVEL 2! Koi IT waale ko bulao.",
        3: "LEVEL 3 UNLOCKED. Ye ab website nahi, ek cry for help hai.",
        4: "100% CHAOS. Tumne internet ko hila diya."
      };
      toast(levelMessages[newLevel], "LEVEL UP", "⚡");
      addFeed(levelMessages[newLevel], "warning");
      playTone(newLevel === 4 ? "boss" : "level");
    }
    if (chaos >= 100 && !bossShown) {
      bossShown = true;
      window.setTimeout(showBoss, 500);
    }
  }

  function showBoss() {
    $("#overlayScore").textContent = "100%";
    $("#overlayRoast").textContent = `Tumne ${clicks} clicks mein website ko emotional damage de diya. Title: ${getTitle()}. Ab jaake paani pee lo.`;
    bossOverlay.hidden = false;
    playTone("boss");
    addFeed("FINAL BOSS ARRIVED. RIP common sense.", "warning");
  }

  function resetChaos() {
    chaos = 0; clicks = 0; points = 0; events = 0; bossShown = false;
    eventFeed.innerHTML = "";
    toastStack.innerHTML = "";
    eventCount.textContent = "EVENTS: 0";
    bossOverlay.hidden = true;
    app.classList.remove("glitch-active", "shake");
    document.body.classList.remove("chaos-max", "body-flash");
    addFeed("System rebooted. IT waale ko mat batana.", "good");
    updateUI();
    playTone("click");
    toast("System reset ho gaya. Iss baar achhe se rehna.", "REBOOT COMPLETE", "🔄");
  }

  $("#startChaos").addEventListener("click", () => {
    doAction({ gain: 10, message: "Initiating chaos... mummy ko mat batana.", title: "BOOT SEQUENCE", icon: "🧨", feedType: "warning", sound: "level" });
    $("#meterNumber").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("#clickSimulator").addEventListener("click", () => {
    const message = roasts[Math.floor(Math.random() * roasts.length)];
    doAction({ gain: 8, message, title: "CLICK REGISTERED", icon: "🖱️" });
  });
  $("#senseTest").addEventListener("click", () => {
    const messages = [
      "Question: Agar 2 + 2 = 4, toh tumne ye button kyun dabaya? Koi jawab nahi.",
      "Brain scan complete. Report: 'Bas chal raha hai.'",
      "Result: 100% potential, 2% execution. Classic.",
      "Congratulations, tumhara common sense airplane mode par hai."
    ];
    doAction({ gain: 12, message: messages[Math.floor(Math.random() * messages.length)], title: "BRAIN SCAN RESULT", icon: "🧠", sound: "error" });
  });
  $("#randomGyaan").addEventListener("click", () => {
    doAction({ gain: 7, message: gyaan[Math.floor(Math.random() * gyaan.length)], title: "UNSOLICITED GYAAN", icon: "📢", feedType: "good" });
  });

  const dodgeButton = $("#dodgeButton");
  let dodgeCount = 0;
  function dodge() {
    const stage = dodgeButton.parentElement;
    const maxX = Math.max(0, stage.clientWidth - dodgeButton.offsetWidth);
    const maxY = 8;
    const left = Math.random() * maxX;
    const top = Math.random() * maxY;
    dodgeButton.style.left = `${left}px`;
    dodgeButton.style.top = `${top}px`;
    dodgeCount += 1;
    if (dodgeCount === 1 || dodgeCount % 3 === 0) {
      doAction({ gain: 5, message: ["PAKAD KE DIKHA, LEGEND.", "Button ne tumhe seen-zoned kar diya.", "Itna chase toh ex ko bhi nahi kiya hoga.", "Button: Main apni marzi ka malik hoon."][Math.floor(Math.random() * 4)], title: "BUTTON ESCAPED", icon: "🏃" });
    }
  }
  dodgeButton.addEventListener("pointerenter", dodge);
  dodgeButton.addEventListener("focus", dodge);
  dodgeButton.addEventListener("click", () => {
    doAction({ gain: 10, message: "Impossible! Tumne button pakad liya. NASA is calling.", title: "ACHIEVEMENT UNLOCKED", icon: "🏆", feedType: "good" });
  });
  // On touch devices, let the user tap it instead of making it impossible to reach.
  dodgeButton.addEventListener("touchstart", (event) => {
    if (window.matchMedia("(hover: none)").matches) {
      event.preventDefault();
      doAction({ gain: 5, message: "Mobile pe pakad liya? Hacker hai bhai.", title: "TOUCH DETECTED", icon: "📱" });
      dodge();
    }
  }, { passive: false });

  bossButton.addEventListener("click", () => {
    if (chaos >= 100) showBoss();
    else toast("Abhi toh trailer chal raha hai. Meter full kar, bhai.", "FINAL BOSS LOCKED", "🔒");
  });
  $("#closeBoss").addEventListener("click", () => { bossOverlay.hidden = true; });
  bossOverlay.addEventListener("click", (event) => { if (event.target === bossOverlay) bossOverlay.hidden = true; });
  $("#modalReset").addEventListener("click", resetChaos);
  $("#playAgain").addEventListener("click", () => { resetChaos(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  $("#resetTop").addEventListener("click", resetChaos);
  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.textContent = soundOn ? "♫ SOUND: ON" : "♫ SOUND: OFF";
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    soundToggle.style.color = soundOn ? "var(--green)" : "";
    if (soundOn) playTone("level");
    toast(soundOn ? "Audio enabled. Ab thoda shor machate hain." : "Silence is golden. Tum bhi thoda shaant ho jao.", "SOUND SETTINGS", soundOn ? "🔊" : "🔇");
  });
  $("#copyScore").addEventListener("click", async () => {
    const score = `Chaos.exe Scorecard | Clicks: ${clicks} | Chaos: ${chaos}% | Title: ${getTitle()} — Ek click toh banta hai.`;
    try {
      await navigator.clipboard.writeText(score);
      toast("Score clipboard mein copy ho gaya. Ab flex kar.", "COPIED SUCCESSFULLY", "📋");
    } catch (error) {
      toast(score, "YOUR SCORE", "📋");
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") bossOverlay.hidden = true;
    // Tiny secret: type CHAOS to trigger a bonus.
    if (!document._chaosKeys) document._chaosKeys = "";
    document._chaosKeys = (document._chaosKeys + event.key.toLowerCase()).slice(-5);
    if (document._chaosKeys === "chaos") {
      doAction({ gain: 15, message: "SECRET CODE ACCEPTED. Tum thode zyada hi online ho.", title: "EASTER EGG FOUND", icon: "🥚", feedType: "good", sound: "level" });
      document._chaosKeys = "";
    }
  });

  // Keep the moving button inside its stage after viewport changes.
  window.addEventListener("resize", () => {
    dodgeButton.style.left = "0px";
    dodgeButton.style.top = "0px";
  });

  updateUI();
  addFeed("System booted. IT waale ko mat batana.", "good");
 
})();

(() => {
  const initAuraDetector = () => {
    const root = document.getElementById("aura-detector");
    if (!root || root.dataset.initialized === "true") return;
    root.dataset.initialized = "true";

    const $ = (id) => root.querySelector(`#${id}`);

    const intro = $("aura-intro");
    const quiz = $("aura-quiz");
    const result = $("aura-result");
    const questionEl = $("aura-question");
    const optionsEl = $("aura-options");
    const backBtn = $("aura-back");
    const fill = $("aura-progress-fill");
    const stepLabel = $("aura-step-label");
    const percent = $("aura-percent");
    const feedback = $("aura-feedback");

    // Every answer awards one point to a personality type.
    const questions = [
      {
        q: "Group chat mein tumhari asli identity kya hai?",
        options: [
          ["👑", "Main character. Plot mere around ghoomta hai.", "main"],
          ["👻", "Seen at 2:14 AM. Reply kabhi nahi.", "npc"],
          ["🤡", "Joke main hoon, par funny bhi main hi.", "clown"],
          ["🗿", "Kam bolta hoon. Presence kaafi hai.", "sigma"],
          ["💀", "Group chat ka final boss.", "boss"]
        ]
      },
      {
        q: "Crush ne 'haha' reply kiya. Ab?",
        options: [
          ["📖", "Uske punctuation ka analysis karunga.", "clown"],
          ["🗿", "Seen. Life goes on.", "sigma"],
          ["🎬", "New character arc unlocked.", "main"],
          ["👻", "Main toh message bhejna hi bhool gaya.", "npc"],
          ["🔥", "Next mission. No emotional damage.", "boss"]
        ]
      },
      {
        q: "Exam kal hai aur syllabus 0% complete.",
        options: [
          ["📚", "Main 8-hour academic comeback karunga.", "main"],
          ["🙏", "Bhagwan aur class topper ko yaad karunga.", "npc"],
          ["🤡", "YouTube kholunga, phir memes dekhunga.", "clown"],
          ["🗿", "Jo aata hai woh likhunga. Peace.", "sigma"],
          ["⚔️", "All-nighter. No surrender.", "boss"]
        ]
      },
      {
        q: "Tumhara personal brand kya hai?",
        options: [
          ["🕶️", "Mysterious. Online 24/7, unavailable always.", "sigma"],
          ["🎭", "Har din ek naya personality update.", "main"],
          ["🧍", "Background character with premium Wi-Fi.", "npc"],
          ["🗣️", "Unfiltered bakchodi, unlimited edition.", "clown"],
          ["💀", "A problem the universe cannot patch.", "boss"]
        ]
      },
      {
        q: "Life tumhe ek random side quest deti hai.",
        options: [
          ["🚀", "Main ise cinematic bana dunga.", "main"],
          ["🗿", "Observe. Adapt. Disappear.", "sigma"],
          ["🎲", "Bina soche haan bol dunga.", "clown"],
          ["🧍", "Koi aur pehle kare, phir dekhenge.", "npc"],
          ["🔥", "Side quest? Main hi final objective hoon.", "boss"]
        ]
      }
    ];

    const types = {
      sigma: {
        name: "SIGMA LITE™",
        emoji: "🗿",
        score: "+4200",
        rarity: "Rare-ish",
        roast: "Tum mysterious nahi ho, bhai. Bas notifications off karke character development samajh rahe ho.",
        message: "Passive aura detected. Tumhara screen time aur social battery ek doosre ke enemies hain."
      },
      npc: {
        name: "CERTIFIED NPC",
        emoji: "🧍",
        score: "-999",
        rarity: "Common",
        roast: "Dialogue options limited. Side quest pending. Main storyline ka pata nahi.",
        message: "Tumhari vibe: 'haan bhai, sahi hai'. Bonus points for existing peacefully."
      },
      clown: {
        name: "CERTIFIED CLOWN",
        emoji: "🤡",
        score: "-2500",
        rarity: "Legendary L",
        roast: "Tum red flags nahi dekhte. Tum unhe colour palette samajh kar decorate karte ho.",
        message: "Delusion stat: MAX. Self-awareness stat: server maintenance pe."
      },
      main: {
        name: "MAIN CHARACTER",
        emoji: "🎬",
        score: "+9999",
        rarity: "Epic",
        roast: "Background music khud imagine karte ho aur har inconvenience ko character arc bolte ho.",
        message: "Cinematic aura unlocked. Bas har random stranger ko apni origin story mat suna dena."
      },
      boss: {
        name: "FINAL BOSS",
        emoji: "💀",
        score: "OVERFLOW",
        rarity: "Mythic",
        roast: "Tum room mein enter nahi karte. Tumhare aane se background music change hota hai.",
        message: "Threat level: unnecessarily high. Touch grass achievement abhi bhi locked hai."
      }
    };

    let current = 0;
    let answers = [];
    let lastType = "npc";

    // Optional generated sound. No audio files or libraries needed.
    function auraPlayTone(kind = "click") {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        const notes = kind === "result"
          ? [440, 554, 659, 880]
          : [kind === "back" ? 260 : 520];

        notes.forEach((frequency, index) => {
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();
          const startAt = ctx.currentTime + index * 0.09;

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(frequency, startAt);
          gain.gain.setValueAtTime(0.0001, startAt);
          gain.gain.exponentialRampToValueAtTime(0.06, startAt + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16);

          oscillator.connect(gain);
          gain.connect(ctx.destination);
          oscillator.start(startAt);
          oscillator.stop(startAt + 0.18);
        });

        setTimeout(() => ctx.close(), 900);
      } catch (_) {
        // Sound is optional; quiz still works without it.
      }
    }

    function showScreen(screen) {
      intro.hidden = screen !== "intro";
      quiz.hidden = screen !== "quiz";
      result.hidden = screen !== "result";
    }

    function renderQuestion() {
      const question = questions[current];
      const progress = Math.round(((current + 1) / questions.length) * 100);

      stepLabel.textContent =
        `QUESTION ${String(current + 1).padStart(2, "0")} / ${questions.length}`;
      percent.textContent = `${progress}%`;
      fill.style.width = `${progress}%`;

      questionEl.textContent = question.q;
      optionsEl.replaceChildren();

      question.options.forEach(([emoji, label, type], index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "aura-option";

        const letter = document.createElement("span");
        letter.className = "aura-option-letter";
        letter.textContent = String.fromCharCode(65 + index);

        const text = document.createElement("span");
        text.textContent = `${emoji}  ${label}`;

        button.append(letter, text);

        button.addEventListener("click", () => {
          answers[current] = type;
          auraPlayTone();

          if (current < questions.length - 1) {
            current++;
            renderQuestion();
          } else {
            showResult();
          }
        });

        optionsEl.appendChild(button);
      });

      backBtn.hidden = current === 0;

      const questionArea = $("aura-question-area");
      questionArea.style.animation = "none";
      void questionArea.offsetWidth;
      questionArea.style.animation = "";
    }

    function showResult() {
      const counts = {
        sigma: 0, npc: 0, clown: 0, main: 0, boss: 0
      };

      answers.forEach(type => {
        if (Object.prototype.hasOwnProperty.call(counts, type)) {
          counts[type]++;
        }
      });

      // Stable tie-breaking: first type with the highest score wins.
      const order = ["boss", "main", "sigma", "clown", "npc"];
      lastType = order.reduce((best, type) =>
        counts[type] > counts[best] ? type : best
      , order[0]);

      const data = types[lastType];

      $("aura-result-emoji").textContent = data.emoji;
      $("aura-result-title").textContent = data.name;
      $("aura-score").textContent = data.score;
      $("aura-rarity").textContent = data.rarity;
      $("aura-result-roast").textContent = data.roast;
      $("aura-result-message").textContent = data.message;

      showScreen("result");
      feedback.textContent = "";
      auraPlayTone("result");

      result.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function resultText() {
      const data = types[lastType];
      return `MY CHAOS PURAN AURA RESULT\n${data.emoji} ${data.name}\nAura: ${data.score}\nRarity: ${data.rarity}\n\n"${data.roast}"\n\nDiscover yours on CHAOS PURAN!`;
    }

    // Create a real PNG result card using Canvas.
    async function makeResultCard() {
      const data = types[lastType];
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available");

      const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
      gradient.addColorStop(0, "#130b24");
      gradient.addColorStop(0.5, "#28113d");
      gradient.addColorStop(1, "#080810");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1350);

      // Decorative background circles.
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#ff6bd6";
      ctx.beginPath();
      ctx.arc(100, 180, 240, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#76f7ff";
      ctx.beginPath();
      ctx.arc(1000, 1150, 300, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#ff83dc";
      ctx.font = "bold 32px Arial";
      ctx.fillText("CHAOS PURAN  /  AURA SCANNER", 70, 100);

      ctx.strokeStyle = "#ffffff35";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(70, 140);
      ctx.lineTo(1010, 140);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.font = "150px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(data.emoji, 540, 365);

      ctx.fillStyle = "#bfa8ff";
      ctx.font = "bold 28px Arial";
      ctx.fillText("YOUR INTERNET PERSONALITY IS...", 540, 450);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 65px Arial";
      wrapCanvasText(ctx, data.name, 540, 555, 900, 78);

      ctx.fillStyle = "#ff83dc";
      ctx.font = "bold 38px Arial";
      ctx.fillText(`AURA: ${data.score}`, 540, 700);

      ctx.fillStyle = "#76f7ff";
      ctx.font = "bold 28px Arial";
      ctx.fillText(`RARITY: ${data.rarity}`, 540, 760);

      ctx.fillStyle = "#e3dced";
      ctx.font = "30px Arial";
      wrapCanvasText(ctx, data.roast, 540, 875, 820, 48);

      ctx.fillStyle = "#a79bbd";
      ctx.font = "24px Arial";
      ctx.fillText("5 QUESTIONS  •  0% SCIENTIFIC  •  100% BAKCHODI", 540, 1190);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px Arial";
      ctx.fillText("DISCOVER YOUR AURA", 540, 1260);

      return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error("Could not generate result image"));
        }, "image/png");
      });
    }

    function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
      const words = text.split(/\s+/);
      const lines = [];
      let line = "";

      words.forEach(word => {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      });

      if (line) lines.push(line);

      ctx.textAlign = "center";
      lines.forEach((item, index) => {
        ctx.fillText(item, x, y + index * lineHeight);
      });
    }

    $("aura-start").addEventListener("click", () => {
      current = 0;
      answers = [];
      showScreen("quiz");
      renderQuestion();
      auraPlayTone();
      quiz.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    backBtn.addEventListener("click", () => {
      if (current > 0) {
        current--;
        renderQuestion();
        auraPlayTone("back");
      }
    });

    $("aura-retry").addEventListener("click", () => {
      current = 0;
      answers = [];
      fill.style.width = "0%";
      showScreen("intro");
      auraPlayTone();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("aura-download").addEventListener("click", async () => {
      feedback.textContent = "Generating your card... ✨";

      try {
        const blob = await makeResultCard();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `chaos-puran-${lastType}-aura.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        feedback.textContent = "Result card downloaded. Go flex, bro. 📸";
      } catch (_) {
        feedback.textContent = "Card generation failed. Try another browser.";
      }
    });

    $("aura-share").addEventListener("click", async () => {
      const text = resultText();
      feedback.textContent = "";

      try {
        if (navigator.share) {
          // Share text first for broad mobile-browser compatibility.
          await navigator.share({
            title: "My CHAOS PURAN Aura",
            text
          });
          feedback.textContent = "Aura successfully flexed. 🗿";
        } else if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          feedback.textContent = "Result copied! Paste it in your group chat. 📋";
        } else {
          feedback.textContent =
            "Use Download Result Card to save and share your result.";
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          feedback.textContent =
            "Sharing unavailable. Download the result card instead.";
        }
      }
    });

    showScreen("intro");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAuraDetector, { once: true });
  } else {
    initAuraDetector();
  }
})();

// BEIZZATI BOT
const roastLines = [
  "bhai, tera confidence dekh ke tutorial bhi tujhe skip kar deta hai 💀",
  "teri life ka loading screen khatam hi nahi ho raha ⏳",
  "tu group project ka woh member hai jo bas attendance mein hota hai 😭",
  "tera aura itna negative hai, Wi-Fi bhi connect hone se mana kar de 📶",
  "tera comeback itna late aata hai ki topic hi change ho jata hai 🤡",
  "tera character development abhi bhi COMING SOON pe hai 🎬",
  "bhai, tu NPC bhi nahi, deleted background character hai 🗿",
  "teri productivity dekh ke aalas ne resignation de diya 🛌",
  "tera rizz dekh ke Bluetooth bhi pairing cancel kar de 🥀",
  "bhai, tu red flag nahi, poora China ka parade hai 🚩",
  "tera brain abhi bhi free trial pe chal raha hai 💀",
  "tu itna single hai ki OTP bhi tere phone pe aane se pehle sochta hai 😭"
];

const roastBtn = document.getElementById("roast-btn");
const roastResult = document.getElementById("roast-result");
const roastName = document.getElementById("roast-name");
const copyRoastBtn = document.getElementById("copy-roast-btn");

if (roastBtn && roastResult && roastName && copyRoastBtn) {
  roastBtn.addEventListener("click", () => {
    const name = roastName.value.trim();
    const roast = roastLines[
      Math.floor(Math.random() * roastLines.length)
    ];

    roastResult.textContent = name
      ? `${name}, ${roast}`
      : roast;

    // Optional roast sound
    try {
      const audio = new Audio(
        "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg"
      );
      audio.volume = 0.35;
      audio.play().catch(() => {});
    } catch (error) {}
  });

  copyRoastBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(
        roastResult.textContent
      );
      copyRoastBtn.textContent = "COPIED 💀";
      setTimeout(() => {
        copyRoastBtn.textContent = "📋 COPY ROAST";
      }, 1500);
    } catch (error) {
      alert("Copy nahi hua. Roast ko manually copy kar lo!");
    }
  });
}


