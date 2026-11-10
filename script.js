document.addEventListener('DOMContentLoaded', () => {
    for (let i = 1; i <= 2; i++) {
        const selector = document.getElementById(`select-${i}`);
        if (selector) {
            selector.addEventListener('change', (e) => loadModule(`content-${i}`, e.target.value));
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const globalToggles = document.querySelectorAll('.global-toggle-btn');
    
    globalToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const property = btn.getAttribute('data-property');
            
            // Make Serial Odd and Serial Even mutually exclusive
            if (property === 'serial-odd' && !btn.classList.contains('active')) {
                const evenBtn = document.querySelector('.global-toggle-btn[data-property="serial-even"]');
                if (evenBtn) evenBtn.classList.remove('active');
            } else if (property === 'serial-even' && !btn.classList.contains('active')) {
                const oddBtn = document.querySelector('.global-toggle-btn[data-property="serial-odd"]');
                if (oddBtn) oddBtn.classList.remove('active');
            }

            btn.classList.toggle('active');
        });
    });
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
        } else if (moduleType === 'keypads') {
            initKeypads(container);
        } else if (moduleType === 'memory') {
            initMemory(container);
        } else if (moduleType === 'morse') {
            initMorse(container);
        } else if (moduleType === 'whos-on-first') {
            initWhosOnFirst(container);
        }
    }
}

// ==========================================
// WIRES LOGIC
// ==========================================
const AVAILABLE_COLORS = ['black', 'blue', 'white', 'red', 'yellow'];

function initSimpleWires(container) {
    const countButtons = container.querySelectorAll('.wire-count-btn');
    const dynamicContainer = container.querySelector('.dynamic-wires-container');
    const generateBtn = container.querySelector('.generateBtn');
    const resetBtn = container.querySelector('.resetBtn');
    const resultDisplay = container.querySelector('.wire-cut-result');

    renderWireRows(3, dynamicContainer); // Default to 3 wires on load
    
    const defaultBtn = container.querySelector('.wire-count-btn[data-count="3"]');
    if (defaultBtn) defaultBtn.classList.add('active');

    resultDisplay.style.color = '#fff';

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
        container.querySelectorAll('.dynamic-wires-container input[type="radio"]').forEach(box => box.checked = false);
        resultDisplay.textContent = '--';
        resultDisplay.style.color = '#fff';
        // Note: Global status bar buttons are reset globally, not per-module reset.
    });

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
        
        // Read the serial odd status globally from the header status bar
        const globalSerialBtn = document.querySelector('.global-toggle-btn[data-property="serial-odd"]');
        const serialOdd = globalSerialBtn ? globalSerialBtn.classList.contains('active') : false;

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

        const lastWire = () => wires[wires.length - 1];
        const countColor = (col) => wires.filter(c => c === col).length;
        const lastIndexOfColor = (col) => wires.lastIndexOf(col) + 1;

        if (count === 3) {
            if (!wires.includes('red')) {
                cutInstruction = 'Second Wire';
            } else if (lastWire() === 'white') {
                cutInstruction = 'Last Wire';
            } else if (countColor('blue') > 1) {
                cutInstruction = `Last Blue Wire (Wire ${lastIndexOfColor('blue')})`;
            } else {
                cutInstruction = 'Last Wire';
            }
        } else if (count === 4) {
            const redCount = countColor('red');
            const blueCount = countColor('blue');
            
            if (redCount > 1 && serialOdd) {
                cutInstruction = `Last Red Wire (Wire ${lastIndexOfColor('red')})`;
            } else if (lastWire() === 'yellow' && redCount === 0) {
                cutInstruction = 'First Wire';
            } else if (blueCount === 1) {
                cutInstruction = 'First Wire';
            } else if (countColor('yellow') > 1) {
                cutInstruction = 'Last Wire';
            } else {
                cutInstruction = 'Second Wire';
            }
        } else if (count === 5) {
            const redCount = countColor('red');
            
            if (lastWire() === 'black' && serialOdd) {
                cutInstruction = 'Fourth Wire';
            } else if (redCount === 1 && countColor('yellow') > 1) {
                cutInstruction = 'First Wire';
            } else if (countColor('black') === 0) {
                cutInstruction = 'Second Wire';
            } else {
                cutInstruction = 'First Wire';
            }
        } else if (count === 6) {
            const yellowCount = countColor('yellow');
            const whiteCount = countColor('white');
            const redCount = countColor('red');

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
}

