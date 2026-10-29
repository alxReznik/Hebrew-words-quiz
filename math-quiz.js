function createMathQuizModule(config) {
    const {
        maxQuestions,
        correctDelayMs,
        wrongDelayMs,
        feedback,
        mathProblem,
        mathOptionsContainer,
        onStatsChange
    } = config;

    let totalQuestions = 0;
    let score = 0;
    let gameEnded = false;
    let currentQuestion = null;
    let advanceTimeoutId = null;
    let active = false;

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
        const factor = Math.random() < 0.5 ? 1 : 2;

        if (operator === "*") {
            const number = Math.floor(Math.random() * 10) + 1;
            return {
                text: `${number} × ${factor} = ?`,
                answer: number * factor
            };
        }

        let dividend = Math.floor(Math.random() * 10) + 1;
        if (factor === 2 && dividend % 2 !== 0) {
            dividend = dividend === 10 ? 8 : dividend + 1;
        }

        return {
            text: `${dividend} ÷ ${factor} = ?`,
            answer: dividend / factor
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
        feedback.textContent = `סִיּוּם חֶשְׁבּוֹן: ${score} נְכוֹנוֹת מִתּוֹךְ ${maxQuestions}.`;
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

            const buttons = mathOptionsContainer.querySelectorAll("button");
            buttons.forEach((btn) => {
                if (Number(btn.dataset.value) === currentQuestion.answer) {
                    btn.classList.add("correct");
                }
            });
        }

        notifyStatsChange();

        if (totalQuestions >= maxQuestions) {
            endGame();
            return;
        }

        scheduleAction(nextRound, nextDelay);
    }

    function activate() {
        active = true;
        notifyStatsChange();
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
        mathProblem.textContent = "";
        mathOptionsContainer.innerHTML = "";

        notifyStatsChange();

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
