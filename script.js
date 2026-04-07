/* ==========================
    declarations & variables
========================== */
const gridContainer = document.getElementById('grid');

const easy = document.getElementById('diff-easy');
const medium = document.getElementById('diff-medium');
const hard = document.getElementById('diff-hard');
const extreme = document.getElementById('diff-extreme');
const difficultySelect = document.getElementById('difficulty')

const start = document.getElementById('startButton');
const reset = document.getElementById('resetButton');
const timer = document.getElementById('timer');
const hint = document.getElementById('hint');
const hintCounter = document.getElementById('hints');

const solution = document.getElementById('solution');
const solutionPanel = document.getElementById('reveal-solution');
const activeButtons = document.querySelectorAll('.gamerunning');

const revealYes = document.getElementById('reveal-yes');
const revealNo = document.getElementById('reveal-no');

const winPanel = document.getElementById('solved');
const winBtn = document.getElementById('ok');

const boardCells = [];

let lastEditedCell;
let lastEditedCellRow;
let lastEditedCellCol;

let cellVal;
let errorDetected = false;
let confirm = false;

let gameStarted = false;
let timerInterval;
let time = '00:00:00';
let seconds = 0;
let minutes = 0;
let hours = 0;

let hintsUsed = 0;
let emptyCells = [];

let rows = [];
let columns = [];
let boxes = []; // 3x3 boxes

let puzzleBoard = [];
let solvedBoard = [];

let allowedNumbers = [1,2,3,4,5,6,7,8,9];
let boardState = [
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '']
];
let boardStateClear = [...boardState]

/* ==========================
    UI/Display
========================== */
const gridGen = () => {

    for (let i = 0; i < 9; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row');

        rows.push([]);
        columns.push([]);
        boxes.push([]);

        // create row in boardCells
        boardCells[i] = [];

        for (let j = 0; j < 9; j++) {
            const cell = document.createElement('input');

            cell.type = 'text';
            cell.inputMode = 'numeric';
            cell.pattern = '[0-9\\s]';
            cell.maxLength = '1';
            cell.classList.add('cell');

            // cell identity
            cell.dataset.row = i;
            cell.dataset.col = j;

            // calc which 3x3 box cell belongs to
            cell.dataset.box = Math.floor(i / 3) * 3 + Math.floor(j / 3);

            // add cell to arr for refferencing
            boardCells[i][j] = cell;

            // player input styling
            cell.addEventListener('input', function () {
                if (cell.classList.contains('given')) {
                    return;
                }

                if (cell.value === '') {
                    cell.classList.remove('player');
                } else {
                    cell.classList.add('player');
                }
            });

            rowDiv.appendChild(cell);
        }
        gridContainer.appendChild(rowDiv);
    }
};

// mark given puzzle numbers
const setGivenCell = (i, j, value) => {
    const cell = boardCells[i][j];

    cell.value = value;
    cell.classList.add('given');
    cell.classList.remove('player');
    cell.classList.remove('wrong');
    cell.readOnly = true;
};

// clear specific cell
const clearCell = (i, j) => {
    const cell = boardCells[i][j];

    cell.value = '';
    cell.classList.remove('given');
    cell.classList.remove('player');
    cell.classList.remove('wrong');
    cell.readOnly = false;
};

/* ==========================
    input / events
========================== */

// add numberonly filter
const numberFilter = () => {
    const allCells = document.querySelectorAll('.cell');

    allCells.forEach(function (cell) {
        cell.addEventListener('input', function () {
            cell.value = cell.value.replace(/[^1-9]/g, '');

            lastEditedCell = boardCells[cell.dataset.row][cell.dataset.col];
            lastEditedCellRow = Number(cell.dataset.row);
            lastEditedCellCol = Number(cell.dataset.col);

            validateInput();
        });
    });
};

// sync boardstate with current cell value
const synchBoardState = () => {
    let row = Number(lastEditedCell.dataset.row);
    let col = Number(lastEditedCell.dataset.col);
    let value = lastEditedCell.value;

    boardState[row][col] = value;

    // if cell was cleared, nothing else to check
    if (value === '') {
        return;
    }
};

/* =============================
    Board logic / Validation
============================= */
const testGroup = (rows) => rows.every(row => validGroup(row));

//  mistake detection
// remove all old wrong marks before checking again
const clearWrongMarks = () => {
    errorDetected = false;

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            boardCells[i][j].classList.remove('wrong');
        }
    }
};

const clearHints = () => {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            boardCells[i][j].classList.remove('hint');
        }
    }
}