// ==========================================
// COMPLICATED WIRES LOGIC
// ==========================================
function initComplicatedWires(container) {
    const generateBtn = container.querySelector('.generateBtn');
    const resetBtn = container.querySelector('.resetBtn');

    generateBtn.addEventListener('click', () => solveWires(container));
    resetBtn.addEventListener('click', () => resetBoard(container));

    function solveWires(container) {
    // Read state directly from the global status bar at the top of the page
    const parallelBtn = document.querySelector('.global-toggle-btn[data-property="parallel"]');
    const parallel = parallelBtn ? parallelBtn.classList.contains('active') : false;

    const batteryBtn = document.querySelector('.global-toggle-btn[data-property="batteries"]');
    const batteries = batteryBtn ? batteryBtn.classList.contains('active') : false;
    
    const evenBtn = document.querySelector('.global-toggle-btn[data-property="serial-even"]');
    const serialEven = evenBtn ? evenBtn.classList.contains('active') : false;

    const wireCols = container.querySelectorAll('.c-wire-col');
    const lookupKey = {
        'W': 'C',
        'L': 'D',
        'S': 'C',
        'LS': 'Bat',
        'R': '#',
        'RS': 'C',
        'LR': 'Bat',
        'LRS': 'Bat',
        'B': '#',
        'BS': 'D',
        'LB': 'P',
        'LBS': 'P',
        'RB': '#',
        'RBS': 'P',
        'LRB': '#',
        'LRBS': 'D'
    };

    wireCols.forEach(col => {
        // Safe check for checkbox elements in each wire column
        const getChecked = (selector) => {
            const el = col.querySelector(selector);
            return el ? el.checked : false;
        };

        const light = getChecked('.badge-light') || col.querySelector('.badge-light')?.previousElementSibling?.checked || false;
        // Alternatively, if using your exact structure where inputs precede labels:
        const inputs = col.querySelectorAll('input[type="checkbox"]');
        // If your inputs map directly to [LED, Red, Blue, White, Star]:
        const lightBox = col.querySelector('#cw-1-l, [id$="-l"]'); // adjust per column if needed
        
        // Let's use your robust row-property reading strategy:
        const lightInput = col.querySelector('.badge-light')?.previousElementSibling;
        const redInput = col.querySelector('.badge-red')?.previousElementSibling;
        const blueInput = col.querySelector('.badge-blue')?.previousElementSibling;
        const whiteInput = col.querySelector('.badge-white')?.previousElementSibling;
        const starInput = col.querySelector('.badge-star')?.previousElementSibling;

        const isLight = lightInput ? lightInput.checked : false;
        const isRed = redInput ? redInput.checked : false;
        const isBlue = blueInput ? blueInput.checked : false;
        const isWhite = whiteInput ? whiteInput.checked : false;
        const isStar = starInput ? starInput.checked : false;
        
        const resultBox = col.querySelector('.wire-result');

        let key = '';
        if (isLight) key += 'L';
        if (isRed) key += 'R';
        if (isBlue) key += 'B';
        if (isWhite) key += 'W';
        if (isStar) key += 'S';

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
        // Uncheck wire checkboxes inside this module
        container.querySelectorAll('input[type="checkbox"]').forEach(box => box.checked = false);
        
        // Reset result boxes
        container.querySelectorAll('.c-wire-result-box').forEach(box => {
            box.textContent = '--';
            box.style.color = '#fff';
        });
    }
}

// =====================================================================
// WIRE SEQUENCE LOGIC
// =====================================================================
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

    // --- Make radio buttons toggleable (Attached once) ---
    const radios = container.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.addEventListener('click', function() {
            if (this.dataset.checked === "true") {
                this.checked = false;
                this.dataset.checked = "false";
            } else {
                container.querySelectorAll(`input[name="${this.name}"]`).forEach(r => {
                    r.dataset.checked = "false";
                });
                this.checked = true;
                this.dataset.checked = "true";
            }
        });
    });

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

    if (generateBtn) {
        generateBtn.addEventListener('click', () => solveWireSequence(container));
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // 1. Uncheck all radios and clear their toggle state
            container.querySelectorAll('.seq-wire-row input[type="radio"]').forEach(radio => {
                radio.checked = false;
                radio.dataset.checked = "false";
            });
            // 2. Clear results
            container.querySelectorAll('.seq-result').forEach(span => {
                span.textContent = '--';
                span.style.color = '#fff';
            });
            // 3. Reset panel back to 1 without re-running initWireSequence
            currentPanel = 1;
            updatePanelDisplay();
        });
    }

    updatePanelDisplay();

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
}

