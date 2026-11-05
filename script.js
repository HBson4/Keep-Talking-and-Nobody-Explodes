document.addEventListener('DOMContentLoaded', () => {
    // Attach change listeners to all 4 slot selectors in the 2x2 grid
    for (let i = 1; i <= 4; i++) {
        const selector = document.getElementById(`select-${i}`);
        if (selector) {
            selector.addEventListener('change', (e) => loadModule(`content-${i}`, e.target.value));
        }
    }
});

// Load chosen module HTML from template into target container
function loadModule(containerId, moduleType) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear existing module content

    if (!moduleType) return; // Reset/empty option selected

    const template = document.getElementById(`tpl-${moduleType}`);
    if (template) {
        const clone = template.content.cloneNode(true);
        container.appendChild(clone);

        // Initialize script logic for newly loaded module
        if (moduleType === 'cWires') {
            initComplicatedWires(container);
        } else if (moduleType === 'password') {
            initPassword(container);
        } else if (moduleType === 'wires') {
            initSimpleWires(container);
        } else if (moduleType === 'wireSequence') {
            initWireSequence(container);
        } else if (moduleType === 'memory') {
            initMemory(container);
        } else if (moduleType === 'morse') {
            initMorse(container);
        }
    }
}


// ==========================================
// COMPLICATED WIRES MODULE LOGIC
// ==========================================
function initComplicatedWires(container) {
    const generateBtn = container.querySelector('.generateBtn');
    const resetBtn = container.querySelector('.resetBtn');

    // Make all toggle buttons inside the info section interactive
    const toggleButtons = container.querySelectorAll('.cWiresInfo button');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
    });

    generateBtn.addEventListener('click', () => solveWires(container));
    resetBtn.addEventListener('click', () => resetBoard(container));
}

function solveWires(container) {
    // Read state from the toggle buttons using .active class
    const parallelBtn = container.querySelector('.parallel-btn') || container.querySelector('.parallel-toggle-btn');
    const parallel = parallelBtn ? parallelBtn.classList.contains('active') : false;

    const batteryBtn = container.querySelector('.battery-btn') || container.querySelector('.battery-toggle-btn');
    const batteries = batteryBtn ? batteryBtn.classList.contains('active') : false;
    
    const evenBtn = container.querySelector('.serial-even-btn');
    const serialEven = evenBtn ? evenBtn.classList.contains('active') : false;

    const wireCols = container.querySelectorAll('.c-wire-col');
    const lookupKey = {
        '': 'C', 'L': 'D', 'S': 'C', 'LS': 'Bat',
        'R': '#', 'RS': 'C', 'LR': 'Bat', 'LRS': 'Bat',
        'B': '#', 'BS': 'D', 'LB': 'P', 'LBS': 'P',
        'RB': '#', 'RBS': 'P', 'LRB': '#', 'LRBS': 'D'
    };

    wireCols.forEach(col => {
        const light = col.querySelector('.badge-light').previousElementSibling.checked;
        const red = col.querySelector('.badge-red').previousElementSibling.checked;
        const blue = col.querySelector('.badge-blue').previousElementSibling.checked;
        const star = col.querySelector('.badge-star').previousElementSibling.checked;
        const resultBox = col.querySelector('.wire-result');

        let key = '';
        if (light) key += 'L';
        if (red) key += 'R';
        if (blue) key += 'B';
        if (star) key += 'S';

        const instruction = lookupKey[key];
        let cut = false;

        switch (instruction) {
            case 'C': cut = true; break;
            case 'D': cut = false; break;
            case 'P': cut = parallel; break;
            case 'Bat': cut = batteries; break;
            case '#': cut = serialEven; break;
        }

        resultBox.textContent = cut ? 'CUT' : '--';
        resultBox.style.color = cut ? '#07ef22' : 'red';
    });
}

function resetBoard(container) {
    // Uncheck wire checkboxes
    container.querySelectorAll('.module input[type="checkbox"]').forEach(box => box.checked = false);
    
    // Remove active class from all toggle buttons in this module
    container.querySelectorAll('.cWiresInfo button').forEach(btn => btn.classList.remove('active'));
    
    // Reset result boxes
    container.querySelectorAll('.c-wire-result-box').forEach(box => {
        box.textContent = '--';
        box.style.color = 'inherit';
    });
}


