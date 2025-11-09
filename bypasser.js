(() => {
    'use strict';

    const host = location.hostname; // check host
    const debug = true; // enable debug logs (console)

    let selectedDelay = 0;
    const currentLanguage = 'en'; // Force English as the only language

    // Translations (bypassSuccess simplified — no {time})
    const translations = {
        // Only English translation needed now
        en: {
            title: "Remi's Bypasser", // Updated Title
            pleaseSolveCaptcha: "Please solve the CAPTCHA to continue",
            captchaSuccess: "CAPTCHA solved successfully",
            redirectingToWork: "Redirecting to Work.ink...",
            bypassSuccessCopy: "Bypass successful! Key copied (click 'Allow' if prompted)",
            waitingCaptcha: "Waiting for CAPTCHA...",
            pleaseReload: "Please reload the page...(workink bugs)",
            bypassSuccess: "Bypass successful",
            backToCheckpoint: "Returning to checkpoint...",
            captchaSuccessBypassing: "CAPTCHA solved successfully, bypassing...",
            version: "Version v1.6.3.0",
            madeBy: "Made by remiafterdark" // Updated credit
        }
    };

    function t(key, replacements = {}) {
        // No need to check currentLanguage, it's always 'en'
        if (!translations[currentLanguage] || !translations[currentLanguage][key]) return key;
        let text = translations[currentLanguage][key];
        Object.keys(replacements).forEach(placeholder => {
            text = text.replace(`{${placeholder}}`, replacements[placeholder]);
        });
        return text;
    }

    // --- Spotify Color Scheme Variables ---
    const SPOT_BLACK = '#191414';
    const SPOT_DARK_GREY = '#282828';
    const SPOT_GREEN = '#1DB954';
    const SPOT_LIGHT_GREEN = '#1ED760';

    class BypassPanel {
        constructor() {
            this.container = null;
            this.shadow = null;
            this.panel = null;
            this.statusText = null;
            this.statusDot = null;
            this.versionEl = null;
            this.creditEl = null;
            // this.langBtns = []; // No longer needed
            this.currentMessageKey = null;
            this.currentType = 'info';
            this.currentReplacements = {};
            this.isMinimized = false;
            this.body = null;
            this.minimizeBtn = null;

            // slider elements
            this.sliderContainer = null;
            this.sliderValue = null;
            this.slider = null;
            this.startBtn = null;
            this.onStartCallback = null;

            this.init();
        }

        init() {
            this.createPanel();
            this.setupEventListeners();
        }

        createPanel() {
            this.container = document.createElement('div');
            this.shadow = this.container.attachShadow({ mode: 'closed' });

            const style = document.createElement('style');
            style.textContent = `
                * { margin: 0; padding: 0; box-sizing: border-box; }

                .panel-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 400px;
                    z-index: 2147483647;
                    font-family: 'Segoe UI', Roboto, 'Noto Sans', Arial, sans-serif;
                }

                .panel {
                    background: ${SPOT_BLACK}; /* Dark Background */
                    border-radius: 12px;
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.7);
                    overflow: hidden;
                    animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    transition: all 0.3s ease;
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }

                .header {
                    background: ${SPOT_DARK_GREY}; /* Header slightly lighter than body */
                    padding: 16px 20px;
                    position: relative;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid ${SPOT_GREEN};
                }

                .title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #fff;
                    text-shadow: 0 0 5px rgba(29, 185, 84, 0.5); /* Green Glow */
                }

                .minimize-btn {
                    background: ${SPOT_GREEN};
                    border: none;
                    color: ${SPOT_BLACK};
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    font-size: 20px;
                    font-weight: 700;
                    position: relative;
                    z-index: 1;
                }

                .minimize-btn:hover {
                    background: ${SPOT_LIGHT_GREEN};
                    transform: scale(1.1);
                }

                .status-section {
                    padding: 20px;
                    border-bottom: 1px solid ${SPOT_DARK_GREY};
                    position: relative;
                }

                .status-box {
                    background: ${SPOT_DARK_GREY}; /* Status box background */
                    border-radius: 8px;
                    padding: 12px;
                    position: relative;
                    overflow: hidden;
                    border-left: 4px solid ${SPOT_GREEN};
                }

                .status-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    position: relative;
                    z-index: 1;
                }

                .status-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    animation: pulse 2s ease-in-out infinite;
                    box-shadow: 0 0 8px currentColor;
                    flex-shrink: 0;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.15); }
                }

                .status-dot.info { background: #60a5fa; }
                .status-dot.success { background: ${SPOT_GREEN}; } /* Green for Success */
                .status-dot.warning { background: #facc15; }
                .status-dot.error { background: #f87171; }

                .status-text {
                    color: #fff;
                    font-size: 14px;
                    font-weight: 500;
                    flex: 1;
                    line-height: 1.5;
                }

                .panel-body {
                    max-height: 500px;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    opacity: 1;
                }

                .panel-body.hidden {
                    max-height: 0;
                    opacity: 0;
                }

                /* Removed .language-section and .lang-toggle styles */

                .info-section {
                    padding: 16px 20px;
                    background: ${SPOT_BLACK};
                }

                .version {
                    color: rgba(255,255,255,0.5);
                    font-size: 11px;
                    font-weight: 500;
                    margin-bottom: 6px;
                    text-align: center;
                }

                .credit {
                    color: rgba(255,255,255,0.5);
                    font-size: 11px;
                    font-weight: 500;
                    text-align: center;
                    margin-bottom: 8px;
                }

                .credit-author {
                    color: ${SPOT_LIGHT_GREEN}; /* Green highlight for authors */
                    font-weight: 700;
                }

                /* Removed .links and .links a styles */

                /* --- Slider styles --- */
                .slider-container {
                    display: none;
                    padding: 12px 0 0 0;
                    animation: fadeIn 0.4s ease;
                    margin-top: 12px;
                    border-top: 1px dashed ${SPOT_DARK_GREY};
                }

                .slider-container.active {
                    display: block;
                }

                .slider-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 0 0px 8px 0px;
                }

                .slider-label {
                    color: rgba(255,255,255,0.9);
                    font-size: 13px;
                    font-weight: 600;
                }

                .slider-value {
                    color: ${SPOT_LIGHT_GREEN};
                    font-size: 13px;
                    font-weight: 700;
                }

                .slider-track {
                    position: relative;
                    margin: 0 0px 12px 0px;
                }

                .slider {
                    width: 100%;
                    height: 6px;
                    border-radius: 6px;
                    background: #535353; /* Mid-grey track */
                    outline: none;
                    -webkit-appearance: none;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }

                .slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: ${SPOT_GREEN};
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 0 10px rgba(29, 185, 84, 0.4);
                }

                .slider::-webkit-slider-thumb:hover {
                    transform: scale(1.12);
                }

                .slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: ${SPOT_GREEN};
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 0 10px rgba(29, 185, 84, 0.4);
                }

                .slider::-moz-range-thumb:hover {
                    transform: scale(1.12);
                }

                .start-btn {
                    width: 100%;
                    margin: 0 0 4px 0;
                    background: ${SPOT_GREEN};
                    color: ${SPOT_BLACK};
                    border: none;
                    padding: 10px;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.18s ease;
                    text-transform: uppercase;
                    box-shadow: 0 4px 15px rgba(29, 185, 84, 0.2);
                }

                .start-btn:hover {
                    transform: translateY(-2px);
                    background: ${SPOT_LIGHT_GREEN};
                    box-shadow: 0 6px 18px rgba(29, 185, 84, 0.3);
                }

                .start-btn:disabled {
                    background: #535353;
                    color: #999;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

                @media (max-width: 480px) {
                    .panel-container {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        width: auto;
                    }
                }
            `;

            this.shadow.appendChild(style);

            // NOTE: slider container moved directly under .status-section (inside it) so it sits right below status text.
            const panelHTML = `
                <div class="panel-container">
                    <div class="panel">
                        <div class="header">
                            <div class="title">${t('title')}</div>
                            <button class="minimize-btn" id="minimize-btn">−</button>
                        </div>

                        <div class="status-section">
                            <div class="status-box">
                                <div class="status-content">
                                    <div class="status-dot info" id="status-dot"></div>
                                    <div class="status-text" id="status-text">${t('pleaseSolveCaptcha')}</div>
                                </div>
                            </div>

                            <div class="slider-container" id="slider-container">
                                <div class="slider-header">
                                    <span class="slider-label">Redirect delay:</span>
                                    <span class="slider-value" id="slider-value">0s</span>
                                </div>
                                <div class="slider-track">
                                    <input type="range" min="0" max="60" value="0" class="slider" id="delay-slider">
                                </div>
                                <button class="start-btn" id="start-btn">Start Redirect</button>
                            </div>
                        </div>

                        <div class="panel-body" id="panel-body">
                            <div class="info-section">
                                <div class="version" id="version">${t('version')}</div>
                                <div class="credit" id="credit">
                                    ${t('madeBy')}
                                </div>
                                </div>
                        </div>

                    </div>
                </div>
            `;

            const wrapper = document.createElement('div');
            wrapper.innerHTML = panelHTML;
            this.shadow.appendChild(wrapper.firstElementChild);

            this.panel = this.shadow.querySelector('.panel');
            this.statusText = this.shadow.querySelector('#status-text');
            this.statusDot = this.shadow.querySelector('#status-dot');
            this.versionEl = this.shadow.querySelector('#version');
            this.creditEl = this.shadow.querySelector('#credit');
            // this.langBtns = Array.from(this.shadow.querySelectorAll('.lang-btn')); // No longer needed
            this.body = this.shadow.querySelector('#panel-body');
            this.minimizeBtn = this.shadow.querySelector('#minimize-btn');

            // slider elements
            this.sliderContainer = this.shadow.querySelector('#slider-container');
            this.sliderValue = this.shadow.querySelector('#slider-value');
            this.slider = this.shadow.querySelector('#delay-slider');
            this.startBtn = this.shadow.querySelector('#start-btn');

            document.documentElement.appendChild(this.container);
        }

        setupEventListeners() {
            // No language button event listeners needed
            // this.langBtns.forEach(btn => { ... });

            this.minimizeBtn.addEventListener('click', () => {
                this.isMinimized = !this.isMinimized;
                this.body.classList.toggle('hidden');
                this.minimizeBtn.textContent = this.isMinimized ? '+' : '−';
            });

            // slider input
            this.slider.addEventListener('input', (e) => {
                selectedDelay = parseInt(e.target.value);
                this.sliderValue.textContent = `${selectedDelay}s`;
            });

            // start button
            this.startBtn.addEventListener('click', () => {
                if (this.onStartCallback) {
                    try {
                        this.onStartCallback(selectedDelay);
                    } catch (err) {
                        if (debug) console.error('[Debug] onStartCallback error', err);
                    }
                }
            });
        }

        // Simplified updateLanguage, as it's always English now
        updateLanguage() {
            // localStorage.setItem('lang', currentLanguage); // No longer saving language preference

            // No language button active state to update
            // this.langBtns.forEach(btn => { ... });

            const titleEl = this.shadow.querySelector('.title');
            if (titleEl) titleEl.textContent = t('title');
            if (this.versionEl) this.versionEl.textContent = t('version');
            if (this.creditEl) this.creditEl.textContent = t('madeBy');

            if (this.currentMessageKey) {
                this.show(this.currentMessageKey, this.currentType, this.currentReplacements);
            }
        }

        /**
         * show: either translation key or raw string
         */
        show(messageKeyOrTitle, typeOrSubtitle = 'info', replacements = {}) {
            this.currentMessageKey = messageKeyOrTitle;
            this.currentType = (typeof typeOrSubtitle === 'string' && ['info','success','warning','error'].includes(typeOrSubtitle)) ? typeOrSubtitle : 'info';
            this.currentReplacements = replacements;

            let message = '';
            // Only checking 'en' translations
            if (translations[currentLanguage] && translations[currentLanguage][messageKeyOrTitle]) {
                message = t(messageKeyOrTitle, replacements);
                if (typeof typeOrSubtitle === 'string' && !['info','success','warning','error'].includes(typeOrSubtitle) && typeOrSubtitle.length > 0) {
                    message = typeOrSubtitle;
                }
            } else {
                message = (typeof typeOrSubtitle === 'string' && ['info','success','warning','error'].includes(typeOrSubtitle)) ? messageKeyOrTitle : (typeOrSubtitle || messageKeyOrTitle);
            }

            this.statusText.textContent = message;
            this.statusDot.className = `status-dot ${this.currentType}`;
        }

        showBypassingWorkink() {
            this.show('captchaSuccessBypassing', 'success');
        }

        showCaptchaComplete() {
            // reveal slider area directly under status (we moved it)
            this.sliderContainer.classList.add('active');
            // show simplified bypass message
            this.show('bypassSuccess', 'success');
        }

        setCallback(callback) {
            this.onStartCallback = callback;
        }

        startCountdown(seconds) {
            // hide slider and disable start button while counting down
            this.sliderContainer.classList.remove('active');
            this.startBtn.disabled = true;

            let remaining = seconds;
            this.show('redirectingToWork', 'info');
            this.statusText.textContent = `Redirecting in ${remaining}s...`;

            const interval = setInterval(() => {
                remaining--;
                if (remaining > 0) {
                    this.statusText.textContent = `Redirecting in ${remaining}s...`;
                } else {
                    clearInterval(interval);
                }
            }, 1000);
        }
    }

    let panel = null;
    setTimeout(() => { panel = new BypassPanel(); panel.show('pleaseSolveCaptcha', 'info'); }, 100);

    // === Bypass logic (merged from original scripts) ===
    if (host.includes("key.volcano.wtf")) handleVolcano();
    else if (host.includes("work.ink")) handleWorkInk();

    function handleVolcano() {
        if (panel) panel.show('pleaseSolveCaptcha', 'info');
        if (debug) console.log('[Debug] Waiting Captcha');

        let alreadyDoneContinue = false;
        let alreadyDoneCopy = false;

        function actOnCheckpoint(node) {
            if (!alreadyDoneContinue) {
                const buttons = node && node.nodeType === 1
                    ? node.matches('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]')
                        ? [node]
                        : node.querySelectorAll('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]')
                    : document.querySelectorAll('#primaryButton[type="submit"], button[type="submit"], a, input[type=button], input[type=submit]');
                for (const btn of buttons) {
                    const text = (btn.innerText || btn.value || "").trim().toLowerCase();
                    if (text.includes("continue") || text.includes("next step")) {
                        const disabled = btn.disabled || btn.getAttribute("aria-disabled") === "true";
                        const style = getComputedStyle(btn);
                        const visible = style.display !== "none" && style.visibility !== "hidden" && btn.offsetParent !== null;
                        if (visible && !disabled) {
                            alreadyDoneContinue = true;
                            if (panel) panel.show('captchaSuccess', 'success');
                            if (debug) console.log('[Debug] Captcha Solved');

                            setTimeout(() => {
                                try {
                                    btn.click();
                                    if (panel) panel.show('redirectingToWork', 'info');
                                    if (debug) console.log('[Debug] Clicking Continue');
                                } catch (err) {
                                    if (debug) console.log('[Debug] No Continue Found', err);
                                }
                            }, 1500);
                            return true;
                        }
                    }
                }
            }

            const copyBtn = node && node.nodeType === 1
                ? node.matches("#copy-key-btn, .copy-btn, [aria-label='Copy']")
                    ? node
                    : node.querySelector("#copy-key-btn, .copy-btn, [aria-label='Copy']")
                : document.querySelector("#copy-key-btn, .copy-btn, [aria-label='Copy']");
            if (copyBtn) {
                setInterval(() => {
                    try {
                        copyBtn.click();
                        if (debug) console.log('[Debug] Copy button spam click');
                        if (panel) panel.show('bypassSuccessCopy', 'success');
                    } catch (err) {
                        if (debug) console.log('[Debug] No Copy Found', err);
                    }
                }, 500);
                return true;
            }

            return false;
        }

        const mo = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) {
                            if (actOnCheckpoint(node)) {
                                if (alreadyDoneCopy) {
                                    mo.disconnect();
                                    return;
                                }
                            }
                        }
                    }
                }
                if (mutation.type === 'attributes' && mutation.target.nodeType === 1) {
                    if (actOnCheckpoint(mutation.target)) {
                        if (alreadyDoneCopy) {
                            mo.disconnect();
                            return;
                        }
                    }
                }
            }
        });

        mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled', 'style'] });

        if (actOnCheckpoint()) {
            if (alreadyDoneCopy) {
                mo.disconnect();
            }
        }
    }

    function handleWorkInk() {
        if (panel) panel.show('pleaseSolveCaptcha', 'info');

        const startTime = Date.now();
        let sessionControllerA = undefined;
        let sendMessageA = undefined;
        let onLinkInfoA = undefined;
        let linkInfoA = undefined;
        let onLinkDestinationA = undefined;
        let bypassTriggered = false;
        let destinationReceived = false;
        let socialCheckInProgress = false;

        const map = {
            onLI: ["onLinkInfo"],
            onLD: ["onLinkDestination"]
        };

        function resolveName(obj, candidates) {
            if (!obj || typeof obj !== "object") {
                return { fn: null, index: -1, name: null };
            }

            for (let i = 0; i < candidates.length; i++) {
                const name = candidates[i];
                if (typeof obj[name] === "function") {
                    return { fn: obj[name], index: i, name };
                }
            }
            return { fn: null, index: -1, name: null };
        }

        function resolveWriteFunction(obj) {
            if (!obj || typeof obj !== "object") {
                return { fn: null, index: -1, name: null };
            }

            for (let i in obj) {
                if (typeof obj[i] === "function" && obj[i].length === 2) {
                    return { fn: obj[i], name: i };
                }
            }
            return { fn: null, index: -1, name: null };
        }

        const types = {
            mo: 'c_monetization',
            ss: 'c_social_started',
            tr: 'c_turnstile_response',
            ad: 'c_adblocker_detected',
            ping: 'c_ping'
        };

        async function checkAndHandleSocials() {
            if (!linkInfoA || socialCheckInProgress) {
                return;
            }

            const socials = linkInfoA.socials || [];
            if (debug) console.log('[Debug] Checking socials count:', socials.length);

            if (socials.length > 0) { // Changed condition to > 0 just in case 1 needs spoofing
                socialCheckInProgress = true;
                if (panel) panel.show('Processing Socials', `Found ${socials.length} socials, spoofing with delays...`);
                if (debug) console.log('[Debug] Socials detected, spoofing with 2000ms delays...');

                // Spoof all socials with 2000ms delay between each (preserve original behavior)
                for (let i = 0; i < socials.length; i++) {
                    const soc = socials[i];
                    await new Promise(r => setTimeout(r, 2000)); // Delay for realism
                    try {
                        if (sendMessageA) {
                            sendMessageA.call(sessionControllerA, types.ss, { url: soc.url });
                            if (debug) console.log(`[Debug] Spoofed social [${i+1}/${socials.length}]:`, soc.url);
                            if (panel) panel.show('Processing Socials', `Spoofed ${i+1}/${socials.length} socials...`);
                        }
                    } catch (e) {
                        if (debug) console.error('[Debug] Error spoofing social', e);
                    }
                }

                // Allow user to manually start redirect after all socials are spoofed
                socialCheckInProgress = false;
                if (panel) panel.showCaptchaComplete();
                if (debug) console.log('[Debug] Socials spoofing finished. Panel updated for manual redirect.');
                return true;
            }

            return false;
        }

        // Hook into the onLinkInfo function to get link details
        function hookOnLinkInfo(target, originalFn) {
            return function (a, b) {
                if (debug) console.log('[Debug] onLinkInfo called:', a, b);
                linkInfoA = b;

                // Check if CAPTCHA is done (based on original script's logic intent)
                if (b && b.captchaDone) {
                    if (!bypassTriggered) {
                        bypassTriggered = true;
                        if (debug) console.log('[Debug] CaptchaDone detected, attempting bypass...');

                        // Check for socials first
                        if (!checkAndHandleSocials()) {
                            // If no socials, proceed immediately to show slider for manual redirect
                            if (panel) panel.showCaptchaComplete();
                            if (debug) console.log('[Debug] No socials detected. Panel updated for manual redirect.');
                        }
                    }
                }

                return originalFn.apply(this, arguments);
            };
        }

        // Hook into the onLinkDestination function to get the final URL
        function hookOnLinkDestination(target, originalFn) {
            return function (a, b) {
                if (debug) console.log('[Debug] onLinkDestination called:', a, b);

                if (b && b.destination) {
                    // Set up the start button callback to redirect after delay
                    if (panel && !destinationReceived) {
                        panel.setCallback((delay) => {
                            destinationReceived = true;
                            if (delay > 0) {
                                panel.startCountdown(delay);
                                setTimeout(() => window.location.href = b.destination, delay * 1000);
                            } else {
                                window.location.href = b.destination;
                            }
                        });

                        // If CAPTCHA was already done, show the slider now.
                        if (linkInfoA && linkInfoA.captchaDone && !socialCheckInProgress) {
                            panel.showCaptchaComplete();
                        }
                    }
                }

                return originalFn.apply(this, arguments);
            };
        }

        // The main injection logic (similar to original script, focusing on window properties)
        let injectionSuccess = false;

        const observer = new MutationObserver((mutations, obs) => {
            if (injectionSuccess) {
                obs.disconnect();
                return;
            }

            for (const prop in window) {
                if (typeof window[prop] === 'object' && window[prop] !== null && typeof window[prop].start === 'function' && typeof window[prop].stop === 'function') {
                    sessionControllerA = window[prop];
                    if (debug) console.log('[Debug] Found sessionControllerA:', sessionControllerA);

                    const liResult = resolveName(sessionControllerA, map.onLI);
                    if (liResult.fn) {
                        onLinkInfoA = liResult.fn;
                        sessionControllerA[liResult.name] = hookOnLinkInfo(sessionControllerA, onLinkInfoA);
                        if (debug) console.log('[Debug] Hooked onLinkInfo');
                    }

                    const ldResult = resolveName(sessionControllerA, map.onLD);
                    if (ldResult.fn) {
                        onLinkDestinationA = ldResult.fn;
                        sessionControllerA[ldResult.name] = hookOnLinkDestination(sessionControllerA, onLinkDestinationA);
                        if (debug) console.log('[Debug] Hooked onLinkDestination');
                    }

                    const sendResult = resolveWriteFunction(sessionControllerA);
                    if (sendResult.fn) {
                        sendMessageA = sendResult.fn;
                        if (debug) console.log('[Debug] Found sendMessageA:', sendResult.name);
                    }

                    if (onLinkInfoA && onLinkDestinationA && sendMessageA) {
                        injectionSuccess = true;
                        obs.disconnect();
                        if (debug) console.log('[Debug] Injection complete.');
                        break;
                    }
                }
            }
        });

        observer.observe(document.documentElement, { childList: true, subtree: true });

        // Initial check just in case
        for (const prop in window) {
            if (typeof window[prop] === 'object' && window[prop] !== null && typeof window[prop].start === 'function' && typeof window[prop].stop === 'function') {
                sessionControllerA = window[prop];
                const liResult = resolveName(sessionControllerA, map.onLI);
                const ldResult = resolveName(sessionControllerA, map.onLD);
                const sendResult = resolveWriteFunction(sessionControllerA);

                if (liResult.fn && ldResult.fn && sendResult.fn) {
                    onLinkInfoA = liResult.fn;
                    sessionControllerA[liResult.name] = hookOnLinkInfo(sessionControllerA, onLinkInfoA);

                    onLinkDestinationA = ldResult.fn;
                    sessionControllerA[ldResult.name] = hookOnLinkDestination(sessionControllerA, onLinkDestinationA);

                    sendMessageA = sendResult.fn;

                    injectionSuccess = true;
                    if (debug) console.log('[Debug] Immediate Injection complete.');
                    break;
                }
            }
        }
    }
})();