// reset validation so old data doesn't stay behind
const resetValidationArrays = () => {
    rows = [];
    columns = [];
    boxes = [];

    for (let i = 0; i < 9; i++) {
        rows.push([]);
        columns.push([]);
        boxes.push([]);
    }
};

// mark duplicates inside row
const markRowDuplicates = (rowIndex) => {
    let valueCounts = {};

    for (let i = 0; i < 9; i++) {
        let cell = boardCells[rowIndex][i];
        let value = cell.value;

        if (value !== '') {
            if (valueCounts[value] === undefined) {
                valueCounts[value] = 1;
            } else {
                valueCounts[value] = valueCounts[value] + 1;
            }
        }
    }

    for (let i = 0; i < 9; i++) {
        let cell = boardCells[rowIndex][i];
        let value = cell.value;

        if (value !== '') {
            if (valueCounts[value] > 1) {
                cell.classList.add('wrong');
                errorDetected = true;
            }
        }
    }
};

// mark duplicates inside column
const markColumnDuplicates = (colIndex) => {
    let valueCounts = {};

    for (let i = 0; i < 9; i++) {
        let cell = boardCells[i][colIndex];
        let value = cell.value;

        if (value !== '') {
            if (valueCounts[value] === undefined) {
                valueCounts[value] = 1;
            } else {
                valueCounts[value] = valueCounts[value] + 1;
            }
        }
    }

    for (let i = 0; i < 9; i++) {
        let cell = boardCells[i][colIndex];
        let value = cell.value;

        if (value !== '') {
            if (valueCounts[value] > 1) {
                cell.classList.add('wrong');
                errorDetected = true;
            }
        }
    }
};


// mark duplicates inside box
const markBoxDuplicates = (boxIndex) => {
    let valueCounts = {};

    for (let i = 0; i < 9; i++) {
        let cell = boardCells[Math.floor(boxIndex / 3) * 3 + Math.floor(i / 3)][(boxIndex % 3) * 3 + (i % 3)];
        let value = cell.value;

        if (value !== '') {
            if (valueCounts[value] === undefined) {
                valueCounts[value] = 1;
            } else {
                valueCounts[value] = valueCounts[value] + 1;
            }
        }
    }

    for (let i = 0; i < 9; i++) {
        let cell = boardCells[Math.floor(boxIndex / 3) * 3 + Math.floor(i / 3)][(boxIndex % 3) * 3 + (i % 3)];
        let value = cell.value;

        if (value !== '') {
            if (valueCounts[value] > 1) {
                cell.classList.add('wrong');
                errorDetected = true;
            }
        }
    }
};

// check if lines are valid
const validGroup = (array) => {
    const row = array.slice(0).sort().join('');
    const passingRow = [1,2,3,4,5,6,7,8,9].join('');
    
    return (row === passingRow);
};

// check for completion
const checkCompletion = () => {
    if (errorDetected) {
        return;
    }

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            let cell = boardCells[i][j];
            let value = cell.value;

            if (value === '') {
                return;
            }
        }
    }

    if (testGroup(rows) && testGroup(columns) && testGroup(boxes)) {
        winPanel.style.visibility = 'visible'
    }
};

winBtn.addEventListener('click', () => winPanel.style.visibility = 'hidden');

// check if number is already in group
const isNumberInRow = (board, row, number) => {
    for (let col = 0; col < 9; col++) {
        if (board[row][col] === number) {
            return true;
        }
    }
    return false;
};

const isNumberInCol = (board, col, number) => {
    for (let row = 0; row < 9; row++) {
        if (board[row][col] === number) {
            return true;
        }
    }
    return false;
};

const isNumberInBox = (board, row, col, number) => {
    const boxRow = Math.floor(row /3 ) * 3;
    const boxCol = Math.floor(col /3 ) * 3;

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c <3; c++) {
            if (board[boxRow + r][boxCol + c] === number) {
                return true;
            }
        }
    }
    return false;
};

const isValidPlacement = (board, row, col, number) => {
    if (isNumberInRow(board, row, number) === false && isNumberInCol(board, col, number) === false && isNumberInBox(board, row, col, number) === false) {
        return true;
    }
    return false;
};