// ==========================================
// PASSWORD MODULE LOGIC
// ==========================================
const PASSWORD_WORD_BANK = [
    "about", "after", "again", "below", "could",
    "every", "first", "found", "great", "house",
    "large", "learn", "never", "other", "place",
    "plant", "point", "right", "small", "sound",
    "spell", "still", "study", "their", "there",
    "these", "thing", "think", "three", "water",
    "where", "which", "world", "would", "write"
];

function initPassword(container) {
    const generateBtn = container.querySelector('.generateBtn');
    const resetBtn = container.querySelector('.resetBtn');
    const inputs = container.querySelectorAll('.pwd-input');

    generateBtn.addEventListener('click', () => solvePassword(container));
    resetBtn.addEventListener('click', () => resetPassword(container));

    inputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value.length === 6 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
    });
}

function solvePassword(container) {
    const inputs = container.querySelectorAll('.pwd-input');
    const resultDisplay = container.querySelector('.pwd-result');

    const positionLetters = Array.from(inputs).map(input => 
        input.value.toLowerCase().split('')
    );

    const matches = PASSWORD_WORD_BANK.filter(word => {
        for (let i = 0; i < 5; i++) {
            const lettersForPos = positionLetters[i];
            if (lettersForPos.length > 0 && !lettersForPos.includes(word[i])) {
                return false;
            }
        }
        return true;
    });

    if (matches.length === 1) {
        resultDisplay.textContent = matches[0].toUpperCase();
        resultDisplay.style.color = '#07ef22';
    } else if (matches.length > 1) {
        resultDisplay.textContent = `${matches.length} MATCHES`;
        resultDisplay.style.color = '#ffaa00';
    } else {
        resultDisplay.textContent = 'NO MATCH';
        resultDisplay.style.color = 'red';
    }
}

function resetPassword(container) {
    container.querySelectorAll('.pwd-input').forEach(input => input.value = '');
    const resultDisplay = container.querySelector('.pwd-result');
    resultDisplay.textContent = '--';
    resultDisplay.style.color = '#07ef22';
}


// ==========================================
// WIRES MODULE LOGIC
// ==========================================
const AVAILABLE_COLORS = ['black', 'blue', 'white', 'red', 'yellow'];

function initSimpleWires(container) {
    const countButtons = container.querySelectorAll('.wire-count-btn');
    const dynamicContainer = container.querySelector('.dynamic-wires-container');
    const generateBtn = container.querySelector('.generateBtn');
    const resetBtn = container.querySelector('.resetBtn');
    const resultDisplay = container.querySelector('.wire-cut-result');
    const serialOddBtn = container.querySelector('.serial-odd-btn');

    renderWireRows(3, dynamicContainer); // Default to 3 wires on load
    
    // Set the first count button as active by default
    const defaultBtn = container.querySelector('.wire-count-btn[data-count="3"]');
    if (defaultBtn) defaultBtn.classList.add('active');

    resultDisplay.style.color = '#fff';

    // Single Serial Odd toggle button logic
    if (serialOddBtn) {
        serialOddBtn.addEventListener('click', () => {
            serialOddBtn.classList.toggle('active');
        });
    }

    // Wire count button toggle and row rendering
    countButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            countButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const count = parseInt(btn.getAttribute('data-count'));
            renderWireRows(count, dynamicContainer);
            resultDisplay.textContent = '--';
        });
    });

    generateBtn.addEventListener('click', () => solveSimpleWires(container));
    
    resetBtn.addEventListener('click', () => {
        countButtons.forEach(b => b.classList.remove('active'));
        dynamicContainer.innerHTML = '';
        resultDisplay.textContent = '--';
        if (serialOddBtn) serialOddBtn.classList.remove('active');
        resultDisplay.style.color = '#fff';
        renderWireRows(3, dynamicContainer);
        defaultBtn.classList.add('active');
    });
}

function renderWireRows(count, parentContainer) {
    parentContainer.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        const row = document.createElement('div');
        row.className = 'wire-row';

        const title = document.createElement('span');
        title.className = 'wire-row-title';
        title.textContent = `Wire ${i}:`;
        row.appendChild(title);

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'color-button-group';

        AVAILABLE_COLORS.forEach(color => {
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `wire_${i}_color`;
            input.value = color;
            input.id = `module-wire-${i}-${color}`;

            const label = document.createElement('label');
            label.htmlFor = input.id;
            label.textContent = color.charAt(0).toUpperCase() + color.slice(1);

            buttonGroup.appendChild(input);
            buttonGroup.appendChild(label);
        });

        row.appendChild(buttonGroup);
        parentContainer.appendChild(row);
    }
}

