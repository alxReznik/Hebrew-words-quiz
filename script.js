const allEntries = Object.entries(images);
const MAX_QUESTIONS = 25;
const WIN_SCORE = 20;

if (allEntries.length < 4) {
    throw new Error("At least 4 words are required for this quiz.");
}

let roundPool = [...allEntries];
let currentCorrectWord = "";
let totalQuestions = 0;
let score = 0;
let gameEnded = false;
let wordScores = createWordScores();

const quizImage = document.getElementById("quiz-image");
const optionsContainer = document.getElementById("options");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("next-btn");
const scoreLabel = document.getElementById("score");
const restartBtn = document.getElementById("restart-btn");
const wordScoresContainer = document.getElementById("word-scores");

function createWordScores() {
    const scores = {};
    allEntries.forEach(([word]) => {
        scores[word] = { correct: 0, wrong: 0 };
    });
    return scores;
}

function renderWordScores() {
    if (!wordScoresContainer) {
        return;
    }

    const rows = allEntries.map(([word]) => {
        const stats = wordScores[word];
        return `<div class="word-score-row"><span>${word}</span><span>נָכוֹן: ${stats.correct} | לֹא נָכוֹן: ${stats.wrong}</span></div>`;
    });

    wordScoresContainer.innerHTML = rows.join("");
}

function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function pickRandomEntry(pool) {
    const index = Math.floor(Math.random() * pool.length);
    return { entry: pool[index], index };
}

function updateScore() {
    scoreLabel.textContent = `נִיקּוּד: ${score} | שְׁאֵלָה ${totalQuestions} / ${MAX_QUESTIONS}`;
}

function endGame() {
    gameEnded = true;
    nextBtn.hidden = true;

    if (score >= WIN_SCORE) {
        feedback.textContent = `נִיצַּחְתָּ! עָנִיתָ נָכוֹן עַל ${score} מִתּוֹךְ ${MAX_QUESTIONS}.`;
    } else {
        feedback.textContent = `הִפְסַדְתָּ. עָנִיתָ נָכוֹן עַל ${score} מִתּוֹךְ ${MAX_QUESTIONS}.`;
    }
}

function buildOptions(correctWord) {
    const wrongWords = allEntries
        .map(([word]) => word)
        .filter((word) => word !== correctWord);

    const selectedWrong = shuffle(wrongWords).slice(0, 3);
    return shuffle([correctWord, ...selectedWrong]);
}

function lockOptions() {
    const buttons = optionsContainer.querySelectorAll("button");
    buttons.forEach((button) => {
        button.disabled = true;
    });
}

function handleAnswer(button, selectedWord) {
    if (gameEnded) {
        return;
    }

    totalQuestions += 1;

    if (selectedWord === currentCorrectWord) {
        score += 1;
        wordScores[currentCorrectWord].correct += 1;
        button.classList.add("correct");
        feedback.textContent = "נָכוֹן!";
    } else {
        wordScores[currentCorrectWord].wrong += 1;
        button.classList.add("wrong");
        feedback.textContent = `לֹא נָכוֹן. הַתְּשׁוּבָה הַנְּכוֹנָה הִיא: ${currentCorrectWord}`;

        const buttons = optionsContainer.querySelectorAll("button");
        buttons.forEach((btn) => {
            if (btn.dataset.word === currentCorrectWord) {
                btn.classList.add("correct");
            }
        });
    }

    updateScore();
    renderWordScores();
    lockOptions();

    if (totalQuestions >= MAX_QUESTIONS) {
        endGame();
        return;
    }

    nextBtn.hidden = false;
}

function nextRound() {
    if (gameEnded) {
        return;
    }

    if (roundPool.length === 0) {
        roundPool = [...allEntries];
    }

    const { entry, index } = pickRandomEntry(roundPool);
    roundPool.splice(index, 1);

    const [word, imageUrl] = entry;
    currentCorrectWord = word;
    quizImage.src = imageUrl;

    const options = buildOptions(word);
    optionsContainer.innerHTML = "";

    options.forEach((optionWord) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = optionWord;
        button.className = "option-btn";
        button.dataset.word = optionWord;

        button.addEventListener("click", () => handleAnswer(button, optionWord));
        optionsContainer.appendChild(button);
    });

    feedback.textContent = "";
    nextBtn.hidden = true;
}

function restartGame() {
    roundPool = [...allEntries];
    currentCorrectWord = "";
    totalQuestions = 0;
    score = 0;
    gameEnded = false;
    wordScores = createWordScores();

    updateScore();
    renderWordScores();
    nextRound();
}

nextBtn.addEventListener("click", nextRound);
restartBtn.addEventListener("click", restartGame);
updateScore();
renderWordScores();
nextRound();