const shuffle = (array) => {
    let currentIndex = array.length;
    while (currentIndex !== 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
};

function shuffle2(array) {
  let newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i-- ) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const range = (start, end) => {
  const length = end - start + 1;
  return Array.from( {length} , ( _ , i) => start + i);
};

/* =========================
Evaluate board state
    - clears previous error states
    - rebuilds row/column/box data
    - checks for duplicates and marks invalid cells
    - update error status
    - checks for puzzle completion
========================= */
const validateInput = () => {
    // log new input to console for debug
/*
    console.log(`Row: ${lastEditedCell.dataset.row}, Col: ${lastEditedCell.dataset.col}, Box: ${lastEditedCell.dataset.box}
Value: ${lastEditedCell.value}`);
*/

    clearWrongMarks();
    resetValidationArrays();

    // rebuild helper arrays from current board state
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            cellVal = boardCells[i][j].value;

            if (cellVal !== '') {
                let boxIndex = Math.floor(i / 3) * 3 + Math.floor(j / 3);

                rows[i].push(cellVal);
                columns[j].push(cellVal);
                boxes[boxIndex].push(cellVal);
            }
        }
    }

    // check all rows for duplicates and mark them
    for (let i = 0; i < 9; i++) {
        markRowDuplicates(i);
    }

    // check all columns for duplicates and mark them
    for (let i = 0; i < 9; i++) {
        markColumnDuplicates(i);
    } 

    // check all boxes for duplicates and mark them
    for (let i = 0; i < 9; i++) {
        markBoxDuplicates(i);
    }

    checkCompletion();
    synchBoardState();
};


/* ==============
    Gameflow
============== */
const updateButtons = () => {
    activeButtons.forEach(button => {
        if (!gameStarted) {        
            button.classList.add('disabled');
        } else {
            button.classList.remove('disabled');
        }
    });
}

// difficulties
const selectDiff = () => {
    if (!gameStarted) {
        difficultySelect.style.visibility = 'visible';
    } else {
        startGame();
    }
}

start.addEventListener('click', selectDiff);

easy.addEventListener('click', () => startGame(40));
medium.addEventListener('click', () => startGame(47));
hard.addEventListener('click', () => startGame(54));
extreme.addEventListener('click', () => startGame(59));

const confirmReveal = () => {
   if (!gameStarted) return
    revealSolution();
    solutionPanel.style.visibility = 'hidden';

    activeButtons.forEach(button => {     
            button.classList.add('disabled');
    });
    clearInterval(timerInterval);    
}

revealYes.addEventListener('click', confirmReveal);
revealNo.addEventListener('click', () => solutionPanel.style.visibility = 'hidden');
solution.addEventListener('click', () => solutionPanel.style.visibility = 'visible');

const startGame = (diff) => {
    clearInterval(timerInterval);
    puzzleBoard = [];
    seconds = 0;
    minutes = 0;
    hours = 0;
    timer.textContent = "00:00:00";
    hintsUsed = 0;
    hintCounter.innerText = '0';
    clearHints();

    if (!gameStarted) {
        start.innerText = 'Reset';
        gameStarted = true;
        updateButtons();
        difficultySelect.style.visibility = 'hidden';

        let validPuzzle = false;

        while (!validPuzzle) {
            solvedBoard = generateSolvedBoard();

            puzzleBoard = solvedBoard.map(function (row) {
                return row.slice();
            });

            let candidate = pokeHoles(puzzleBoard, diff);

            if (diff === 40) {
                if (isEasyPuzzle(candidate)) {
                    boardState = candidate;
                    validPuzzle = true;
                }
            } else if (diff === 47) {
                if (!isEasyPuzzle(candidate) && isMediumPuzzle(candidate)) {
                    boardState = candidate;
                    validPuzzle = true;
                }
            } else if (diff === 54) {
                if (!isEasyPuzzle(candidate) && !isMediumPuzzle(candidate) && isHardPuzzle(candidate)) {
                    boardState = candidate;
                    validPuzzle = true;
                }
            } else if (diff === 59) {
                if (!isEasyPuzzle(candidate) && !isMediumPuzzle(candidate) && !isHardPuzzle(candidate) && isExtremePuzzle(candidate)) {
                    boardState = candidate;
                    validPuzzle = true;
                }
            }
        }

        timerInterval = setInterval(updateTimer, 1000);
        revealBoard();
    } else {
        gameStarted = false;
        updateButtons();
        solvedBoard = [];
        puzzleBoard = [];
        start.innerText = 'Start';
        boardState = createEmptyBoard();
        clearWrongMarks();
        clearHints();
        revealBoard();
    }
};

// scoreboard timer
function updateTimer() {
    seconds += 1;
    if (seconds === 60) {
        seconds = 0;
        minutes ++;
    }

    if (minutes === 60) {
        minutes = 0;
        hours ++;
    }

    timer.textContent = `${format(hours)}:${format(minutes)}:${format(seconds)}`;
}