function solveSimpleWires(container) {
    const resultDisplay = container.querySelector('.wire-cut-result');
    const wireRows = container.querySelectorAll('.wire-row');
    
    const oddBtn = container.querySelector('.serial-odd-btn');
    const serialOdd = oddBtn ? oddBtn.classList.contains('active') : false;

    if (wireRows.length === 0) {
        resultDisplay.textContent = 'SELECT COUNT';
        resultDisplay.style.color = '#ffaa00';
        return;
    }

    const wires = [];
    let incomplete = false;

    wireRows.forEach((row) => {
        const selected = row.querySelector('input[type="radio"]:checked');
        if (!selected) {
            incomplete = true;
        } else {
            wires.push(selected.value);
        }
    });

    if (incomplete) {
        resultDisplay.textContent = 'INCOMPLETE';
        resultDisplay.style.color = '#ffaa00';
        return;
    }

    const count = wires.length;
    let cutInstruction = '';

    if (count === 3) {
        if (!wires.includes('red')) {
            cutInstruction = 'Second Wire';
        } else if (wires[wires.length - 1] === 'white') {
            cutInstruction = 'Last Wire';
        } else if (wires.filter(c => c === 'blue').length > 1) {
            cutInstruction = 'Last Blue Wire';
        } else {
            cutInstruction = 'Last Wire';
        }
    } else if (count === 4) {
        const redCount = wires.filter(c => c === 'red').length;
        const yellowCount = wires.filter(c => c === 'yellow').length;
        const blueCount = wires.filter(c => c === 'blue').length;

        if (redCount > 1 && serialOdd) {
            cutInstruction = 'Last Red Wire';
        } else if (wires[3] === 'yellow' && redCount === 0) {
            cutInstruction = 'First Wire';
        } else if (blueCount === 1) {
            cutInstruction = 'First Wire';
        } else if (yellowCount > 1) {
            cutInstruction = 'Last Wire';
        } else {
            cutInstruction = 'Second Wire';
        }
    } else if (count === 5) {
        const blackCount = wires.filter(c => c === 'black').length;
        const redCount = wires.filter(c => c === 'red').length;
        const yellowCount = wires.filter(c => c === 'yellow').length;

        if (wires[4] === 'black' && serialOdd) {
            cutInstruction = 'Fourth Wire';
        } else if (redCount === 1 && yellowCount > 1) {
            cutInstruction = 'First Wire';
        } else if (blackCount === 0) {
            cutInstruction = 'Second Wire';
        } else {
            cutInstruction = 'First Wire';
        }
    } else if (count === 6) {
        const yellowCount = wires.filter(c => c === 'yellow').length;
        const whiteCount = wires.filter(c => c === 'white').length;
        const redCount = wires.filter(c => c === 'red').length;

        if (yellowCount === 0 && serialOdd) {
            cutInstruction = 'Third Wire';
        } else if (yellowCount === 1 && whiteCount > 1) {
            cutInstruction = 'Fourth Wire';
        } else if (redCount === 0) {
            cutInstruction = 'Last Wire';
        } else {
            cutInstruction = 'Fourth Wire';
        }
    }

    resultDisplay.textContent = cutInstruction;
    resultDisplay.style.color = '#07ef22';
}


// ==========================================
// WIRE SEQUENCE MODULE LOGIC (Single Panel Stepper)
// ==========================================
const WIRE_SEQUENCE_RULES = {
    red: {
        1: ['c'], 2: ['b'], 3: ['a'], 4: ['a', 'c'],
        5: ['b'], 6: ['a', 'c'], 7: ['a', 'b', 'c'], 8: ['a', 'b'], 9: ['b']
    },
    blue: {
        1: ['b'], 2: ['a', 'c'], 3: ['b'], 4: ['a'],
        5: ['b'], 6: ['b', 'c'], 7: ['c'], 8: ['a', 'c'], 9: ['a']
    },
    black: {
        1: ['a', 'b', 'c'], 2: ['a', 'c'], 3: ['b'], 4: ['a', 'c'],
        5: ['b'], 6: ['b', 'c'], 7: ['a', 'b'], 8: ['c'], 9: ['c']
    }
};

