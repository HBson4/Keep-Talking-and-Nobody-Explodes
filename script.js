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
    const countRadios = container.querySelectorAll('input[name="wire_count"]');
    const dynamicContainer = container.querySelector('.dynamic-wires-container');
    const generateBtn = container.querySelector('.generateBtn');
    const resetBtn = container.querySelector('.resetBtn');
    const resultDisplay = container.querySelector('.wire-cut-result');

    // Single Serial Odd toggle button logic
    const serialOddBtn = container.querySelector('.serial-odd-btn');
    if (serialOddBtn) {
        serialOddBtn.addEventListener('click', () => {
            serialOddBtn.classList.toggle('active');
        });
    }

    countRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const count = parseInt(e.target.value);
            renderWireRows(count, dynamicContainer);
            resultDisplay.textContent = '--';
        });
    });

    generateBtn.addEventListener('click', () => solveSimpleWires(container));
    resetBtn.addEventListener('click', () => {
        countRadios.forEach(r => r.checked = false);
        dynamicContainer.innerHTML = '';
        resultDisplay.textContent = '--';
        if (serialOddBtn) serialOddBtn.classList.remove('active');
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