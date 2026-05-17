const concepts = [
  {
    term: "Climate Change",
    detail: "Long-term changes in global weather patterns and temperatures.",
    sprite: 0,
  },
  {
    term: "Global Warming",
    detail: "The increase in Earth's average temperature caused mainly by human activities.",
    sprite: 1,
  },
  {
    term: "Greenhouse Gases (GHG)",
    detail: "Heat-trapping gases such as carbon dioxide and methane.",
    sprite: 2,
  },
  {
    term: "Carbon Footprint",
    detail: "The total emissions caused by a person, product, or organisation.",
    sprite: 3,
  },
  {
    term: "Recycling",
    detail: "Turning waste into reusable materials to reduce pollution and landfill.",
    sprite: 4,
  },
  {
    term: "Sustainability",
    detail: "Using resources responsibly so future generations can thrive.",
    sprite: 5,
  },
  {
    term: "Renewable Energy",
    detail: "Energy from natural sources like solar, wind, and hydropower.",
    sprite: 6,
  },
  {
    term: "Energy Efficiency",
    detail: "Using less energy while achieving the same outcome.",
    sprite: 7,
  },
  {
    term: "Electric Vehicle (EV)",
    detail: "A vehicle powered by electricity instead of petrol or diesel.",
    sprite: 8,
  },
  {
    term: "Deforestation",
    detail: "The clearing of forests, which increases emissions and harms ecosystems.",
    sprite: 9,
  },
  {
    term: "Biodiversity",
    detail: "The variety of plants, animals, and ecosystems that support life on Earth.",
    sprite: 10,
  },
  {
    term: "Climate Adaptation",
    detail: "Preparing communities and systems for climate impacts like floods and heatwaves.",
    sprite: 11,
  },
  {
    term: "Decarbonisation",
    detail: "Reducing carbon emissions across sectors and industries.",
    sprite: 12,
  },
  {
    term: "Net Zero",
    detail: "Balancing emissions produced with emissions removed from the atmosphere.",
    sprite: 13,
  },
  {
    term: "Carbon Credit",
    detail: "A certificate representing one tonne of emissions reduced or removed.",
    sprite: 14,
  },
  {
    term: "Carbon Market",
    detail: "A trading system where carbon credits are bought and sold to support emissions reduction.",
    sprite: 15,
  },
];

const modeSettings = {
  easy: { pairs: 4 },
  medium: { pairs: 8 },
  hard: { pairs: 16 },
};

const CARD_ASPECT = 2 / 3;

const board = document.querySelector("#board");
const movesEl = document.querySelector("#moves");
const matchesEl = document.querySelector("#matches");
const totalPairsEl = document.querySelector("#totalPairs");
const winMessage = document.querySelector("#winMessage");
const resetButton = document.querySelector("#reset");
const gameMenuButton = document.querySelector("#gameMenuButton");
const gameMenuList = document.querySelector("#gameMenuList");
const modeInputs = [...document.querySelectorAll("input[name='mode']")];

let deck = [];
let openCards = [];
let lockBoard = false;
let moves = 0;
let matches = 0;
let currentMode = "easy";