function initWireSequence(container) {
    let currentPanel = 1;
    const totalPanels = 4;

    const panels = container.querySelectorAll('.wire-panel');
    const prevBtn = container.querySelector('.prev-panel-btn');
    const nextBtn = container.querySelector('.next-panel-btn');
    const panelNumSpan = container.querySelector('#active-panel-num');
    const panelLabel = container.querySelector('.current-panel-label');

    const generateBtn = container.querySelector('.generateBtn');
    const resetBtn = container.querySelector('.resetBtn');

    function updatePanelDisplay() {
        panels.forEach((panel, index) => {
            panel.style.display = (index + 1 === currentPanel) ? 'block' : 'none';
        });
        if (panelNumSpan) panelNumSpan.textContent = currentPanel;
        if (panelLabel) panelLabel.textContent = `Panel ${currentPanel}`;

        if (prevBtn) prevBtn.disabled = (currentPanel === 1);
        if (nextBtn) nextBtn.disabled = (currentPanel === totalPanels);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPanel > 1) {
                currentPanel--;
                updatePanelDisplay();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPanel < totalPanels) {
                currentPanel++;
                updatePanelDisplay();
            }
        });
    }

    if (generateBtn) generateBtn.addEventListener('click', () => solveWireSequence(container));
    if (resetBtn) resetBtn.addEventListener('click', () => resetWireSequence(container));

    updatePanelDisplay();
}

function solveWireSequence(container) {
    let redCount = 0;
    let blueCount = 0;
    let blackCount = 0;

    const rows = container.querySelectorAll('.seq-wire-row');

    rows.forEach(row => {
        const colorChecked = row.querySelector('.color-select-group input[type="radio"]:checked');
        const letterChecked = row.querySelector('.letter-select-group input[type="radio"]:checked');
        const resultSpan = row.querySelector('.seq-result');

        if (!colorChecked || !letterChecked) {
            resultSpan.textContent = '--';
            resultSpan.style.color = 'inherit';
            return;
        }

        const color = colorChecked.value;
        const letter = letterChecked.value;
        let shouldCut = false;

        if (color === 'red') {
            redCount++;
            if (WIRE_SEQUENCE_RULES.red[redCount] && WIRE_SEQUENCE_RULES.red[redCount].includes(letter)) {
                shouldCut = true;
            }
        } else if (color === 'blue') {
            blueCount++;
            if (WIRE_SEQUENCE_RULES.blue[blueCount] && WIRE_SEQUENCE_RULES.blue[blueCount].includes(letter)) {
                shouldCut = true;
            }
        } else if (color === 'black') {
            blackCount++;
            if (WIRE_SEQUENCE_RULES.black[blackCount] && WIRE_SEQUENCE_RULES.black[blackCount].includes(letter)) {
                shouldCut = true;
            }
        }

        resultSpan.textContent = shouldCut ? 'CUT' : '--';
        resultSpan.style.color = shouldCut ? '#07ef22' : 'red';
    });
}

function resetWireSequence(container) {
    container.querySelectorAll('.seq-wire-row input[type="radio"]').forEach(radio => radio.checked = false);
    container.querySelectorAll('.seq-result').forEach(span => {
        span.textContent = '--';
        span.style.color = 'inherit';
    });
}