// =====================================================================
// KEYPADS LOGIC
// =====================================================================

const KEYPAD_COLUMNS = [
    ['Ϙ', 'Ѧ', 'ƛ', 'Ϟ', 'Ѭ', 'ϗ', 'Ͽ'], // Column 1
    ['Ӭ', 'Ϙ', 'Ͽ', 'Ҩ', '☆', 'ϗ', '¿'], // Column 2
    ['©', 'ѽ', 'Ҩ', 'Җ', 'Ԇ', 'ƛ', '☆'], // Column 3
    ['б', '¶', 'Ѣ', 'Ѭ', 'Җ', '¿', 'ټ'], // Column 4
    ['Ψ', 'ټ', 'Ѣ', 'Ͼ', '¶', 'Ѯ', '★'], // Column 5
    ['б', 'Ӭ', '҂', 'æ', 'Ψ', 'Й', 'Ω']  // Column 6
];

const SANS_SERIF_SYMBOLS = ['Ϙ', 'Ѧ', 'Ѭ', 'Ͽ', 'Ͼ', '©', '¶', '҂', 'ټ'];

function initKeypads(container) {
    const columnsGrid = container.querySelector('.keypad-columns-grid');
    const resetBtn = container.querySelector('.resetBtn');
    const resultDisplay = container.querySelector('.keypad-result');
    const slots = container.querySelectorAll('.kp-slot b');

    let selectedSymbols = [];

    // Render the 6 columns and their cells
    columnsGrid.innerHTML = '';
    const columnElements = [];

    KEYPAD_COLUMNS.forEach((colData, colIndex) => {
    const colDiv = document.createElement('div');
    colDiv.className = 'kp-column';
    colDiv.dataset.colIndex = colIndex;

    const cellElements = [];
    colData.forEach(symbol => {
        const cell = document.createElement('div');
        
        // Base class + dynamic font class assignment
        cell.className = 'kp-cell';
        if (SANS_SERIF_SYMBOLS.includes(symbol)) {
            cell.classList.add('font-sans');
        } else {
            cell.classList.add('font-serif');
        }

        cell.textContent = symbol;
        cell.dataset.symbol = symbol;

        cell.addEventListener('click', () => {
            handleSymbolClick(symbol);
        });

        colDiv.appendChild(cell);
        cellElements.push({ symbol, cell });
    });

    columnsGrid.appendChild(colDiv);
    columnElements.push({ colDiv, colData, cellElements });
});

    function handleSymbolClick(symbol) {
        const index = selectedSymbols.indexOf(symbol);
        
        if (index > -1) {
            // Deselect if already chosen
            selectedSymbols.splice(index, 1);
        } else {
            // Select if under limit of 4
            if (selectedSymbols.length < 4) {
                selectedSymbols.push(symbol);
            }
        }

        updateUI();
    }

    function updateUI() {
        // 1. Update preview slots
        slots.forEach((slot, i) => {
            slot.textContent = selectedSymbols[i] || '';
        });

        // 2. Highlight all occurrences of selected symbols across all cells
        columnElements.forEach(col => {
            col.cellElements.forEach(item => {
                if (selectedSymbols.includes(item.symbol)) {
                    item.cell.classList.add('selected');
                } else {
                    item.cell.classList.remove('selected');
                }
            });
        });

        // 3. If 4 symbols are selected, grey out incorrect columns and solve automatically
        if (selectedSymbols.length === 4) {
            let matchingColData = null;

            columnElements.forEach(col => {
                const hasAll = selectedSymbols.every(sym => col.colData.includes(sym));
                if (hasAll) {
                    col.colDiv.classList.remove('greyed-out');
                    matchingColData = col.colData;
                } else {
                    col.colDiv.classList.add('greyed-out');
                }
            });

        } else {
            // Reset greyed-out state and result when fewer than 4 symbols are picked
            columnElements.forEach(col => col.colDiv.classList.remove('greyed-out'));
            resultDisplay.textContent = '--';
            resultDisplay.style.color = '#fff';
        }
    }

    function resetKeypads() {
        selectedSymbols = [];
        updateUI();
    }

    resetBtn.addEventListener('click', resetKeypads);
}

