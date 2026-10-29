function createWordQuizModule(config) {
    const {
        allEntries,
        maxQuestions,
        winScore,
        correctDelayMs,
        wrongDelayMs,
        quizImage,
        optionsContainer,
        feedback,
        wordScoresContainer,
        wrongLogContainer,
        onStatsChange,
        onGameEnd
    } = config;

    let roundPool = [...allEntries];
    let currentCorrectWord = "";
    let totalQuestions = 0;
    let score = 0;
    let gameEnded = false;
    let wordScores = createWordScores();
    let wrongAnswersLog = [];
    let advanceTimeoutId = null;
    let active = false;

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

    function renderWrongAnswersLog() {
        if (!wrongLogContainer) {
            return;
        }

        if (wrongAnswersLog.length === 0) {
            wrongLogContainer.textContent = "אין טעויות עדיין.";
            return;
        }

        wrongLogContainer.innerHTML = wrongAnswersLog
            .map((entry) => `
                <div class="wrong-log-item">
                    <strong>שאלה:</strong> ${entry.question}<br>
                    <strong>התשובה הנכונה:</strong> ${entry.correctAnswer}<br>
                    <strong>התשובה שלך:</strong> ${entry.userAnswer}
                </div>
            `)
            .join("");
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

    function clearAdvanceTimeout() {
        if (advanceTimeoutId !== null) {
            clearTimeout(advanceTimeoutId);
            advanceTimeoutId = null;
        }
    }

    function scheduleAction(action, delay) {
        clearAdvanceTimeout();
        advanceTimeoutId = setTimeout(() => {
            advanceTimeoutId = null;
            action();
        }, delay);
    }

    function notifyStatsChange() {
        onStatsChange({
            score,
            remaining: maxQuestions - totalQuestions,
            totalQuestions,
            maxQuestions
        });
    }

    function endGame() {
        gameEnded = true;
        clearAdvanceTimeout();

        if (score >= winScore) {
            feedback.textContent = `נִיצַּחְתָּ! עָנִיתָ נָכוֹן עַל ${score} מִתּוֹךְ ${maxQuestions}.`;
        } else {
            feedback.textContent = `הִפְסַדְתָּ. עָנִיתָ נָכוֹן עַל ${score} מִתּוֹךְ ${maxQuestions}.`;
        }

        if (onGameEnd) {
            onGameEnd({
                didWin: score >= winScore,
                score,
                maxQuestions,
                wrongCount: wrongAnswersLog.length
            });
        }
    }

    function handleAnswer(button, selectedWord) {
        if (gameEnded || !active) {
            return;
        }

        totalQuestions += 1;
        let nextDelay = wrongDelayMs;

        if (selectedWord === currentCorrectWord) {
            score += 1;
            wordScores[currentCorrectWord].correct += 1;
            button.classList.add("correct");
            feedback.textContent = "נָכוֹן!";
            nextDelay = correctDelayMs;
        } else {
            wordScores[currentCorrectWord].wrong += 1;
            button.classList.add("wrong");
            feedback.textContent = `לֹא נָכוֹן. הַתְּשׁוּבָה הַנְּכוֹנָה הִיא: ${currentCorrectWord}`;
            wrongAnswersLog.push({
                question: currentCorrectWord,
                correctAnswer: currentCorrectWord,
                userAnswer: selectedWord
            });

            const buttons = optionsContainer.querySelectorAll("button");
            buttons.forEach((btn) => {
                if (btn.dataset.word === currentCorrectWord) {
                    btn.classList.add("correct");
                }
            });
        }

        notifyStatsChange();
        renderWordScores();
        renderWrongAnswersLog();
        lockOptions();

        if (totalQuestions >= maxQuestions) {
            endGame();
            return;
        }

        scheduleAction(nextRound, nextDelay);
    }

    function nextRound() {
        if (gameEnded || !active) {
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
    }

    function activate() {
        active = true;
        notifyStatsChange();
        renderWrongAnswersLog();
        if (!currentCorrectWord && !gameEnded) {
            nextRound();
        }
    }

    function deactivate() {
        active = false;
        clearAdvanceTimeout();
    }

    function restart() {
        clearAdvanceTimeout();
        roundPool = [...allEntries];
        currentCorrectWord = "";
        totalQuestions = 0;
        score = 0;
        gameEnded = false;
        wordScores = createWordScores();
        wrongAnswersLog = [];

        notifyStatsChange();
        renderWordScores();
        renderWrongAnswersLog();

        if (onGameEnd) {
            onGameEnd(null);
        }

        if (active) {
            nextRound();
        }
    }

    function getStats() {
        return {
            score,
            remaining: maxQuestions - totalQuestions,
            totalQuestions,
            maxQuestions
        };
    }

    renderWordScores();
    renderWrongAnswersLog();

    return {
        activate,
        deactivate,
        restart,
        getStats
    };
}

window.createWordQuizModule = createWordQuizModule;