// ==========================================
// MEMORY MODULE LOGIC
// ==========================================
function initMemory(container) {
    const stageRows = container.querySelectorAll('.memory-stage-row');
    const resetBtn = container.querySelector('.resetBtn');

    const memoryState = {
        1: { display: null, pos: null, label: null },
        2: { display: null, pos: null, label: null },
        3: { display: null, pos: null, label: null },
        4: { display: null, pos: null, label: null },
        5: { display: null, pos: null, label: null }
    };

    function processStage(stageNum) {
        const disp = memoryState[stageNum].display;
        let text = "";
        let autoPos = null;
        let autoLbl = null;

        if (stageNum === 1) {
            if (disp === 1 || disp === 2) { text = "position 2"; autoPos = 2; }
            else if (disp === 3) { text = "position 3"; autoPos = 3; }
            else if (disp === 4) { text = "position 4"; autoPos = 4; }
        } else if (stageNum === 2) {
            if (disp === 1) { 
                text = "button labeled '4'"; 
                autoLbl = 4; 
            }
            else if (disp === 2 || disp === 4) { 
                const targetPos = memoryState[1].pos;
                text = `position ${targetPos}`; 
                autoPos = targetPos; 
            }
            else if (disp === 3) { text = "position 1"; autoPos = 1; }
        } else if (stageNum === 3) {
            if (disp === 1) { 
                const targetLbl = memoryState[2].label;
                text = `button labeled '${targetLbl}'`; 
                autoLbl = targetLbl; 
            }
            else if (disp === 2) { 
                const targetLbl = memoryState[1].label;
                text = `button labeled '${targetLbl}'`; 
                autoLbl = targetLbl; 
            }
            else if (disp === 3) { text = "position 3"; autoPos = 3; }
            else if (disp === 4) { text = "button labeled '4'"; autoLbl = 4; }
        } else if (stageNum === 4) {
            if (disp === 1) { 
                const targetPos = memoryState[1].pos;
                text = `position ${targetPos}`; 
                autoPos = targetPos; 
            }
            else if (disp === 2) { text = "position 1"; autoPos = 1; }
            else if (disp === 3 || disp === 4) { 
                const targetPos = memoryState[2].pos;
                text = `position ${targetPos}`; 
                autoPos = targetPos; 
            }
        } else if (stageNum === 5) {
            if (disp === 1) { 
                const targetLbl = memoryState[1].label;
                text = `button labeled '${targetLbl}'`; 
                autoLbl = targetLbl; 
            }
            else if (disp === 2) { 
                const targetLbl = memoryState[2].label;
                text = `button labeled '${targetLbl}'`; 
                autoLbl = targetLbl; 
            }
            else if (disp === 3) { 
                const targetLbl = memoryState[4].label;
                text = `button labeled '${targetLbl}'`; 
                autoLbl = targetLbl; 
            }
            else if (disp === 4) { 
                const targetLbl = memoryState[3].label;
                text = `button labeled '${targetLbl}'`; 
                autoLbl = targetLbl; 
            }
        }

        return { text, autoPos, autoLbl };
    }

    stageRows.forEach((row, index) => {
        const stageNum = index + 1;
        const dispBtns = row.querySelectorAll('.mem-disp-btn');
        const actionBox = row.querySelector('.memory-action-box');
        const instructionText = row.querySelector('.mem-instruction-text');
        
        const posBtns = row.querySelectorAll('.mem-pos-btn');
        const lblBtns = row.querySelectorAll('.mem-lbl-btn');

        dispBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dispBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                memoryState[stageNum].display = parseInt(btn.getAttribute('data-val'));
                
                // Reset inputs and enable all buttons initially
                posBtns.forEach(b => {
                    b.classList.remove('active');
                    b.disabled = false;
                });
                lblBtns.forEach(b => {
                    b.classList.remove('active');
                    b.disabled = false;
                });
                memoryState[stageNum].pos = null;
                memoryState[stageNum].label = null;

                const result = processStage(stageNum);
                instructionText.textContent = result.text;
                actionBox.style.display = 'flex';

                // If position is automatically selected, grey out other position buttons
                if (result.autoPos !== null) {
                    memoryState[stageNum].pos = result.autoPos;
                    posBtns.forEach(b => {
                        const val = parseInt(b.getAttribute('data-val'));
                        if (val === result.autoPos) {
                            b.classList.add('active');
                        } else {
                            b.disabled = true; // Grey out unselected buttons in this section
                        }
                    });
                }

                // If label is automatically selected, grey out other label buttons
                if (result.autoLbl !== null) {
                    memoryState[stageNum].label = result.autoLbl;
                    lblBtns.forEach(b => {
                        const val = parseInt(b.getAttribute('data-val'));
                        if (val === result.autoLbl) {
                            b.classList.add('active');
                        } else {
                            b.disabled = true; // Grey out unselected buttons in this section
                        }
                    });
                }
            });
        });

        posBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                posBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                memoryState[stageNum].pos = parseInt(btn.getAttribute('data-val'));
                checkStageComplete(stageNum, container);
            });
        });

        lblBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                lblBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                memoryState[stageNum].label = parseInt(btn.getAttribute('data-val'));
                checkStageComplete(stageNum, container);
            });
        });
    });

    function checkStageComplete(stageNum, container) {
        if (stageNum < 5) {
            const nextRow = container.querySelector(`#m-stage-${stageNum + 1}`);
            if (nextRow) {
                nextRow.style.opacity = '1';
                nextRow.style.pointerEvents = 'auto';
            }
        }
    }

    resetBtn.addEventListener('click', () => {
        stageRows.forEach((row, index) => {
            const stNum = index + 1;
            memoryState[stNum] = { display: null, pos: null, label: null };
            row.querySelectorAll('button').forEach(b => {
                b.classList.remove('active');
                b.disabled = false;
            });
            row.querySelector('.memory-action-box').style.display = 'none';
            if (stNum > 1) {
                row.style.opacity = '0.4';
                row.style.pointerEvents = 'none';
            }
        });
    });
}