function shuffle(items) {
  return items
    .map((item) => ({ item, sort: crypto.getRandomValues(new Uint32Array(1))[0] }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function makeDeck(mode) {
  const selection = concepts.slice(0, modeSettings[mode].pairs);
  return shuffle(
    selection.flatMap((concept, index) => [
      { id: `${index}-art`, pairId: index, type: "art", concept },
      { id: `${index}-term`, pairId: index, type: "term", concept },
    ]),
  );
}

function gridForMode(mode) {
  const cardCount = modeSettings[mode].pairs * 2;
  const boardRect = board.parentElement.getBoundingClientRect();
  const style = getComputedStyle(board);
  const gap = Number.parseFloat(style.columnGap) || 10;
  const availableWidth = Math.max(1, boardRect.width);
  const availableHeight = Math.max(1, boardRect.height);

  let best = null;

  for (let cols = 2; cols <= cardCount; cols += 1) {
    const rows = Math.ceil(cardCount / cols);
    const emptySlots = cols * rows - cardCount;
    if (emptySlots > Math.max(2, cols - 1)) {
      continue;
    }

    const gapX = gap * (cols - 1);
    const gapY = gap * (rows - 1);
    const cardHeight = Math.min(
      (availableHeight - gapY) / rows,
      (availableWidth - gapX) / (cols * CARD_ASPECT),
    );

    if (cardHeight <= 0) {
      continue;
    }

    const cardWidth = cardHeight * CARD_ASPECT;
    const width = cols * cardWidth + gapX;
    const height = rows * cardHeight + gapY;
    const fill = (width * height) / (availableWidth * availableHeight);
    const cardArea = cardWidth * cardHeight;
    const score = cardArea * 1000 + fill * 12 - emptySlots * cardArea * 0.08;

    if (!best || score > best.score) {
      best = { cols, rows, width, height, score };
    }
  }

  return best || { cols: 4, rows: Math.ceil(cardCount / 4), width: availableWidth, height: availableHeight };
}

function setBoardGrid(mode) {
  const { cols, rows, width, height } = gridForMode(mode);
  board.style.setProperty("--cols", cols);
  board.style.setProperty("--rows", rows);
  board.style.setProperty("--board-ratio", width && height ? `${width} / ${height}` : `${cols * CARD_ASPECT} / ${rows}`);
  board.style.width = `${Math.floor(width)}px`;
  board.style.height = `${Math.floor(height)}px`;
  board.dataset.mode = mode;
}

function renderCard(card) {
  const conceptImage = `assets/concepts/concept-${String(card.concept.sprite).padStart(2, "0")}.png`;
  const button = document.createElement("button");
  button.className = "card";
  button.type = "button";
  button.dataset.pairId = card.pairId;
  button.dataset.cardId = card.id;
  button.setAttribute(
    "aria-label",
    card.type === "art"
      ? `Picture card for ${card.concept.term}`
      : `Term card: ${card.concept.term}`,
  );

  const content =
    card.type === "art"
      ? `<span class="art-card">
          <img class="art" src="${conceptImage}" alt="" aria-hidden="true" draggable="false">
          <span class="art-label">${card.concept.term}</span>
        </span>`
      : `<span class="definition-card">
          <span class="term-title">${card.concept.term}</span>
          <span class="term-description">${card.concept.detail}</span>
        </span>`;

  button.innerHTML = `
    <span class="card-inner">
      <span class="card-face card-back" aria-hidden="true"></span>
      <span class="card-face card-front">${content}</span>
    </span>
  `;

  button.addEventListener("click", () => handleCardClick(button));
  return button;
}

function updateStats() {
  movesEl.textContent = moves;
  matchesEl.textContent = matches;
  totalPairsEl.textContent = modeSettings[currentMode].pairs;
}

function startGame(mode = currentMode) {
  currentMode = mode;
  deck = makeDeck(mode);
  openCards = [];
  lockBoard = false;
  moves = 0;
  matches = 0;
  winMessage.textContent = "";
  winMessage.classList.remove("show");
  setBoardGrid(mode);
  board.replaceChildren(...deck.map(renderCard));
  updateStats();
}

function handleCardClick(card) {
  if (lockBoard || card.classList.contains("is-flipped") || card.classList.contains("is-matched")) {
    return;
  }

  card.classList.add("is-flipped");
  openCards.push(card);

  if (openCards.length !== 2) {
    return;
  }

  moves += 1;
  updateStats();
  lockBoard = true;

  const [first, second] = openCards;
  const isMatch = first.dataset.pairId === second.dataset.pairId;

  if (isMatch) {
    first.classList.add("is-matched");
    second.classList.add("is-matched");
    matches += 1;
    openCards = [];
    lockBoard = false;
    updateStats();
    announceWinIfComplete();
    return;
  }

  setTimeout(() => {
    first.classList.remove("is-flipped");
    second.classList.remove("is-flipped");
    openCards = [];
    lockBoard = false;
  }, 780);
}

function announceWinIfComplete() {
  if (matches !== modeSettings[currentMode].pairs) {
    return;
  }

  winMessage.textContent = `Nice matchwork: ${matches} climate concepts learned in ${moves} moves.`;
  winMessage.classList.add("show");
}

modeInputs.forEach((input) => {
  input.addEventListener("change", () => startGame(input.value));
});

function closeGameMenu() {
  gameMenuList.hidden = true;
  gameMenuButton.setAttribute("aria-expanded", "false");
}

gameMenuButton.addEventListener("click", () => {
  const isOpen = gameMenuButton.getAttribute("aria-expanded") === "true";
  gameMenuList.hidden = isOpen;
  gameMenuButton.setAttribute("aria-expanded", String(!isOpen));
});

gameMenuList.addEventListener("click", closeGameMenu);

document.addEventListener("click", (event) => {
  if (!event.target.closest(".game-menu")) {
    closeGameMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeGameMenu();
    gameMenuButton.blur();
  }
});

resetButton.addEventListener("click", () => startGame());
addEventListener("resize", () => setBoardGrid(currentMode));

startGame();