function format(num) {
    return num < 10 ? "0" + num : num;
}


/* ===========================
    puzzle generator / solver
=========================== */
// give hint
const revealHint = () => {
    emptyCells = [];

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (boardState[row][col] === '') {
                emptyCells.push({ row, col });
            }
        }
    }

    if (emptyCells.length === 0) {
        return;
    }

    let randomIndex = Math.floor(Math.random() * emptyCells.length);
    let hintCell = emptyCells[randomIndex];

    let row = hintCell.row;
    let col = hintCell.col;
    let hintValue = solvedBoard[row][col];

    boardState[row][col] = hintValue;
    boardCells[row][col].value = hintValue;
    boardCells[row][col].classList.remove('player');
    boardCells[row][col].classList.remove('wrong');
    boardCells[row][col].classList.add('hint');
    boardCells[row][col].readOnly = true;

    hintsUsed += 1;
    hintCounter.innerText = `${hintsUsed}`;

    clearWrongMarks();
    resetValidationArrays();

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            cellVal = boardCells[i][j].value;

            if (cellVal !== '') {
                let boxIndex = Math.floor(i / 3) * 3 + Math.floor(j / 3);

                rows[i].push(cellVal);
                columns[j].push(cellVal);
                boxes[boxIndex].push(cellVal);
            }
        }
    }

    for (let i = 0; i < 9; i++) {
        markRowDuplicates(i);
        markColumnDuplicates(i);
        markBoxDuplicates(i);
    }

    checkCompletion();
};

hint.addEventListener('click', revealHint);

const revealSolution = () => {
    boardState = solvedBoard;
    revealBoard();
}


// create non-interacive empty board 
const createEmptyBoard = () => {
    let board = [];

    for (let i = 0; i < 9; i++) {
        board[i] = [];
        for (let j = 0; j < 9; j++) {
            board[i][j] = '';
        }
    }
    return board;
};

// find next empty cell
const findEmptyCell = (board) => {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === '') {
                return [row, col];
            }
        }
    }
    return null;
};

// fill the board with numbers & validate for errors
const fillBoard = (board) => {
    let emptyCell = findEmptyCell(board);
    let numbers = [...allowedNumbers];
    shuffle(numbers);
    
    if (emptyCell === null) {
        return true;
    }
    let row = emptyCell[0];
    let col = emptyCell[1];


    for (let i = 0; i < numbers.length; i++) {
        let number = numbers[i];

        if (isValidPlacement(board, row, col, number)) {
            board[row][col] = number;
            
            if (fillBoard(board)) {
                return true;
            }
            board[row][col] = '';
        }
    }
    return false;
};

// generate filled board
const generateSolvedBoard = () => {
    let board = createEmptyBoard();
    fillBoard(board);
    return board;
};

const revealBoard = () => {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (boardState[row][col] === '') {
                clearCell(row, col);
            } else {
                setGivenCell(row, col, boardState[row][col]);
            }
        }
    }
};

// create holes
const pokeHoles = (board, holes) => {
    const positions = shuffle2(range(0, 80));
    let removedCount = 0;

    while (removedCount < holes && positions.length > 0) {
        const nextVal = positions.pop();
        const row = Math.floor(nextVal / 9);
        const col = nextVal % 9;

        if (board[row][col] === '') {
            continue;
        }

        const removedValue = board[row][col];
        board[row][col] = '';

        const testBoard = board.map(function (row) {
            return row.slice();
        });

        // keep track of solutions
        if (countSolutions(testBoard) !== 1) {
            // console.log(`solutions found: ${countSolutions(testBoard)}`);
            board[row][col] = removedValue;
        } else {
            removedCount += 1;
            // console.log(`solutions found: ${countSolutions(testBoard)}`);            
        }
    }

    return board.map(function (row) {
        return row.slice();
    });
};

// count colutions after holes poked
const findBestEmptyCell = (board) => {
    let bestCell = null;
    let bestCandidates = null;

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === '') {
                let candidates = [];

                for (let number = 1; number <= 9; number++) {
                    if (isValidPlacement(board, row, col, number)) {
                        candidates.push(number);
                    }
                }

                if (candidates.length === 0) {
                    return {
                        row: row,
                        col: col,
                        candidates: []
                    };
                }

                if (bestCell === null || candidates.length < bestCandidates.length) {
                    bestCell = {
                        row: row,
                        col: col,
                        candidates: candidates
                    };

                    bestCandidates = candidates;

                    if (candidates.length === 1) {
                        return bestCell;
                    }
                }
            }
        }
    }

    return bestCell;
};