// =====================================================================
// PASSWORD LOGIC
// =====================================================================
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
    const resetBtn = container.querySelector('.resetBtn');
    const inputs = container.querySelectorAll('.pwd-input');
    const wordListContainer = container.querySelector('.password-word-list');

    function updatePasswordMatches() {
        const positionLetters = Array.from(inputs).map(input => 
            input.value.toLowerCase().replace(/[^a-z]/g, '').split('')
        );

        // Check if all inputs are completely empty
        const isEmpty = positionLetters.every(arr => arr.length === 0);
        if (isEmpty) {
            wordListContainer.innerHTML = `<span class="password-placeholder-tip">Type possible letters above...</span>`;
            return;
        }

        // Filter words matching the entered letters per position
        const matches = PASSWORD_WORD_BANK.filter(word => {
            for (let i = 0; i < 5; i++) {
                const lettersForPos = positionLetters[i];
                if (lettersForPos.length > 0 && !lettersForPos.includes(word[i])) {
                    return false;
                }
            }
            return true;
        });

        if (matches.length === 0) {
            wordListContainer.innerHTML = `<span class="password-placeholder-tip" style="color: #ff5555;">No matching words found</span>`;
        } else {
            wordListContainer.innerHTML = matches.map(word => `
                <div class="password-item">
                    <span class="word">${word}</span>
                </div>
            `).join('');
        }
    }

    // Attach live input listener to every box
    inputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            updatePasswordMatches();
            // Optional: auto-jump focus if typing multiple letters into one box
            if (input.value.length >= 6 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
    });

    resetBtn.addEventListener('click', () => {
        inputs.forEach(input => input.value = '');
        updatePasswordMatches();
        inputs[0].focus();
    });

    // Initial render call
    updatePasswordMatches();
}

// =====================================================================
// MEMORY LOGIC
// =====================================================================
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

// =====================================================================
// MORSE CODE LOGIC
// =====================================================================
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
            wordListContainer.innerHTML = `<span class="morse-placeholder-tip"></span>`;
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
        textInput.focus();
    });
}

