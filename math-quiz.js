function createMathQuizModule(config) {
    const {
        maxQuestions,
        winScore,
        correctDelayMs,
        wrongDelayMs,
        feedback,
        mathProblem,
        mathOptionsContainer,
        wrongLogContainer,
        onStatsChange,
        onGameEnd
    } = config;

    let totalQuestions = 0;
    let score = 0;
    let gameEnded = false;
    let currentQuestion = null;
    let wrongAnswersLog = [];
    let advanceTimeoutId = null;
    let active = false;

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

    function buildMathQuestion() {
        const operators = ["*", "/"];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        const factor = 2;

        if (operator === "*") {
            const number = Math.floor(Math.random() * 10) + 1;
            return {
                text: `${number} × ${factor} = ?`,
                answer: number * factor
            };
        }

        const quotient = Math.floor(Math.random() * 10) + 1;
        const dividend = quotient * factor;

        return {
            text: `${dividend} ÷ ${factor} = ?`,
            answer: quotient
        };
    }

    function shuffle(array) {
        const copy = [...array];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function buildAnswerOptions(correctAnswer) {
        const optionsSet = new Set([correctAnswer]);

        while (optionsSet.size < 4) {
            const delta = Math.floor(Math.random() * 7) - 3;
            const candidate = correctAnswer + delta;

            if (delta !== 0 && candidate > 0 && candidate <= 20) {
                optionsSet.add(candidate);
            }
        }

        return shuffle([...optionsSet]);
    }

    function lockOptions() {
        const buttons = mathOptionsContainer.querySelectorAll("button");
        buttons.forEach((button) => {
            button.disabled = true;
        });
    }

    function renderOptions(question) {
        const options = buildAnswerOptions(question.answer);
        mathOptionsContainer.innerHTML = "";

        options.forEach((optionValue) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "option-btn";
            button.textContent = String(optionValue);
            button.dataset.value = String(optionValue);

            button.addEventListener("click", () => handleAnswer(button, optionValue));
            mathOptionsContainer.appendChild(button);
        });
    }

    function endGame() {
        gameEnded = true;
        clearAdvanceTimeout();
        if (score >= winScore) {
            feedback.textContent = `נִיצַּחְתָּ בְּחֶשְׁבּוֹן! עָנִיתָ נָכוֹן עַל ${score} מִתּוֹךְ ${maxQuestions}.`;
        } else {
            feedback.textContent = `סִיּוּם חֶשְׁבּוֹן: ${score} נְכוֹנוֹת מִתּוֹךְ ${maxQuestions}.`;
        }

        if (onGameEnd) {
            onGameEnd({
                didWin: score >= winScore,
                score,
                maxQuestions,
                wrongCount: wrongAnswersLog.length
            });
        }
        lockOptions();
    }

    function nextRound() {
        if (!active || gameEnded) {
            return;
        }

        const question = buildMathQuestion();
        currentQuestion = question;
        mathProblem.textContent = question.text;
        feedback.textContent = "";
        renderOptions(question);
    }

    function handleAnswer(button, selectedValue) {
        if (!active || gameEnded) {
            return;
        }

        if (!currentQuestion) {
            return;
        }

        totalQuestions += 1;
        lockOptions();
        let nextDelay = wrongDelayMs;

        if (selectedValue === currentQuestion.answer) {
            score += 1;
            button.classList.add("correct");
            feedback.textContent = "נָכוֹן!";
            nextDelay = correctDelayMs;
        } else {
            button.classList.add("wrong");
            feedback.textContent = `לֹא נָכוֹן. הַתְּשׁוּבָה הַנְּכוֹנָה הִיא: ${currentQuestion.answer}`;
            wrongAnswersLog.push({
                question: currentQuestion.text,
                correctAnswer: String(currentQuestion.answer),
                userAnswer: String(selectedValue)
            });

            const buttons = mathOptionsContainer.querySelectorAll("button");
            buttons.forEach((btn) => {
                if (Number(btn.dataset.value) === currentQuestion.answer) {
                    btn.classList.add("correct");
                }
            });
        }

        notifyStatsChange();
        renderWrongAnswersLog();

        if (totalQuestions >= maxQuestions) {
            endGame();
            return;
        }

        scheduleAction(nextRound, nextDelay);
    }

    function activate() {
        active = true;
        notifyStatsChange();
        renderWrongAnswersLog();
        if (gameEnded || currentQuestion === null) {
            nextRound();
            return;
        }
    }

    function deactivate() {
        active = false;
        clearAdvanceTimeout();
        lockOptions();
    }

    function restart() {
        clearAdvanceTimeout();
        totalQuestions = 0;
        score = 0;
        gameEnded = false;
        currentQuestion = null;
        wrongAnswersLog = [];
        mathProblem.textContent = "";
        mathOptionsContainer.innerHTML = "";

        notifyStatsChange();
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

    return {
        activate,
        deactivate,
        restart,
        getStats
    };
}

window.createMathQuizModule = createMathQuizModule;
