let quizData = null;
let currentTestId = 1;
let currentQuestionIndex = 0;
let scores = { correct: 0, incorrect: 0, userAnswers: {} }; // Agora guarda a escolha do utilizador

// DOM Elements
const testSelector = document.getElementById('test-selector');
const questionText = document.getElementById('questionText');
const optionsGrid = document.getElementById('optionsGrid');
const currentNum = document.getElementById('currentNum');
const totalNum = document.getElementById('totalNum');
const progressBarFill = document.getElementById('progressBarFill');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const explanationCard = document.getElementById('explanationCard');
const reasonText = document.getElementById('reasonText');
const distractorsText = document.getElementById('distractorsText');
const statusTitle = document.getElementById('statusTitle');
const statusIcon = document.getElementById('statusIcon');
const correctCountEl = document.getElementById('correct-count');
const incorrectCountEl = document.getElementById('incorrect-count');
const progressPercentEl = document.getElementById('progress-percent');
const resetBtn = document.getElementById('reset-btn');

async function init() {
    try {
        const response = await fetch('/data.json');
        quizData = await response.json();
        
        const savedTestId = localStorage.getItem('quiz_active_test_id');
        if (savedTestId) {
            currentTestId = parseInt(savedTestId);
            if (testSelector) {
                testSelector.value = currentTestId;
            }
        }
        
        loadProgress();
        renderQuestion();
        updateStats();
        
        if (testSelector) {
            testSelector.addEventListener('change', (e) => {
                currentTestId = parseInt(e.target.value);
                localStorage.setItem('quiz_active_test_id', currentTestId);
                loadProgress();
                renderQuestion();
                updateStats();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', resetQuiz);
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        if (questionText) questionText.textContent = 'Erro ao carregar os dados. Certifique-se de que o data.json existe.';
    }
}

function loadProgress() {
    const saved = localStorage.getItem(`quiz_progress_test_${currentTestId}`);
    if (saved) {
        const data = JSON.parse(saved);
        scores = { 
            correct: data.correct || 0, 
            incorrect: data.incorrect || 0, 
            userAnswers: data.userAnswers || {} 
        };
        currentQuestionIndex = data.currentQuestionIndex || 0;
    } else {
        scores = { correct: 0, incorrect: 0, userAnswers: {} };
        currentQuestionIndex = 0;
    }
}

function saveProgress() {
    const data = {
        correct: scores.correct,
        incorrect: scores.incorrect,
        userAnswers: scores.userAnswers,
        currentQuestionIndex: currentQuestionIndex
    };
    localStorage.setItem(`quiz_progress_test_${currentTestId}`, JSON.stringify(data));
}

function resetQuiz() {
    if (confirm('Tem a certeza que deseja reiniciar este simulado? Todos os seus acertos e erros serão limpos.')) {
        scores = { correct: 0, incorrect: 0, userAnswers: {} };
        currentQuestionIndex = 0;
        localStorage.removeItem(`quiz_progress_test_${currentTestId}`);
        updateStats();
        renderQuestion();
    }
}

function updateStats() {
    const test = quizData.tests.find(t => t.id === currentTestId);
    if (!test) return;
    const total = test.questions.length;
    const answeredCount = Object.keys(scores.userAnswers).length;
    
    if (correctCountEl) correctCountEl.textContent = scores.correct;
    if (incorrectCountEl) incorrectCountEl.textContent = scores.incorrect;
    
    const percent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
    if (progressPercentEl) progressPercentEl.textContent = `${percent}%`;
    
    if (progressBarFill) {
        progressBarFill.style.width = `${((currentQuestionIndex + 1) / total) * 100}%`;
    }
}

function renderQuestion() {
    const test = quizData.tests.find(t => t.id === currentTestId);
    if (!test) return;
    const question = test.questions[currentQuestionIndex];
    
    if (currentNum) currentNum.textContent = currentQuestionIndex + 1;
    if (totalNum) totalNum.textContent = test.questions.length;
    
    if (questionText) questionText.textContent = fixSpacing(question.text);
    if (optionsGrid) optionsGrid.innerHTML = '';
    if (explanationCard) explanationCard.classList.add('hidden');
    
    const pickedAnswer = scores.userAnswers[question.number];
    const isAnswered = pickedAnswer !== undefined;

    Object.entries(question.options).forEach(([key, value]) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (isAnswered) btn.disabled = true;
        
        btn.innerHTML = `
            <span class="option-letter">${key}</span>
            <span class="option-content">${fixSpacing(value)}</span>
        `;
        
        if (isAnswered) {
            if (key === question.answer) {
                btn.classList.add('correct');
            } else if (key === pickedAnswer) {
                btn.classList.add('wrong');
            }
        }

        btn.onclick = () => selectOption(key, question);
        if (optionsGrid) optionsGrid.appendChild(btn);
    });

    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
    if (nextBtn) nextBtn.textContent = currentQuestionIndex === test.questions.length - 1 ? 'Finalizar' : 'Próxima';
    
    if (isAnswered) {
        const isCorrect = pickedAnswer === question.answer;
        showExplanation(question, isCorrect);
    }
}

function selectOption(selectedKey, question) {
    if (scores.userAnswers[question.number] !== undefined) return;

    const isCorrect = selectedKey === question.answer;
    scores.userAnswers[question.number] = selectedKey;
    
    if (isCorrect) {
        scores.correct++;
    } else {
        scores.incorrect++;
    }

    saveProgress();
    updateStats();
    renderQuestion();
}

function showExplanation(question, isCorrect) {
    if (reasonText) reasonText.textContent = question.reason;
    if (distractorsText) distractorsText.textContent = question.distractors;
    if (explanationCard) {
        explanationCard.classList.remove('hidden');
        
        if (statusTitle) {
            statusTitle.textContent = isCorrect ? 'Correto!' : 'Incorreto';
            statusTitle.style.color = isCorrect ? 'var(--success)' : 'var(--error)';
        }
        if (statusIcon) statusIcon.textContent = isCorrect ? '✅' : '❌';
        
        // Apenas faz scroll se o utilizador acabou de responder
        // (Podemos verificar se a explicação já estava visível ou não)
    }
}

function fixSpacing(text) {
    if (!text) return '';
    return text.replace(/([?.!,])([A-Za-z])/g, '$1 $2').replace(/\s+/g, ' ').trim();
}

if (prevBtn) {
    prevBtn.onclick = () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            saveProgress();
            renderQuestion();
            updateStats();
        }
    };
}

if (nextBtn) {
    nextBtn.onclick = () => {
        const test = quizData.tests.find(t => t.id === currentTestId);
        if (currentQuestionIndex < test.questions.length - 1) {
            currentQuestionIndex++;
            saveProgress();
            renderQuestion();
            updateStats();
        } else {
            alert(`Simulado concluído!\nAcertos: ${scores.correct}\nErros: ${scores.incorrect}`);
        }
    };
}

init();