const countSolutions = (board) => {
    let bestEmptyCell = findBestEmptyCell(board);

    if (bestEmptyCell === null) {
        return 1;
    }

    if (bestEmptyCell.candidates.length === 0) {
        return 0;
    }

    let row = bestEmptyCell.row;
    let col = bestEmptyCell.col;
    let candidates = bestEmptyCell.candidates;
    let solutionCount = 0;

    for (let i = 0; i < candidates.length; i++) {
        let number = candidates[i];

        board[row][col] = number;

        solutionCount = solutionCount + countSolutions(board);

        board[row][col] = '';

        if (solutionCount > 1) {
            return solutionCount;
        }
    }

    return solutionCount;
};

/* =======================
    simple difficulty grader
======================= */

const getCandidates = (board, row, col) => {
    if (board[row][col] !== '') {
        return [];
    }

    let candidates = [];

    for (let number = 1; number <= 9; number++) {
        if (isValidPlacement(board, row, col, number)) {
            candidates.push(number);
        }
    }

    return candidates;
};

const buildCandidateBoard = (board) => {
    let candidateBoard = [];

    for (let row = 0; row < 9; row++) {
        candidateBoard[row] = [];

        for (let col = 0; col < 9; col++) {
            candidateBoard[row][col] = getCandidates(board, row, col);
        }
    }

    return candidateBoard;
};

const applyNakedSingles = (board) => {
    let placedAny = false;

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === '') {
                let candidates = getCandidates(board, row, col);

                if (candidates.length === 1) {
                    board[row][col] = candidates[0];
                    placedAny = true;
                }
            }
        }
    }

    return placedAny;
};

const applyHiddenSinglesRow = (board) => {
    let placedAny = false;

    for (let row = 0; row < 9; row++) {
        let candidateMap = {
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: [],
            7: [],
            8: [],
            9: []
        };

        for (let col = 0; col < 9; col++) {
            if (board[row][col] === '') {
                let candidates = getCandidates(board, row, col);

                for (let i = 0; i < candidates.length; i++) {
                    let number = candidates[i];
                    candidateMap[number].push({ row: row, col: col });
                }
            }
        }

        for (let number = 1; number <= 9; number++) {
            if (candidateMap[number].length === 1) {
                let onlySpot = candidateMap[number][0];
                board[onlySpot.row][onlySpot.col] = number;
                placedAny = true;
            }
        }
    }

    return placedAny;
};

const applyHiddenSinglesCol = (board) => {
    let placedAny = false;

    for (let col = 0; col < 9; col++) {
        let candidateMap = {
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: [],
            7: [],
            8: [],
            9: []
        };

        for (let row = 0; row < 9; row++) {
            if (board[row][col] === '') {
                let candidates = getCandidates(board, row, col);

                for (let i = 0; i < candidates.length; i++) {
                    let number = candidates[i];
                    candidateMap[number].push({ row: row, col: col });
                }
            }
        }

        for (let number = 1; number <= 9; number++) {
            if (candidateMap[number].length === 1) {
                let onlySpot = candidateMap[number][0];
                board[onlySpot.row][onlySpot.col] = number;
                placedAny = true;
            }
        }
    }

    return placedAny;
};

const applyHiddenSinglesBox = (board) => {
    let placedAny = false;

    for (let boxRow = 0; boxRow < 9; boxRow += 3) {
        for (let boxCol = 0; boxCol < 9; boxCol += 3) {
            let candidateMap = {
                1: [],
                2: [],
                3: [],
                4: [],
                5: [],
                6: [],
                7: [],
                8: [],
                9: []
            };

            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    let row = boxRow + r;
                    let col = boxCol + c;

                    if (board[row][col] === '') {
                        let candidates = getCandidates(board, row, col);

                        for (let i = 0; i < candidates.length; i++) {
                            let number = candidates[i];
                            candidateMap[number].push({ row: row, col: col });
                        }
                    }
                }
            }

            for (let number = 1; number <= 9; number++) {
                if (candidateMap[number].length === 1) {
                    let onlySpot = candidateMap[number][0];
                    board[onlySpot.row][onlySpot.col] = number;
                    placedAny = true;
                }
            }
        }
    }

    return placedAny;
};

const applyHiddenSingles = (board) => {
    let placedAny = false;

    if (applyHiddenSinglesRow(board)) {
        placedAny = true;
    }

    if (applyHiddenSinglesCol(board)) {
        placedAny = true;
    }

    if (applyHiddenSinglesBox(board)) {
        placedAny = true;
    }

    return placedAny;
};