// ==========================================
// MORSE CODE MODULE LOGIC (Fuzzy & Substring Matching)
// ==========================================
function initMorse(container) {
    const textInput = container.querySelector('#morse-text-input');
    const wordListContainer = container.querySelector('.morse-word-list');
    const resetBtn = container.querySelector('.resetBtn');

    // Standard Morse Code Map (Letter to Morse)
    const letterToMorse = {
        'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.',
        'f': '..-.', 'g': '--.', 'h': '....', 'i': '..', 'j': '.---',
        'k': '-.-', 'l': '.-..', 'm': '--', 'n': '-.', 'o': '---',
        'p': '.--.', 'q': '--.-', 'r': '.-.', 's': '...', 't': '-',
        'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-', 'y': '-.--',
        'z': '--..'
    };

    // Raw dictionary data
    const rawDictionary = [
        { word: "shell", freq: "3.505 MHz" },
        { word: "halls", freq: "3.515 MHz" },
        { word: "slick", freq: "3.522 MHz" },
        { word: "trick", freq: "3.532 MHz" },
        { word: "boxes", freq: "3.535 MHz" },
        { word: "leaks", freq: "3.542 MHz" },
        { word: "strobe", freq: "3.545 MHz" },
        { word: "bistro", freq: "3.552 MHz" },
        { word: "flick", freq: "3.555 MHz" },
        { word: "bomb", freq: "3.565 MHz" },
        { word: "break", freq: "3.572 MHz" },
        { word: "brick", freq: "3.575 MHz" },
        { word: "steak", freq: "3.582 MHz" },
        { word: "sting", freq: "3.592 MHz" },
        { word: "vector", freq: "3.595 MHz" },
        { word: "beats", freq: "3.600 MHz" }
    ];

    // Pre-calculate continuous Morse code for each word
    const morseDictionary = rawDictionary.map(item => {
        const continuousMorse = item.word.split('').map(char => letterToMorse[char] || '').join('');
        return { ...item, continuousMorse };
    });

    // Levenshtein Distance helper for fuzzy matching typos
    function getEditDistance(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i-1) === a.charAt(j-1)) {
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i-1][j-1] + 1, // substitution
                        matrix[i][j-1] + 1,   // insertion
                        matrix[i-1][j] + 1    // deletion
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }

    // Find best match score against any substring of the word's morse code
    function getBestSubstringScore(pattern, text) {
        if (!pattern) return Infinity;
        if (text.includes(pattern)) return 0; // Perfect substring match

        let minDistance = Infinity;
        // Check substrings whose lengths are close to the pattern length
        for (let i = 0; i < text.length; i++) {
            for (let j = i + 1; j <= text.length; j++) {
                const sub = text.substring(i, j);
                if (Math.abs(sub.length - pattern.length) <= 3) {
                    const dist = getEditDistance(pattern, sub);
                    if (dist < minDistance) {
                        minDistance = dist;
                    }
                }
            }
        }
        return minDistance;
    }

    function updateMatches() {
        const inputVal = textInput.value.replace(/[^.-]/g, '');
        
        if (!inputVal) {
            wordListContainer.innerHTML = `<span class="morse-placeholder-tip">Type sequence above...</span>`;
            return;
        }

        // Score all words based on how closely they match (lower score = better match)
        const scoredMatches = morseDictionary.map(item => {
            const score = getBestSubstringScore(inputVal, item.continuousMorse);
            return { ...item, score };
        });

        // Filter out poor matches (allowing up to 2 mistakes/errors)
        const validMatches = scoredMatches.filter(item => item.score <= 2);

        // Sort by closest match (lowest score first)
        validMatches.sort((a, b) => a.score - b.score);

        if (validMatches.length === 0) {
            wordListContainer.innerHTML = `<span class="morse-placeholder-tip" style="color: #ff5555;">No matching words found</span>`;
        } else {
            wordListContainer.innerHTML = validMatches.map(m => `
                <div class="morse-item" style="${m.score > 0 ? 'opacity: 0.7;' : ''}">
                    <span class="word">${m.word} ${m.score > 0 ? '<small style="font-size:9px; color:#ffaa00;">(approx)</small>' : ''}</span>
                    <span class="freq">${m.freq}</span>
                </div>
            `).join('');
        }
    }

    textInput.addEventListener('input', updateMatches);

    resetBtn.addEventListener('click', () => {
        textInput.value = "";
        updateMatches();
    });
}
