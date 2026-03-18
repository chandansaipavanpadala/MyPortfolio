// Themes/Puzzle/script.js

let puzzleMainScriptLoaded = false;
let puzzleClockInterval = null;

function initPuzzleThemeModule() {
    if (puzzleMainScriptLoaded) return;

    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    // Clean up
    const existingContainer = document.querySelector('.puzzle-container');
    if (existingContainer) existingContainer.remove();
    if (puzzleClockInterval) { clearInterval(puzzleClockInterval); puzzleClockInterval = null; }

    // 1. Container
    const container = document.createElement('div');
    container.className = 'puzzle-container';

    // 2. Grid
    const gridOverlay = document.createElement('div');
    gridOverlay.className = 'puzzle-grid';

    const rows = 7;
    const columns = 7;

    const puzzleMap = [
        [0, 0, 0, 1, 1, 1, 1],
        [0, 0, 1, 1, 1, 1, 1],
        [0, 0, 1, 1, 1, 1, 1],
        [0, 0, 0, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1],
        [0, 0, 1, 1, 1, 1, 1]
    ];

    // Content map: what each active block displays
    // Types: 'time' (live clock char), 'date' (live date info), 'label' (static text), 'indicator' (decorative dot/icon)
    const contentMap = {
        // Row 0: Day of week + status dot
        '0,4': { type: 'date', id: 'day0' },     // e.g. "S"
        '0,5': { type: 'date', id: 'day1' },     // e.g. "U"
        '0,6': { type: 'date', id: 'day2' },     // e.g. "N"

        // Row 1: HH:MM
        '1,2': { type: 'time', charIndex: 0 },   // H tens
        '1,3': { type: 'time', charIndex: 1 },   // H units
        '1,4': { type: 'time', charIndex: 2 },   // :
        '1,5': { type: 'time', charIndex: 3 },   // M tens
        '1,6': { type: 'time', charIndex: 4 },   // M units

        // Row 2: :SS + period
        '2,4': { type: 'time', charIndex: 5 },   // :
        '2,5': { type: 'time', charIndex: 6 },   // S tens
        '2,6': { type: 'time', charIndex: 7 },   // S units

        // Row 3: Month + Date number
        '3,3': { type: 'date', id: 'mon0' },     // e.g. "M"
        '3,4': { type: 'date', id: 'mon1' },     // e.g. "A"
        '3,5': { type: 'date', id: 'mon2' },     // e.g. "R"
        '3,6': { type: 'date', id: 'dateNum' },  // e.g. "15"

        // Row 4: "SYSTEM" label
        '4,1': { type: 'label', text: 'S', cls: 'label-char' },
        '4,2': { type: 'label', text: 'Y', cls: 'label-char' },
        '4,3': { type: 'label', text: 'S', cls: 'label-char' },
        '4,4': { type: 'label', text: 'T', cls: 'label-char' },
        '4,5': { type: 'label', text: 'E', cls: 'label-char' },
        '4,6': { type: 'label', text: 'M', cls: 'label-char' },

        // Row 5: "ACTIVE" label
        '5,1': { type: 'label', text: 'A', cls: 'label-char active-char' },
        '5,2': { type: 'label', text: 'C', cls: 'label-char active-char' },
        '5,3': { type: 'label', text: 'T', cls: 'label-char active-char' },
        '5,4': { type: 'label', text: 'I', cls: 'label-char active-char' },
        '5,5': { type: 'label', text: 'V', cls: 'label-char active-char' },
        '5,6': { type: 'label', text: 'E', cls: 'label-char active-char' },

        // Row 6: Year
        '6,3': { type: 'date', id: 'yr0' },      // "2"
        '6,4': { type: 'date', id: 'yr1' },      // "0"
        '6,5': { type: 'date', id: 'yr2' },      // "2"
        '6,6': { type: 'date', id: 'yr3' },      // "6"
    };

    // Count active blocks
    let totalActiveBlocks = 0;
    puzzleMap.forEach(row => row.forEach(val => { if (val === 1) totalActiveBlocks++; }));

    let revealOrder = [];
    let isSequenceActive = false;

    // Replace with YOUR profile picture!
    const bgImageUrl = "20250419_132305.jpg";

    // Collections for live updating
    const timeDigitSpans = [];  // { span, charIndex }
    const dateSpans = {};       // { id: span }

    // 3. Build blocks
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const block = document.createElement('div');
            block.className = 'puzzle-block';

            if (puzzleMap[r][c] === 0) {
                block.classList.add('empty');
                gridOverlay.appendChild(block);
                continue;
            }

            const inner = document.createElement('div');
            inner.className = 'puzzle-block-inner';

            // FRONT
            const front = document.createElement('div');
            front.className = 'puzzle-face puzzle-face-front';

            const key = `${r},${c}`;
            const content = contentMap[key];

            if (content) {
                const span = document.createElement('span');

                if (content.type === 'time') {
                    span.className = 'puzzle-time-digit';
                    if (content.charIndex === 2 || content.charIndex === 5) {
                        span.classList.add('colon');
                    }
                    span.dataset.charIndex = content.charIndex;
                    timeDigitSpans.push(span);
                } else if (content.type === 'date') {
                    span.className = 'puzzle-date-text';
                    dateSpans[content.id] = span;
                } else if (content.type === 'label') {
                    span.className = 'puzzle-label ' + (content.cls || '');
                    span.textContent = content.text;
                } else if (content.type === 'indicator') {
                    span.className = 'puzzle-indicator ' + (content.cls || '');
                    span.textContent = content.text;
                }

                front.appendChild(span);
            }

            // BACK
            const back = document.createElement('div');
            back.className = 'puzzle-face puzzle-face-back';
            back.style.backgroundImage = `url('${bgImageUrl}')`;
            back.style.backgroundSize = `700% 700%`;
            back.style.backgroundPosition = `${c * (100 / 6)}% ${r * (100 / 6)}%`;

            inner.appendChild(front);
            inner.appendChild(back);
            block.appendChild(inner);

            // HOVER LOGIC
            block.addEventListener('mouseenter', () => {
                if (isSequenceActive || block.dataset.opened === "true") return;

                block.dataset.opened = "true";
                revealOrder.push(inner);

                gsap.to(inner, {
                    rotationY: 180,
                    duration: 0.5,
                    ease: 'power2.out',
                    onUpdate: function () {
                        if (this.progress() > 0.5) {
                            front.style.opacity = '0';
                            back.style.opacity = '1';
                        }
                    }
                });

                if (revealOrder.length === totalActiveBlocks) {
                    isSequenceActive = true;
                    setTimeout(() => {
                        revealOrder.forEach((b, index) => {
                            const bFront = b.querySelector('.puzzle-face-front');
                            const bBack = b.querySelector('.puzzle-face-back');
                            gsap.to(b, {
                                rotationY: 0,
                                duration: 0.6,
                                ease: 'power2.inOut',
                                delay: index * 0.05,
                                onUpdate: function () {
                                    if (this.progress() > 0.5) {
                                        bBack.style.opacity = '0';
                                        bFront.style.opacity = '1';
                                    }
                                },
                                onComplete: () => {
                                    b.parentElement.dataset.opened = "false";
                                    if (index === revealOrder.length - 1) {
                                        revealOrder = [];
                                        isSequenceActive = false;
                                    }
                                }
                            });
                        });
                    }, 1500);
                }
            });

            gridOverlay.appendChild(block);
        }
    }

    container.appendChild(gridOverlay);
    heroSection.appendChild(container);

    // 4. Live clock + date updater
    function updatePuzzleContent() {
        if (!document.body.classList.contains('puzzle')) return;

        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        const timeStr = hrs + ':' + mins + ':' + secs; // "HH:MM:SS"

        // Update time digits
        timeDigitSpans.forEach(span => {
            const idx = parseInt(span.dataset.charIndex, 10);
            span.textContent = timeStr[idx];
        });

        // Day of week (3-letter)
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const dayStr = dayNames[now.getDay()];
        if (dateSpans.day0) dateSpans.day0.textContent = dayStr[0];
        if (dateSpans.day1) dateSpans.day1.textContent = dayStr[1];
        if (dateSpans.day2) dateSpans.day2.textContent = dayStr[2];

        // AM/PM
        const period = now.getHours() >= 12 ? 'PM' : 'AM';
        if (dateSpans.period) dateSpans.period.textContent = period;

        // Month (3-letter)
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const monStr = monthNames[now.getMonth()];
        if (dateSpans.mon0) dateSpans.mon0.textContent = monStr[0];
        if (dateSpans.mon1) dateSpans.mon1.textContent = monStr[1];
        if (dateSpans.mon2) dateSpans.mon2.textContent = monStr[2];

        // Date number
        if (dateSpans.dateNum) dateSpans.dateNum.textContent = String(now.getDate()).padStart(2, '0');

        // Year
        const yearStr = String(now.getFullYear());
        if (dateSpans.yr0) dateSpans.yr0.textContent = yearStr[0];
        if (dateSpans.yr1) dateSpans.yr1.textContent = yearStr[1];
        if (dateSpans.yr2) dateSpans.yr2.textContent = yearStr[2];
        if (dateSpans.yr3) dateSpans.yr3.textContent = yearStr[3];
    }

    updatePuzzleContent();
    puzzleClockInterval = setInterval(updatePuzzleContent, 1000);

    puzzleMainScriptLoaded = true;
}

initPuzzleThemeModule();