const applyLockedCandidatesPointing = (board) => {
    let changed = false;
    let candidateBoard = buildCandidateBoard(board);

    for (let boxRow = 0; boxRow < 9; boxRow += 3) {
        for (let boxCol = 0; boxCol < 9; boxCol += 3) {
            for (let number = 1; number <= 9; number++) {
                let positions = [];

                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        let row = boxRow + r;
                        let col = boxCol + c;

                        if (board[row][col] === '') {
                            if (candidateBoard[row][col].includes(number)) {
                                positions.push({ row: row, col: col });
                            }
                        }
                    }
                }

                if (positions.length < 2) {
                    continue;
                }

                let sameRow = true;
                let sameCol = true;
                let firstRow = positions[0].row;
                let firstCol = positions[0].col;

                for (let i = 1; i < positions.length; i++) {
                    if (positions[i].row !== firstRow) {
                        sameRow = false;
                    }

                    if (positions[i].col !== firstCol) {
                        sameCol = false;
                    }
                }

                if (sameRow) {
                    let targetRow = firstRow;

                    for (let col = 0; col < 9; col++) {
                        if (col < boxCol || col > boxCol + 2) {
                            if (board[targetRow][col] === '') {
                                let candidates = candidateBoard[targetRow][col];

                                if (candidates.includes(number)) {
                                    let newCandidates = candidates.filter(function (value) {
                                        return value !== number;
                                    });

                                    if (newCandidates.length === 1) {
                                        board[targetRow][col] = newCandidates[0];
                                        changed = true;
                                    }
                                }
                            }
                        }
                    }
                }

                if (sameCol) {
                    let targetCol = firstCol;

                    for (let row = 0; row < 9; row++) {
                        if (row < boxRow || row > boxRow + 2) {
                            if (board[row][targetCol] === '') {
                                let candidates = candidateBoard[row][targetCol];

                                if (candidates.includes(number)) {
                                    let newCandidates = candidates.filter(function (value) {
                                        return value !== number;
                                    });

                                    if (newCandidates.length === 1) {
                                        board[row][targetCol] = newCandidates[0];
                                        changed = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return changed;
};

const applyLockedCandidatesClaimingRow = (board) => {
    let changed = false;
    let candidateBoard = buildCandidateBoard(board);

    for (let row = 0; row < 9; row++) {
        for (let number = 1; number <= 9; number++) {
            let positions = [];

            for (let col = 0; col < 9; col++) {
                if (board[row][col] === '') {
                    if (candidateBoard[row][col].includes(number)) {
                        positions.push({ row: row, col: col });
                    }
                }
            }

            if (positions.length < 2) {
                continue;
            }

            let firstBox = Math.floor(positions[0].col / 3);
            let sameBox = true;

            for (let i = 1; i < positions.length; i++) {
                if (Math.floor(positions[i].col / 3) !== firstBox) {
                    sameBox = false;
                }
            }

            if (sameBox) {
                let boxRow = Math.floor(row / 3) * 3;
                let boxCol = firstBox * 3;

                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        let targetRow = boxRow + r;
                        let targetCol = boxCol + c;

                        if (targetRow !== row && board[targetRow][targetCol] === '') {
                            let candidates = candidateBoard[targetRow][targetCol];

                            if (candidates.includes(number)) {
                                let newCandidates = candidates.filter(function (value) {
                                    return value !== number;
                                });

                                if (newCandidates.length === 1) {
                                    board[targetRow][targetCol] = newCandidates[0];
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return changed;
};

const applyLockedCandidatesClaimingCol = (board) => {
    let changed = false;
    let candidateBoard = buildCandidateBoard(board);

    for (let col = 0; col < 9; col++) {
        for (let number = 1; number <= 9; number++) {
            let positions = [];

            for (let row = 0; row < 9; row++) {
                if (board[row][col] === '') {
                    if (candidateBoard[row][col].includes(number)) {
                        positions.push({ row: row, col: col });
                    }
                }
            }

            if (positions.length < 2) {
                continue;
            }

            let firstBox = Math.floor(positions[0].row / 3);
            let sameBox = true;

            for (let i = 1; i < positions.length; i++) {
                if (Math.floor(positions[i].row / 3) !== firstBox) {
                    sameBox = false;
                }
            }

            if (sameBox) {
                let boxRow = firstBox * 3;
                let boxCol = Math.floor(col / 3) * 3;

                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        let targetRow = boxRow + r;
                        let targetCol = boxCol + c;

                        if (targetCol !== col && board[targetRow][targetCol] === '') {
                            let candidates = candidateBoard[targetRow][targetCol];

                            if (candidates.includes(number)) {
                                let newCandidates = candidates.filter(function (value) {
                                    return value !== number;
                                });

                                if (newCandidates.length === 1) {
                                    board[targetRow][targetCol] = newCandidates[0];
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return changed;
};

const applyLockedCandidates = (board) => {
    let changed = false;

    if (applyLockedCandidatesPointing(board)) {
        changed = true;
    }

    if (applyLockedCandidatesClaimingRow(board)) {
        changed = true;
    }

    if (applyLockedCandidatesClaimingCol(board)) {
        changed = true;
    }

    return changed;
};

const getRowPairMap = (candidateBoard, row) => {
    let pairMap = {};

    for (let col = 0; col < 9; col++) {
        let candidates = candidateBoard[row][col];

        if (candidates.length === 2) {
            let key = candidates.slice().sort(function (a, b) {
                return a - b;
            }).join(',');

            if (pairMap[key] === undefined) {
                pairMap[key] = [];
            }

            pairMap[key].push({ row: row, col: col });
        }
    }

    return pairMap;
};

const getColPairMap = (candidateBoard, col) => {
    let pairMap = {};

    for (let row = 0; row < 9; row++) {
        let candidates = candidateBoard[row][col];

        if (candidates.length === 2) {
            let key = candidates.slice().sort(function (a, b) {
                return a - b;
            }).join(',');

            if (pairMap[key] === undefined) {
                pairMap[key] = [];
            }

            pairMap[key].push({ row: row, col: col });
        }
    }

    return pairMap;
};

const getBoxPairMap = (candidateBoard, boxRow, boxCol) => {
    let pairMap = {};

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            let row = boxRow + r;
            let col = boxCol + c;
            let candidates = candidateBoard[row][col];

            if (candidates.length === 2) {
                let key = candidates.slice().sort(function (a, b) {
                    return a - b;
                }).join(',');

                if (pairMap[key] === undefined) {
                    pairMap[key] = [];
                }

                pairMap[key].push({ row: row, col: col });
            }
        }
    }

    return pairMap;
};

const applyNakedPairsRow = (board) => {
    let changed = false;
    let candidateBoard = buildCandidateBoard(board);

    for (let row = 0; row < 9; row++) {
        let pairMap = getRowPairMap(candidateBoard, row);
        let pairKeys = Object.keys(pairMap);

        for (let i = 0; i < pairKeys.length; i++) {
            let key = pairKeys[i];
            let pairCells = pairMap[key];

            if (pairCells.length === 2) {
                let pairNumbers = key.split(',').map(Number);

                for (let col = 0; col < 9; col++) {
                    let isPairCell = false;

                    for (let j = 0; j < pairCells.length; j++) {
                        if (pairCells[j].col === col) {
                            isPairCell = true;
                        }
                    }

                    if (!isPairCell && board[row][col] === '') {
                        let candidates = candidateBoard[row][col];
                        let newCandidates = candidates.filter(function (value) {
                            return value !== pairNumbers[0] && value !== pairNumbers[1];
                        });

                        if (newCandidates.length !== candidates.length) {
                            if (newCandidates.length === 1) {
                                board[row][col] = newCandidates[0];
                                changed = true;
                            }
                        }
                    }
                }
            }
        }
    }

    return changed;
};

const applyNakedPairsCol = (board) => {
    let changed = false;
    let candidateBoard = buildCandidateBoard(board);

    for (let col = 0; col < 9; col++) {
        let pairMap = getColPairMap(candidateBoard, col);
        let pairKeys = Object.keys(pairMap);

        for (let i = 0; i < pairKeys.length; i++) {
            let key = pairKeys[i];
            let pairCells = pairMap[key];

            if (pairCells.length === 2) {
                let pairNumbers = key.split(',').map(Number);

                for (let row = 0; row < 9; row++) {
                    let isPairCell = false;

                    for (let j = 0; j < pairCells.length; j++) {
                        if (pairCells[j].row === row) {
                            isPairCell = true;
                        }
                    }

                    if (!isPairCell && board[row][col] === '') {
                        let candidates = candidateBoard[row][col];
                        let newCandidates = candidates.filter(function (value) {
                            return value !== pairNumbers[0] && value !== pairNumbers[1];
                        });

                        if (newCandidates.length !== candidates.length) {
                            if (newCandidates.length === 1) {
                                board[row][col] = newCandidates[0];
                                changed = true;
                            }
                        }
                    }
                }
            }
        }
    }

    return changed;
};

const applyNakedPairsBox = (board) => {
    let changed = false;
    let candidateBoard = buildCandidateBoard(board);

    for (let boxRow = 0; boxRow < 9; boxRow += 3) {
        for (let boxCol = 0; boxCol < 9; boxCol += 3) {
            let pairMap = getBoxPairMap(candidateBoard, boxRow, boxCol);
            let pairKeys = Object.keys(pairMap);

            for (let i = 0; i < pairKeys.length; i++) {
                let key = pairKeys[i];
                let pairCells = pairMap[key];

                if (pairCells.length === 2) {
                    let pairNumbers = key.split(',').map(Number);

                    for (let r = 0; r < 3; r++) {
                        for (let c = 0; c < 3; c++) {
                            let row = boxRow + r;
                            let col = boxCol + c;
                            let isPairCell = false;

                            for (let j = 0; j < pairCells.length; j++) {
                                if (pairCells[j].row === row && pairCells[j].col === col) {
                                    isPairCell = true;
                                }
                            }

                            if (!isPairCell && board[row][col] === '') {
                                let candidates = candidateBoard[row][col];
                                let newCandidates = candidates.filter(function (value) {
                                    return value !== pairNumbers[0] && value !== pairNumbers[1];
                                });

                                if (newCandidates.length !== candidates.length) {
                                    if (newCandidates.length === 1) {
                                        board[row][col] = newCandidates[0];
                                        changed = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return changed;
};

const applyNakedPairs = (board) => {
    let changed = false;

    if (applyNakedPairsRow(board)) {
        changed = true;
    }

    if (applyNakedPairsCol(board)) {
        changed = true;
    }

    if (applyNakedPairsBox(board)) {
        changed = true;
    }

    return changed;
};

const solveEasyOnly = (board) => {
    let workingBoard = board.map(function (row) {
        return row.slice();
    });

    let progress = true;

    while (progress) {
        progress = applyNakedSingles(workingBoard);
    }

    return workingBoard;
};

const solveMediumOnly = (board) => {
    let workingBoard = board.map(function (row) {
        return row.slice();
    });

    let progress = true;

    while (progress) {
        progress = false;

        if (applyNakedSingles(workingBoard)) {
            progress = true;
        }

        if (applyHiddenSingles(workingBoard)) {
            progress = true;
        }
    }

    return workingBoard;
};

const solveHardOnly = (board) => {
    let workingBoard = board.map(function (row) {
        return row.slice();
    });

    let progress = true;

    while (progress) {
        progress = false;

        if (applyNakedSingles(workingBoard)) {
            progress = true;
        }

        if (applyHiddenSingles(workingBoard)) {
            progress = true;
        }

        if (applyLockedCandidates(workingBoard)) {
            progress = true;
        }
    }

    return workingBoard;
};

const solveExtremeOnly = (board) => {
    let workingBoard = board.map(function (row) {
        return row.slice();
    });

    let progress = true;

    while (progress) {
        progress = false;

        if (applyNakedSingles(workingBoard)) {
            progress = true;
        }

        if (applyHiddenSingles(workingBoard)) {
            progress = true;
        }

        if (applyLockedCandidates(workingBoard)) {
            progress = true;
        }

        if (applyNakedPairs(workingBoard)) {
            progress = true;
        }
    }

    return workingBoard;
};

const isBoardSolved = (board) => {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === '') {
                return false;
            }
        }
    }

    return true;
};

const isEasyPuzzle = (board) => {
    let easyTest = solveEasyOnly(board);
    return isBoardSolved(easyTest);
};

const isMediumPuzzle = (board) => {
    let easyTest = solveEasyOnly(board);

    if (isBoardSolved(easyTest)) {
        return false;
    }

    let mediumTest = solveMediumOnly(board);
    return isBoardSolved(mediumTest);
};

const isHardPuzzle = (board) => {
    let mediumTest = solveMediumOnly(board);

    if (isBoardSolved(mediumTest)) {
        return false;
    }

    let hardTest = solveHardOnly(board);
    return isBoardSolved(hardTest);
};

const isExtremePuzzle = (board) => {
    let hardTest = solveHardOnly(board);

    if (isBoardSolved(hardTest)) {
        return false;
    }

    let extremeTest = solveExtremeOnly(board);
    return isBoardSolved(extremeTest);
};

// init, creating the visual grid and add functionality + filter
gridGen();
numberFilter();
updateButtons();