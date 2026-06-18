const board = document.querySelector('#board');
const messageEl = document.querySelector('.info-panel p') || document.querySelector('.info-panel');

let validWords = new Set();
let secretWord = '';
let currentRow = 0;
let currentCol = 0;
let currentGuess = '';
let isGameOver = false;

async function loadWords() {
  if (typeof window.loadValidWords === 'function') {
    await window.loadValidWords();
  }

  validWords = new Set((window.validWords || []).map(word => word.toLowerCase()));

  // Gør også targetWords gyldige som gæt
  if (window.targetWords) {
    window.targetWords.forEach(word => {
      validWords.add(word.toLowerCase());
    });
  }

  console.log('Loaded valid words:', validWords.size);

  startGame();
}

function chooseSecretWord() {
  const pool = [...new Set(
    (window.targetWords || [])
      .map(word => word.trim().toLowerCase())
      .filter(word => word.length > 0)
      .filter(word => /^[a-zæøå]+$/i.test(word))
  )];

  if (pool.length === 0) {
    showMessage('Der er ingen ord i targetWords.', true);
    isGameOver = true;
    return;
  }

  // Hent tidligere brugte ord fra browseren
  let usedWords = JSON.parse(localStorage.getItem('usedSecretWords')) || [];

  // Fjern brugte ord fra puljen
  let availableWords = pool.filter(word => !usedWords.includes(word));

  // Hvis alle ord er brugt, starter vi forfra
  if (availableWords.length === 0) {
    usedWords = [];
    availableWords = pool;
  }

  // Vælg et tilfældigt ord blandt de tilgængelige
  const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];

  secretWord = randomWord.toUpperCase();

  // Gem ordet som brugt
  usedWords.push(randomWord);
  localStorage.setItem('usedSecretWords', JSON.stringify(usedWords));

  console.log('Secret word:', secretWord);
}

function initBoard() {
  board.innerHTML = '';

  for (let i = 0; i < 6; i++) {
    const row = document.createElement('div');
    row.className = 'row';

    for (let j = 0; j < secretWord.length; j++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      row.appendChild(tile);
    }

    board.appendChild(row);
  }
}

function setTile(letter) {
  board.children[currentRow].children[currentCol].textContent = letter;
}

function clearTile() {
  if (currentCol === 0) return;

  currentCol--;
  currentGuess = currentGuess.slice(0, -1);
  board.children[currentRow].children[currentCol].textContent = '';
}

function isValidWord(word) {
  return validWords.has(word.toLowerCase());
}

function showMessage(text, error = false) {
  messageEl.textContent = text;
  messageEl.style.color = error ? 'red' : 'inherit';
}

function revealGuess() {
  const guess = currentGuess.toUpperCase();
  const row = board.children[currentRow];

  const result = Array(secretWord.length).fill('absent');
  const solution = secretWord.split('');

  // Først tjekkes grønne bogstaver
  guess.split('').forEach((letter, index) => {
    if (letter === solution[index]) {
      result[index] = 'correct';
      solution[index] = null;
    }
  });

  // Derefter tjekkes gule bogstaver
  guess.split('').forEach((letter, index) => {
    if (result[index] !== 'correct') {
      const matchIndex = solution.indexOf(letter);

      if (matchIndex !== -1) {
        result[index] = 'present';
        solution[matchIndex] = null;
      }
    }
  });

  [...row.children].forEach((tile, index) => {
    tile.classList.add(result[index]);
  });

  if (guess === secretWord) {
    showMessage('Du vandt 🎉');
    isGameOver = true;
    return;
  }

  currentRow++;
  currentCol = 0;
  currentGuess = '';

  if (currentRow === 6) {
    showMessage(`Ordet var: ${secretWord}`, true);
    isGameOver = true;
  } else {
    showMessage('Prøv igen.');
  }
}

function submitGuess() {
  if (currentGuess.length !== secretWord.length) {
    showMessage(`Ordet skal være ${secretWord.length} bogstaver.`, true);
    return;
  }

  if (!isValidWord(currentGuess)) {
    showMessage('Ikke et gyldigt ord.', true);
    return;
  }

  revealGuess();
}

function addLetter(letter) {
  if (currentCol >= secretWord.length || isGameOver) return;

  const upperLetter = letter.toUpperCase();
  currentGuess += upperLetter;
  setTile(upperLetter);
  currentCol++;
}

function handleKey(key) {
  if (isGameOver) return;

  if (key === 'ENTER') return submitGuess();
  if (key === 'BACK') return clearTile();

  if (/^[A-ZÆØÅ]$/.test(key)) {
    addLetter(key);
  }
}

window.addEventListener('keydown', event => {
  const key = event.key.toUpperCase();

  if (key === 'ENTER') {
    handleKey('ENTER');
  } else if (key === 'BACKSPACE') {
    handleKey('BACK');
  } else {
    handleKey(key);
  }
});

function startGame() {
  chooseSecretWord();

  if (!secretWord) return;

  initBoard();

  currentRow = 0;
  currentCol = 0;
  currentGuess = '';
  isGameOver = false;

  showMessage(`Skriv dit første gæt på ${secretWord.length} bogstaver.`);
}

window.addEventListener('load', loadWords);