// =====================================================================
// WHO'S ON FIRST LOGIC
// =====================================================================
function initWhosOnFirst(container) {
    const displayInput = container.querySelector('#wof-display-input');
    const targetInput = container.querySelector('#wof-target-input');
    const step2Container = container.querySelector('#wof-step-2');
    const positionPrompt = container.querySelector('#wof-position-prompt');
    const resultBox = container.querySelector('#wof-result-box');
    const wordListContainer = container.querySelector('#wof-word-list');
    const resetBtn = container.querySelector('.resetBtn');

    let resolvedPosition = "";

    const displayPositionMap = {
        "YES": { index: 1, name: "Middle-Left"},
        "FIRST": { index: 2, name: "Top-Right"},
        "DISPLAY": { index: 3, name: "Bottom-Right"},
        "OKAY": { index: 4, name: "Top-Right"},
        "SAYS": { index: 5, name: "Bottom-Right"},
        "NOTHING": { index: 6, name: "Middle-Left"},
        "": { index: 7, name: "Bottom-Left"},
        "BLANK": { index: 8, name: "Middle-Right"},
        "NO": { index: 9, name: "Bottom-Right"},
        "LED": { index: 10, name: "Middle-Left"},
        "LEAD": { index: 11, name: "Bottom-Right"},
        "READ": { index: 12, name: "Middle-Right"},
        "RED": { index: 13, name: "Middle-Right"},
        "REED": { index: 14, name: "Bottom-Left"},
        "LEED": { index: 15, name: "Bottom-Left"},
        "HOLD ON": { index: 16, name: "Bottom-Right"},
        "YOU": { index: 17, name: "Middle-Right"},
        "YOU ARE": { index: 18, name: "Bottom-Right"},
        "YOUR": { index: 19, name: "Middle-Right"},
        "YOU'RE": { index: 20, name: "Middle-Right"},
        "UR": { index: 21, name: "Top-Left"},
        "THERE": { index: 22, name: "Bottom-Right"},
        "THEY'RE": { index: 23, name: "Bottom-Left"},
        "THEIR": { index: 24, name: "Middle-Right"},
        "THEY ARE": { index: 25, name: "Middle-Left"},
        "SEE": { index: 26, name: "Bottom-Right"},
        "C": { index: 27, name: "Top-Right"},
        "CEE": { index: 28, name: "Bottom-Right"}
    };

    // Official word lists associated with each button word
    const wordLists = {
        "READY": ["YES", "OKAY", "WHAT", "MIDDLE", "LEFT", "PRESS", "RIGHT", "BLANK", "READY", "NO", "FIRST", "UHHH", "NOTHING", "WAIT"],
        "FIRST": ["LEFT", "OKAY", "YES", "MIDDLE", "NO", "RIGHT", "NOTHING", "UHHH", "WAIT", "READY", "BLANK", "WHAT", "PRESS", "FIRST"],
        "NO": ["BLANK", "UHHH", "WAIT", "FIRST", "WHAT", "READY", "RIGHT", "YES", "NOTHING", "LEFT", "PRESS", "OKAY", "NO", "MIDDLE"],
        "BLANK": ["WAIT", "RIGHT", "OKAY", "MIDDLE", "BLANK", "PRESS", "READY", "NOTHING", "NO", "WHAT", "LEFT", "UHHH", "YES", "FIRST"],
        "NOTHING": ["UHHH", "RIGHT", "OKAY", "MIDDLE", "YES", "BLANK", "NO", "PRESS", "LEFT", "WHAT", "WAIT", "FIRST", "NOTHING", "READY"],
        "YES": ["OKAY", "RIGHT", "UHHH", "MIDDLE", "FIRST", "WHAT", "PRESS", "READY", "NOTHING", "YES", "LEFT", "BLANK", "NO", "WAIT"],
        "WHAT": ["UHHH", "WHAT", "LEFT", "NOTHING", "READY", "BLANK", "MIDDLE", "NO", "OKAY", "FIRST", "WAIT", "YES", "PRESS", "RIGHT"],
        "UHHH": ["READY", "NOTHING", "LEFT", "WHAT", "OKAY", "YES", "RIGHT", "NO", "PRESS", "BLANK", "UHHH", "MIDDLE", "WAIT", "FIRST"],
        "LEFT": ["RIGHT", "LEFT", "FIRST", "NO", "MIDDLE", "YES", "BLANK", "WHAT", "UHHH", "WAIT", "PRESS", "READY", "OKAY", "NOTHING"],
        "RIGHT": ["YES", "NOTHING", "READY", "PRESS", "NO", "WAIT", "WHAT", "RIGHT", "MIDDLE", "LEFT", "UHHH", "BLANK", "OKAY", "FIRST"],
        "MIDDLE": ["BLANK", "READY", "OKAY", "WHAT", "NOTHING", "PRESS", "NO", "WAIT", "LEFT", "MIDDLE", "RIGHT", "FIRST", "UHHH", "YES"],
        "OKAY": ["MIDDLE", "NO", "FIRST", "YES", "UHHH", "NOTHING", "WAIT", "OKAY", "LEFT", "READY", "BLANK", "PRESS", "WHAT", "RIGHT"],
        "WAIT": ["UHHH", "NO", "BLANK", "OKAY", "YES", "LEFT", "FIRST", "PRESS", "WHAT", "WAIT", "NOTHING", "READY", "RIGHT", "MIDDLE"],
        "PRESS": ["RIGHT", "MIDDLE", "YES", "READY", "PRESS", "OKAY", "NOTHING", "UHHH", "BLANK", "LEFT", "FIRST", "WHAT", "NO", "WAIT"],
        "YOU": ["SURE", "YOU ARE", "YOUR", "YOU'RE", "NEXT", "UH HUH", "UR", "HOLD", "WHAT?", "YOU", "UH UH", "LIKE", "DONE", "U"],
        "YOU ARE": ["YOUR", "NEXT", "LIKE", "UH HUH", "WHAT?", "DONE", "UH UH", "HOLD", "YOU", "U", "YOU'RE", "SURE", "UR", "YOU ARE"],
        "YOUR": ["UH UH", "YOU ARE", "UH HUH", "YOUR", "NEXT", "UR", "SURE", "U", "YOU'RE", "YOU", "WHAT?", "HOLD", "LIKE", "DONE"],
        "YOU'RE": ["YOU", "YOU'RE", "UR", "NEXT", "UH UH", "YOU ARE", "U", "YOUR", "WHAT?", "UH HUH", "SURE", "DONE", "LIKE", "HOLD"],
        "UR": ["DONE", "U", "UR", "UH HUH", "WHAT?", "SURE", "YOUR", "HOLD", "YOU'RE", "LIKE", "NEXT", "UH UH", "YOU ARE", "YOU"],
        "U": ["UH HUH", "SURE", "NEXT", "WHAT?", "YOU'RE", "UR", "UH UH", "DONE", "U", "YOU", "LIKE", "HOLD", "YOU ARE", "YOUR"],
        "UH HUH": ["UH HUH", "YOUR", "YOU ARE", "YOU", "DONE", "HOLD", "UH UH", "NEXT", "SURE", "LIKE", "YOU'RE", "UR", "U", "WHAT?"],
        "UH UH": ["UR", "U", "YOU ARE", "YOU'RE", "NEXT", "UH UH", "DONE", "YOU", "UH HUH", "LIKE", "YOUR", "SURE", "HOLD", "WHAT?"],
        "WHAT?": ["YOU", "HOLD", "YOU'RE", "YOUR", "U", "DONE", "UH UH", "LIKE", "YOU ARE", "UH HUH", "UR", "NEXT", "WHAT?", "SURE"],
        "DONE": ["SURE", "UH HUH", "NEXT", "WHAT?", "YOUR", "UR", "YOU'RE", "HOLD", "LIKE", "YOU", "U", "YOU ARE", "UH UH", "DONE"],
        "NEXT": ["WHAT?", "UH HUH", "UH UH", "YOUR", "HOLD", "SURE", "NEXT", "LIKE", "DONE", "YOU ARE", "UR", "YOU'RE", "U", "YOU"],
        "HOLD": ["YOU ARE", "U", "DONE", "UH UH", "YOU", "UR", "SURE", "WHAT?", "YOU'RE", "NEXT", "HOLD", "UH HUH", "YOUR", "LIKE"],
        "SURE": ["YOU ARE", "DONE", "LIKE", "YOU'RE", "YOU", "HOLD", "UH HUH", "UR", "SURE", "U", "WHAT?", "NEXT", "YOUR", "UH UH"],
        "LIKE": ["YOU'RE", "NEXT", "U", "UR", "HOLD", "DONE", "UH UH", "WHAT?", "UH HUH", "YOU", "LIKE", "SURE", "YOU ARE", "YOUR"]
    };

    // Enter key event for Step 1 (Display Word)
    displayInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const displayVal = displayInput.value.trim().toUpperCase();
            
            if (!displayPositionMap.hasOwnProperty(displayVal)) {
                alert(`Unknown display word "${displayVal}". Check spelling!`);
                return;
            }

            resolvedPosition = displayPositionMap[displayVal];
            
            positionPrompt.textContent = `${resolvedPosition.name} button`;
            step2Container.style.display = 'flex';
            targetInput.focus();
            displayInput.disabled = true;
        }
    });

    // Enter key event for Step 2 (Target Button Word)
    targetInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const buttonWord = targetInput.value.trim().toUpperCase();
            const list = wordLists[buttonWord];

            if (!list) {
                alert(`Unknown button word "${buttonWord}". Check spelling!`);
                return;
            }

            wordListContainer.innerHTML = list.map(word => `
                <div class="wof-word-item">${word}</div>
            `).join('');

            resultBox.style.display = 'block';
            targetInput.disabled = true;
        }
    });

    resetBtn.addEventListener('click', () => {
        displayInput.value = '';
        targetInput.value = '';
        displayInput.disabled = false;
        targetInput.disabled = false;
        step2Container.style.display = 'none';
        resultBox.style.display = 'none';
        displayInput.focus();
    });

    displayInput.focus();
}
