const MAX_QUESTIONS = 100;
const WIN_SCORE = 95;
const CORRECT_DELAY_MS = 1000;
const WRONG_DELAY_MS = 5000;
const MAX_MATH_QUESTIONS = 100;
const MATH_CORRECT_DELAY_MS = 1000;
const MATH_WRONG_DELAY_MS = 5000;

const allEntries = Object.entries(images);
if (allEntries.length < 4) {
    throw new Error("At least 4 words are required for this quiz.");
}

const quizImage = document.getElementById("quiz-image");
const optionsContainer = document.getElementById("options");
const feedback = document.getElementById("feedback");
const scoreLabel = document.getElementById("score");
const restartBtn = document.getElementById("restart-btn");
const wordScoresContainer = document.getElementById("word-scores");
const appTitle = document.getElementById("app-title");
const mathToggleBtn = document.getElementById("math-toggle-btn");
const wordsSection = document.getElementById("words-section");
const mathSection = document.getElementById("math-section");
const mathProblem = document.getElementById("math-problem");
const mathOptionsContainer = document.getElementById("math-options");

let currentMode = "words";

const wordQuiz = window.createWordQuizModule({
    allEntries,
    maxQuestions: MAX_QUESTIONS,
    winScore: WIN_SCORE,
    correctDelayMs: CORRECT_DELAY_MS,
    wrongDelayMs: WRONG_DELAY_MS,
    quizImage,
    optionsContainer,
    feedback,
    wordScoresContainer,
    onStatsChange: (stats) => {
        if (currentMode !== "words") {
            return;
        }

        scoreLabel.textContent = `נִיקּוּד: ${stats.score} | נוֹתְרוּ שְׁאֵלוֹת: ${stats.remaining}`;
    }
});

const mathQuiz = window.createMathQuizModule({
    maxQuestions: MAX_MATH_QUESTIONS,
    correctDelayMs: MATH_CORRECT_DELAY_MS,
    wrongDelayMs: MATH_WRONG_DELAY_MS,
    feedback,
    mathProblem,
    mathOptionsContainer,
    onStatsChange: (stats) => {
        if (currentMode !== "math") {
            return;
        }

        scoreLabel.textContent = `נִיקּוּד: ${stats.score} | נוֹתְרוּ תַּרְגִּילִים: ${stats.remaining}`;
    }
});

function setMode(mode) {
    currentMode = mode;
    feedback.textContent = "";

    if (mode === "math") {
        appTitle.textContent = "תַּרְגּוּל חֶשְׁבּוֹן";
        mathToggleBtn.textContent = "מילים";
        mathToggleBtn.classList.add("active");
        wordsSection.hidden = true;
        mathSection.hidden = false;
        wordQuiz.deactivate();
        mathQuiz.activate();
        return;
    }

    appTitle.textContent = "הַתְאֵם מִלָּה לַתְּמוּנָה";
    mathToggleBtn.textContent = "חשבון";
    mathToggleBtn.classList.remove("active");
    wordsSection.hidden = false;
    mathSection.hidden = true;
    mathQuiz.deactivate();
    wordQuiz.activate();
}

function restartCurrentMode() {
    if (currentMode === "math") {
        mathQuiz.restart();
        return;
    }

    wordQuiz.restart();
}

restartBtn.addEventListener("click", restartCurrentMode);
mathToggleBtn.addEventListener("click", () => {
    const nextMode = currentMode === "words" ? "math" : "words";
    setMode(nextMode);
});

setMode("words");
