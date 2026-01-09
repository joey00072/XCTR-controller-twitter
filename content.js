(() => {
  const DEBUG = true;
  const CONFIG = {
    deadzone: 0.18,
    releaseZone: 0.12,
    releaseHoldMs: 180,
    scrollMinSpeed: 2,
    scrollMaxSpeed: 22,
    scrollAccelMs: 500,
    triggerBoost: 8,
    navInitialDelay: 320,
    navMinDelay: 140,
    navAccelMs: 700,
    doublePressMs: 350,
    leftStickAxis: 1,
    rightStickAxis: 3,
    axisLogIntervalMs: 600,
    stickAutoSelectBlockMs: 400
  };

  const BUTTON = {
    A: 0,
    B: 1,
    X: 2,
    Y: 3,
    LB: 4,
    RB: 5,
    LT: 6,
    RT: 7,
    VIEW: 8,
    MENU: 9,
    LS: 10,
    RS: 11,
    DUP: 12,
    DDOWN: 13,
    DLEFT: 14,
    DRIGHT: 15
  };

  let prevButtons = [];
  let activeTweet = null;
  let lastAPress = 0;
  let lastAutoSelect = 0;
  let pendingScrollUpdate = false;
  let running = false;
  let lastGamepadSeen = 0;
  let leftAxisIndex = CONFIG.leftStickAxis;
  let rightAxisIndex = CONFIG.rightStickAxis;
  let lastScrollY = window.scrollY;
  let lastStickScrollAt = 0;
  let leftHoldStart = 0;
  let lastLeftSign = 0;
  let dpadHoldStart = 0;
  let dpadDirection = 0;
  let nextDpadStepAt = 0;
  let lastAxisLogAt = 0;

  function log(...args) {
    if (!DEBUG) return;
    // Keep logs easy to filter in DevTools.
    console.log("[xctr]", ...args);
  }

  const style = document.createElement("style");
  style.textContent = ".xctr-active{box-shadow:0 0 0 3px #1d9bf0; border-radius:16px;}";
  document.documentElement.appendChild(style);
  log("content script loaded");

  function startLoop() {
    if (running) return;
    running = true;
    log("loop started");
    requestAnimationFrame(tick);
  }

  function tick() {
    const gamepad = getGamepad();
    if (gamepad && document.visibilityState === "visible") {
      lastGamepadSeen = performance.now();
      handleGamepad(gamepad);
    } else if (DEBUG && performance.now() - lastGamepadSeen > 2000) {
      lastGamepadSeen = performance.now();
      log("waiting for gamepad or visible page");
    }
    requestAnimationFrame(tick);
  }

  function getGamepad() {
    if (!navigator.getGamepads) return null;
    const gamepads = navigator.getGamepads();
    if (!gamepads || !gamepads.length) return null;
    return gamepads[0];
  }

  function getAxisValue(gamepad, index) {
    const axes = gamepad.axes || [];
    return axes.length > index ? axes[index] : 0;
  }

  function pickActiveAxisIndex(gamepad) {
    const axes = gamepad.axes || [];
    let bestIndex = 0;
    let bestValue = 0;
    for (let i = 0; i < axes.length; i += 1) {
      const v = Math.abs(axes[i]);
      if (v > bestValue) {
        bestValue = v;
        bestIndex = i;
      }
    }
    return { index: bestIndex, value: axes[bestIndex] || 0, axes };
  }

  function handleGamepad(gamepad) {
    const leftY = getAxisValue(gamepad, leftAxisIndex);
    const rightY = getAxisValue(gamepad, rightAxisIndex);
    const leftAbs = Math.abs(leftY);
    const rightAbs = Math.abs(rightY);
    const scrollY =
      leftAbs > CONFIG.deadzone ? leftY : rightAbs > CONFIG.deadzone ? rightY : 0;
    const scrollAbs = Math.abs(scrollY);
    const now = performance.now();
    if (DEBUG && now - lastAxisLogAt > CONFIG.axisLogIntervalMs) {
      lastAxisLogAt = now;
      log("axisY L/R", leftY.toFixed(2), rightY.toFixed(2), `idx ${leftAxisIndex}/${rightAxisIndex}`);
    }

    // Joystick: smooth scrolling (prefers left stick, falls back to right).
    if (scrollAbs > CONFIG.deadzone) {
      const sign = Math.sign(scrollY);
      if (!leftHoldStart || sign !== lastLeftSign) {
        leftHoldStart = now;
        lastLeftSign = sign;
      }
      const heldMs = now - leftHoldStart;
      const accel = Math.min(1, heldMs / CONFIG.scrollAccelMs);
      const mag = Math.min(1, (scrollAbs - CONFIG.deadzone) / (1 - CONFIG.deadzone));
      const boost =
        gamepad.buttons && gamepad.buttons[BUTTON.RT] ? gamepad.buttons[BUTTON.RT].value || 0 : 0;
      const baseSpeed =
        CONFIG.scrollMinSpeed + (CONFIG.scrollMaxSpeed - CONFIG.scrollMinSpeed) * accel;
      const speed = (baseSpeed + boost * CONFIG.triggerBoost * accel) * mag;
      window.scrollBy(0, sign * speed);
      lastStickScrollAt = now;
    } else {
      leftHoldStart = 0;
      lastLeftSign = 0;
    }

    // D-pad up/down: post-by-post selection (repeat while held).
    const up = gamepad.buttons[BUTTON.DUP] && gamepad.buttons[BUTTON.DUP].pressed;
    const down = gamepad.buttons[BUTTON.DDOWN] && gamepad.buttons[BUTTON.DDOWN].pressed;
    const dir = up && !down ? -1 : down && !up ? 1 : 0;
    if (dir === 0) {
      dpadHoldStart = 0;
      dpadDirection = 0;
      nextDpadStepAt = 0;
    } else {
      if (!dpadHoldStart || dir !== dpadDirection) {
        dpadHoldStart = now;
        dpadDirection = dir;
        nextDpadStepAt = 0;
      }
      const heldMs = now - dpadHoldStart;
      const accel = Math.min(1, heldMs / CONFIG.navAccelMs);
      const delay =
        CONFIG.navInitialDelay - (CONFIG.navInitialDelay - CONFIG.navMinDelay) * accel;
      if (!nextDpadStepAt || now >= nextDpadStepAt) {
        stepActive(dpadDirection, true);
        nextDpadStepAt = now + delay;
      }
    }

    const pressed = gamepad.buttons.map((b) => b.pressed);
    if (!prevButtons.length) {
      prevButtons = pressed.slice();
      return;
    }

    for (let i = 0; i < pressed.length; i += 1) {
      if (pressed[i] && !prevButtons[i]) {
        log("button press", i);
        onButtonPress(i);
      }
    }

    prevButtons = pressed;
  }

  function onButtonPress(index) {
    if (isEditable(document.activeElement) && index !== BUTTON.B) return;

    switch (index) {
      case BUTTON.A:
        handleAPress();
        break;
      case BUTTON.B:
        backAction();
        break;
      case BUTTON.X:
        replyAction();
        break;
      case BUTTON.Y:
        repostAction();
        break;
      case BUTTON.LB:
        selectRelative(-1);
        break;
      case BUTTON.RB:
        selectRelative(1);
        break;
      case BUTTON.LS:
        {
          const picked = pickActiveAxisIndex(getGamepad() || { axes: [] });
          leftAxisIndex = picked.index;
          log("left stick axis calibrated", leftAxisIndex, picked.value.toFixed(2), picked.axes);
        }
        break;
      case BUTTON.RS:
        {
          const picked = pickActiveAxisIndex(getGamepad() || { axes: [] });
          rightAxisIndex = picked.index;
          log("right stick axis calibrated", rightAxisIndex, picked.value.toFixed(2), picked.axes);
        }
        break;
      case BUTTON.DLEFT:
        selectRelative(-1);
        break;
      case BUTTON.DRIGHT:
        selectRelative(1);
        break;
      case BUTTON.MENU:
        openTweet();
        break;
      case BUTTON.VIEW:
        jumpTop();
        break;
      default:
        break;
    }
  }

  function isEditable(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
  }

  function getTweetList() {
    let tweets = Array.from(document.querySelectorAll('article[role="article"]'));
    let filtered = tweets.filter((tweet) =>
      tweet.querySelector('[data-testid="like"], [data-testid="unlike"]')
    );
    if (filtered.length) return filtered;

    tweets = Array.from(document.querySelectorAll('[data-testid="tweet"]'));
    filtered = tweets.filter((tweet) =>
      tweet.querySelector('[data-testid="like"], [data-testid="unlike"]')
    );
    return filtered.length ? filtered : tweets;
  }

  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  }

  function findButtonInTweet(tweet, kind) {
    if (!tweet) return null;
    const selectors =
      kind === "like"
        ? [
            '[data-testid="like"]',
            '[data-testid="favorite"]',
            '[role="button"][aria-label*="Like"]',
            '[role="button"][aria-label*="like"]'
          ]
        : [
            '[data-testid="unlike"]',
            '[data-testid="unfavorite"]',
            '[role="button"][aria-label*="Unlike"]',
            '[role="button"][aria-label*="unlike"]'
          ];
    for (const sel of selectors) {
      const btn = tweet.querySelector(sel);
      if (btn) return btn;
    }
    return null;
  }

  function dumpTweetDebug(tweet) {
    if (!tweet) return;
    const testids = Array.from(tweet.querySelectorAll("[data-testid]"))
      .map((el) => el.getAttribute("data-testid"))
      .filter(Boolean);
    const uniqueTestids = Array.from(new Set(testids));
    const labels = Array.from(tweet.querySelectorAll('[role="button"][aria-label]'))
      .map((el) => el.getAttribute("aria-label"))
      .filter(Boolean);
    const uniqueLabels = Array.from(new Set(labels));
    log("tweet data-testid values", uniqueTestids.slice(0, 30));
    log("tweet aria-label buttons", uniqueLabels.slice(0, 30));
    const actionGroup = tweet.querySelector('[role="group"]');
    if (actionGroup) {
      const snippet = actionGroup.outerHTML.replace(/\\s+/g, " ").slice(0, 400);
      log("action group snippet", snippet);
    } else {
      log("action group not found in tweet");
    }
  }

  function setActiveTweet(el) {
    if (activeTweet && activeTweet !== el) {
      activeTweet.classList.remove("xctr-active");
    }
    activeTweet = el;
    if (activeTweet) {
      activeTweet.classList.add("xctr-active");
      log("active tweet set");
    }
  }

  function getActiveTweet() {
    if (activeTweet && document.contains(activeTweet)) return activeTweet;
    const list = getTweetList();
    if (!list.length) return null;
    const visible = list.filter(isVisible);
    const pick = visible.length ? visible[0] : list[0];
    setActiveTweet(pick);
    return pick;
  }

  function getActiveTweetForAction() {
    let tweet = getActiveTweet();
    if (tweet && tweet.querySelector('[data-testid="like"], [data-testid="unlike"]')) {
      return tweet;
    }
    const list = getTweetList();
    if (!list.length) return tweet;
    const index = findNearestIndex(list);
    tweet = list[index];
    setActiveTweet(tweet);
    return tweet;
  }

  function findNearestIndex(list) {
    let nearest = 0;
    let min = Infinity;
    for (let i = 0; i < list.length; i += 1) {
      const rect = list[i].getBoundingClientRect();
      const dist = Math.abs(rect.top - window.innerHeight * 0.35);
      if (dist < min) {
        min = dist;
        nearest = i;
      }
    }
    return nearest;
  }

  function updateSelectionOnScroll(direction) {
    const now = performance.now();
    if (now - lastAutoSelect < 160) return;
    const list = getTweetList();
    if (!list.length) return;

    let tweet = getActiveTweet();
    if (!tweet || !document.contains(tweet) || !isVisible(tweet) || direction === 0) {
      const index = findNearestIndex(list);
      const target = list[index];
      if (target) {
        setActiveTweet(target);
        lastAutoSelect = now;
      }
      return;
    }

    const rect = tweet.getBoundingClientRect();
    const upper = window.innerHeight * 0.2;
    const lower = window.innerHeight * 0.8;
    if (direction > 0 && rect.top < upper) {
      stepActive(1, false);
      lastAutoSelect = now;
    } else if (direction < 0 && rect.bottom > lower) {
      stepActive(-1, false);
      lastAutoSelect = now;
    }
  }

  function stepActive(delta, shouldScroll) {
    const list = getTweetList();
    if (!list.length) return;
    let index = list.indexOf(activeTweet);
    if (index === -1) index = findNearestIndex(list);
    const nextIndex = Math.max(0, Math.min(list.length - 1, index + delta));
    const target = list[nextIndex];
    setActiveTweet(target);
    if (target && shouldScroll) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function selectRelative(delta) {
    stepActive(delta, true);
  }

  function handleAPress() {
    const now = performance.now();
    if (now - lastAPress < CONFIG.doublePressMs) {
      unlikeActionWithRetry(0);
      lastAPress = 0;
      return;
    }
    likeAction();
    lastAPress = now;
  }

  function likeAction() {
    const tweet = getActiveTweetForAction();
    const likeBtn = findButtonInTweet(tweet, "like");
    if (!likeBtn) {
      log("like: button not found");
      dumpTweetDebug(tweet);
      return;
    }
    likeBtn.click();
  }

  function unlikeAction() {
    const tweet = getActiveTweetForAction();
    const unlikeBtn = findButtonInTweet(tweet, "unlike");
    if (!unlikeBtn) {
      log("unlike: button not found");
      dumpTweetDebug(tweet);
      return;
    }
    unlikeBtn.click();
  }

  function unlikeActionWithRetry(attempt) {
    const tweet = getActiveTweetForAction();
    if (!tweet) {
      log("unlike retry: no active tweet");
      return;
    }
    const unlikeBtn = findButtonInTweet(tweet, "unlike");
    if (unlikeBtn) {
      unlikeBtn.click();
      log("unlike: clicked");
      return;
    }
    if (attempt < 6) {
      setTimeout(() => unlikeActionWithRetry(attempt + 1), 120);
    }
  }

  function replyAction() {
    const tweet = getActiveTweet();
    if (!tweet) {
      log("reply: no active tweet");
      return;
    }
    const btn = tweet.querySelector('[data-testid="reply"]');
    if (!btn) {
      log("reply: button not found");
      return;
    }
    btn.click();
    setTimeout(() => {
      const box = document.querySelector('[data-testid="tweetTextarea_0"], div[role="textbox"]');
      if (box) box.focus();
    }, 150);
  }

  function repostAction() {
    const tweet = getActiveTweet();
    if (!tweet) {
      log("repost: no active tweet");
      return;
    }
    const btn = tweet.querySelector('[data-testid="retweet"], [data-testid="unretweet"]');
    if (!btn) {
      log("repost: button not found");
      return;
    }
    btn.click();
    setTimeout(() => {
      const confirm = document.querySelector('[data-testid="retweetConfirm"], [data-testid="unretweetConfirm"]');
      if (confirm) {
        confirm.click();
        return;
      }
      const items = Array.from(document.querySelectorAll('div[role="menuitem"]'));
      const target = items.find((el) => /repost|retweet|undo repost|undo retweet/i.test(el.innerText));
      if (target) target.click();
    }, 150);
  }

  function openTweet() {
    const tweet = getActiveTweet();
    if (!tweet) {
      log("open: no active tweet");
      return;
    }
    const link = tweet.querySelector('a[href*="/status/"]');
    if (link) {
      link.click();
      return;
    }
    tweet.click();
  }

  function backAction() {
    const close = document.querySelector('[aria-label="Close"], [data-testid="app-bar-close"], [data-testid="AppTabBar_Close"]');
    if (close) {
      close.click();
      return;
    }
    const back = document.querySelector('a[aria-label="Back"], [data-testid="app-bar-back"]');
    if (back) {
      back.click();
      return;
    }
    const esc = new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      which: 27,
      bubbles: true
    });
    document.dispatchEvent(esc);
    window.dispatchEvent(esc);
  }

  function scrollStep(direction) {
    window.scrollBy({ top: direction * window.innerHeight * 0.6, behavior: "smooth" });
    setTimeout(() => updateSelectionOnScroll(direction), 200);
  }

  function jumpTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => updateSelectionOnScroll(0), 200);
  }

  window.addEventListener("gamepadconnected", startLoop);
  window.addEventListener("focus", startLoop);
  window.addEventListener("gamepadconnected", (e) => {
    const gp = e.gamepad || {};
    log("gamepad connected", gp.id || "unknown");
  });
  window.addEventListener("gamepaddisconnected", (e) => {
    const gp = e.gamepad || {};
    log("gamepad disconnected", gp.id || "unknown");
  });
  window.addEventListener("scroll", () => {
    if (pendingScrollUpdate) return;
    pendingScrollUpdate = true;
    requestAnimationFrame(() => {
      pendingScrollUpdate = false;
      if (performance.now() - lastStickScrollAt < CONFIG.stickAutoSelectBlockMs) return;
      const currentY = window.scrollY;
      const direction = currentY > lastScrollY ? 1 : currentY < lastScrollY ? -1 : 0;
      lastScrollY = currentY;
      updateSelectionOnScroll(direction);
    });
  });
  startLoop();
})();
