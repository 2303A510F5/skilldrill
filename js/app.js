document.addEventListener('DOMContentLoaded', () => {
    // ---- STATE MANAGEMENT ----
    let currentUser = null;
    let currentQuiz = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let timer;
    let timeLeft = 0;
    let userAnswers = [];
    let quizStartTime = null;
    let currentSubjectId = null;
    let currentSubjectTitle = null;

    // ---- DOM ELEMENTS ----
    const DOM = {
        toast: document.getElementById('toast'),
        nav: document.getElementById('navbar'),
        navUser: document.getElementById('nav-username'),
        logoutBtn: document.getElementById('logout-btn'),
        navAnalyticsBtn: document.getElementById('nav-analytics-btn'),
        navBrand: document.getElementById('nav-brand-logo'),
        
        sections: {
            auth: document.getElementById('auth-section'),
            dashboard: document.getElementById('dashboard-section'),
            quiz: document.getElementById('quiz-section'),
            results: document.getElementById('results-section'),
            analytics: document.getElementById('analytics-section')
        },

        // Auth
        authTabs: document.querySelectorAll('.tab-btn'),
        loginForm: document.getElementById('login-form'),
        signupForm: document.getElementById('signup-form'),
        dashUsername: document.getElementById('dash-username'),

        // Quiz Selection
        startSubjectBtns: document.querySelectorAll('.start-subject-btn'),
        
        // Quiz Area
        quizSubjectTitle: document.getElementById('quiz-subject-title'),
        qNumCurrent: document.getElementById('current-q-num'),
        qNumTotal: document.getElementById('total-q-num'),
        progressBar: document.getElementById('quiz-progress-bar'),
        timeDisplay: document.getElementById('time-remaining'),
        timerBox: document.getElementById('timer-box'),
        qDifficulty: document.getElementById('q-difficulty'),
        qText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options-container'),
        nextBtn: document.getElementById('next-btn'),

        // Results
        finalScore: document.getElementById('final-score'),
        correctCount: document.getElementById('correct-count'),
        incorrectCount: document.getElementById('incorrect-count'),
        timeSpent: document.getElementById('time-spent'),
        resultMessage: document.getElementById('result-message'),
        viewAnswersBtn: document.getElementById('view-answers-btn'),
        backDashBtns: document.querySelectorAll('.back-dashboard-btn'),
        answersReviewContainer: document.getElementById('answers-review-container'),
        reviewList: document.getElementById('review-list'),

        // Static Stats
        globalQuizzes: document.getElementById('global-quizzes-taken'),
        globalAvg: document.getElementById('global-avg-score'),
        goToAnalyticsBox: document.getElementById('go-to-analytics-box'),

        // Analytics
        historyList: document.getElementById('history-list'),
        histDetailsPanel: document.getElementById('history-details-panel'),
        histDetailTitle: document.getElementById('hist-detail-title'),
        histDetailMeta: document.getElementById('hist-detail-meta'),
        histReviewList: document.getElementById('hist-review-list'),
        closeHistDetailBtn: document.getElementById('close-hist-detail-btn')
    };

    let resultsChartInstance = null;

    // ---- INITIALIZATION ----
    function init() {
        seedPredefinedUsers();
        checkAuth();
        setupEventListeners();
    }

    function seedPredefinedUsers() {
        const users = JSON.parse(localStorage.getItem('engiUsers') || '[]');
        const predefined = [
            { id: 'admin-1', name: 'Admin', email: 'admin', password: '1234', history: [] },
            { id: 'test-1', name: 'Test One', email: 'test1', password: '1234', history: [] },
            { id: 'test-2', name: 'Test Two', email: 'test2', password: '4567', history: [] }
        ];

        let updated = false;
        predefined.forEach(pu => {
            if (!users.find(u => u.email === pu.email)) {
                users.push(pu);
                updated = true;
            }
        });

        if (updated) {
            localStorage.setItem('engiUsers', JSON.stringify(users));
        }
    }

    // ---- UTILITIES ----
    function showToast(msg, type = 'success') {
        DOM.toast.textContent = msg;
        DOM.toast.className = `toast show ${type}`;
        setTimeout(() => {
            DOM.toast.className = 'toast hidden';
        }, 3000);
    }

    function switchSection(sectionId) {
        Object.values(DOM.sections).forEach(sec => {
            sec.classList.remove('active');
            sec.classList.add('hidden');
        });
        document.getElementById(sectionId).classList.remove('hidden');
        document.getElementById(sectionId).classList.add('active');
        
        // Hide detail panel if leaving analytics
        if(sectionId !== 'analytics-section') {
            DOM.histDetailsPanel.classList.add('hidden');
        }
    }

    function shuffleArray(array) {
        let currentIndex = array.length,  randomIndex;
        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    // ---- AUTHENTICATION ----
    function checkAuth() {
        const storedUser = localStorage.getItem('engiUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            loadDashboard();
        } else {
            DOM.nav.classList.add('hidden');
            switchSection('auth-section');
        }
    }

    function setupEventListeners() {
        // Nav Links
        DOM.navBrand.addEventListener('click', loadDashboard);
        DOM.navAnalyticsBtn.addEventListener('click', loadAnalyticsView);

        // Auth Tabs
        DOM.authTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                DOM.authTabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                if (e.target.dataset.tab === 'login') {
                    DOM.loginForm.classList.add('active');
                    DOM.loginForm.classList.remove('hidden');
                    DOM.signupForm.classList.add('hidden');
                    DOM.signupForm.classList.remove('active');
                } else {
                    DOM.signupForm.classList.add('active');
                    DOM.signupForm.classList.remove('hidden');
                    DOM.loginForm.classList.add('hidden');
                    DOM.loginForm.classList.remove('active');
                }
            });
        });

        // Login
        DOM.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            
            const users = JSON.parse(localStorage.getItem('engiUsers') || '[]');
            const user = users.find(u => u.email === email && u.password === pass);

            if (user) {
                currentUser = user;
                localStorage.setItem('engiUser', JSON.stringify(user));
                showToast(`Welcome back to SkillDrill, ${user.name.split(' ')[0]}!`);
                loadDashboard();
                DOM.loginForm.reset();
            } else {
                showToast('Invalid credentials. Please try again.', 'error');
            }
        });

        // Signup
        DOM.signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const pass = document.getElementById('signup-password').value;

            const users = JSON.parse(localStorage.getItem('engiUsers') || '[]');
            if (users.find(u => u.email === email)) {
                showToast('Email already in use. Please login.', 'error');
                return;
            }

            const newUser = { 
                id: Date.now().toString(), 
                name, 
                email, 
                password: pass,
                history: [] 
            };
            users.push(newUser);
            localStorage.setItem('engiUsers', JSON.stringify(users));
            
            currentUser = newUser;
            localStorage.setItem('engiUser', JSON.stringify(newUser));
            showToast('Account created successfully!');
            loadDashboard();
            DOM.signupForm.reset();
        });

        // Logout
        DOM.logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('engiUser');
            currentUser = null;
            DOM.nav.classList.add('hidden');
            switchSection('auth-section');
            showToast('Logged out successfully');
        });

        // Subject Selection
        DOM.startSubjectBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const subject = btn.dataset.subject;
                const title = btn.dataset.title;
                startQuiz(subject, title);
            });
        });

        // Quiz Mechanics
        DOM.nextBtn.addEventListener('click', handleNextQuestion);

        DOM.backDashBtns.forEach(btn => {
            btn.addEventListener('click', loadDashboard);
        });
        
        DOM.viewAnswersBtn.addEventListener('click', renderQuizReview);

        DOM.goToAnalyticsBox.addEventListener('click', loadAnalyticsView);

        DOM.closeHistDetailBtn.addEventListener('click', () => {
            DOM.histDetailsPanel.classList.add('hidden');
            document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
        });
    }

    // ---- DASHBOARD ----
    function loadDashboard() {
        DOM.nav.classList.remove('hidden');
        DOM.navUser.innerHTML = `<b>${currentUser.name}</b>`;
        DOM.dashUsername.textContent = currentUser.name.split(' ')[0];
        DOM.answersReviewContainer.classList.add('hidden');
        
        updateGlobalStats();
        switchSection('dashboard-section');
    }

    function reloadUserFromDB() {
        const users = JSON.parse(localStorage.getItem('engiUsers') || '[]');
        const dbUser = users.find(u => u.id === currentUser.id);
        if (dbUser) currentUser = dbUser;
    }

    function updateGlobalStats() {
        reloadUserFromDB();
        const history = currentUser.history || [];
        DOM.globalQuizzes.textContent = history.length;
        
        if (history.length > 0) {
            const totalScore = history.reduce((acc, curr) => acc + curr.scorePercent, 0);
            DOM.globalAvg.textContent = Math.round(totalScore / history.length) + '%';
        } else {
            DOM.globalAvg.textContent = '0%';
        }
    }

    // ---- QUIZ MECHANICS ----
    function startQuiz(subjectKey, subjectName) {
        currentSubjectId = subjectKey;
        currentSubjectTitle = subjectName;

        if (!quizData[subjectKey]) {
            showToast("Quiz data not available.", "error"); return;
        }

        let rawQuestions = [...quizData[subjectKey]];
        
        currentQuiz = shuffleArray(rawQuestions).slice(0, 10).map((q) => {
            const originalOptions = q.options.map((opt, i) => ({text: opt, isCorrect: i === q.correct}));
            const shuffledOptions = shuffleArray(originalOptions);
            const newCorrectIndex = shuffledOptions.findIndex(o => o.isCorrect);
            
            return {
                ...q,
                options: shuffledOptions.map(o => o.text),
                correct: newCorrectIndex
            }
        });

        DOM.quizSubjectTitle.textContent = subjectName;
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = [];
        DOM.qNumTotal.textContent = currentQuiz.length;
        
        timeLeft = 15 * 60; 
        quizStartTime = Date.now();
        DOM.timerBox.classList.remove('warning');
        updateTimerDisplay();
        
        clearInterval(timer);
        timer = setInterval(handleTick, 1000);

        switchSection('quiz-section');
        renderQuestion();
    }

    function handleTick() {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 60) {
            DOM.timerBox.classList.add('warning');
        }
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            submitQuiz(true); 
        }
    }

    function updateTimerDisplay() {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        DOM.timeDisplay.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    }

    function renderQuestion() {
        const q = currentQuiz[currentQuestionIndex];
        
        DOM.qNumCurrent.textContent = currentQuestionIndex + 1;
        DOM.progressBar.style.width = `${((currentQuestionIndex) / currentQuiz.length) * 100}%`;
        
        DOM.qDifficulty.textContent = q.difficulty;
        DOM.qDifficulty.className = `difficulty-badge diff-${q.difficulty}`;
        DOM.qText.textContent = q.q;
        DOM.optionsContainer.innerHTML = '';
        DOM.nextBtn.disabled = true;

        const alphabet = ['A', 'B', 'C', 'D'];
        
        q.options.forEach((optText, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `<div class="option-prefix">${alphabet[index]}</div> <span>${optText}</span>`;
            
            btn.addEventListener('click', () => {
                const siblings = DOM.optionsContainer.querySelectorAll('.option-btn');
                siblings.forEach(s => s.classList.remove('selected'));
                
                btn.classList.add('selected');
                DOM.nextBtn.disabled = false;
                DOM.nextBtn.dataset.selected = index;
            });
            
            DOM.optionsContainer.appendChild(btn);
        });
    }

    function handleNextQuestion() {
        const selectedIndex = parseInt(DOM.nextBtn.dataset.selected);
        const q = currentQuiz[currentQuestionIndex];
        const isCorrect = selectedIndex === q.correct;
        if (isCorrect) score++;

        userAnswers.push({
            question: q.q,
            options: q.options,
            userChoice: selectedIndex,
            correctChoice: q.correct,
            isCorrect: isCorrect,
            exp: q.exp
        });

        currentQuestionIndex++;

        if (currentQuestionIndex < currentQuiz.length) {
            renderQuestion();
            if (currentQuestionIndex === currentQuiz.length - 1) {
                DOM.nextBtn.innerHTML = 'Complete Simulation <i class="fa-solid fa-check"></i>';
                DOM.nextBtn.classList.replace('btn-primary', 'btn-success');
                DOM.nextBtn.style.backgroundColor = 'var(--success)';
            }
        } else {
            submitQuiz(false);
        }
    }

    function submitQuiz(isAuto) {
        clearInterval(timer);
        const timeTakenSec = Math.floor((Date.now() - quizStartTime) / 1000);
        
        while (userAnswers.length < currentQuiz.length) {
            const q = currentQuiz[userAnswers.length];
            userAnswers.push({
                question: q.q,
                options: q.options,
                userChoice: -1, 
                correctChoice: q.correct,
                isCorrect: false,
                exp: q.exp
            });
        }

        const scorePercent = Math.round((score / currentQuiz.length) * 100);
        
        // Save to Local DB with full payload
        const users = JSON.parse(localStorage.getItem('engiUsers') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex !== -1) {
            const resultEntry = {
                id: Date.now(),
                subjectId: currentSubjectId,
                subjectTitle: currentSubjectTitle,
                date: new Date().toISOString(),
                score,
                scorePercent,
                total: currentQuiz.length,
                timeTakenSec,
                answers: userAnswers // Deep copy saved to allow review later
            };
            users[userIndex].history = users[userIndex].history || [];
            users[userIndex].history.push(resultEntry);
            localStorage.setItem('engiUsers', JSON.stringify(users));
            currentUser = users[userIndex]; 
        }

        if (isAuto) {
            showToast('Time limit exceeded! Quiz auto-submitted.', 'warning');
        }

        renderResults(score, currentQuiz.length, scorePercent, timeTakenSec);
    }

    // ---- RESULTS ----
    function renderResults(cScore, total, pct, timeSec) {
        DOM.finalScore.textContent = pct;
        DOM.correctCount.textContent = cScore;
        DOM.incorrectCount.textContent = total - cScore;
        
        const m = Math.floor(timeSec / 60);
        const s = timeSec % 60;
        DOM.timeSpent.textContent = `${m}m ${s}s`;

        const circle = document.querySelector('.score-circle');
        let color = 'var(--danger)';
        if (pct >= 80) {
            color = 'var(--success)';
            DOM.resultMessage.textContent = "Excellent engineering performance!";
        } else if (pct >= 50) {
            color = 'var(--warning)';
            DOM.resultMessage.textContent = "Good try, keep studying the fundamentals.";
        } else {
            DOM.resultMessage.textContent = "You need significant review on this topic.";
        }
        
        circle.style.background = `conic-gradient(${color} ${pct}%, rgba(255,255,255,0.05) 0%)`;
        renderChart(cScore, total - cScore, 'resultsChart');

        DOM.nextBtn.innerHTML = 'Next Question <i class="fa-solid fa-arrow-right"></i>';
        DOM.nextBtn.style.backgroundColor = '';
        DOM.answersReviewContainer.classList.add('hidden');

        switchSection('results-section');
    }

    function renderChart(correct, incorrect, canvasId) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (resultsChartInstance) resultsChartInstance.destroy();

        Chart.defaults.color = '#94a3b8';
        
        resultsChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Incorrect'],
                datasets: [{
                    data: [correct, incorrect],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                cutout: '75%'
            }
        });
    }

    // ---- REVIEW GENERATOR ----
    function buildReviewHTML(answersArray) {
        const alphabet = ['A', 'B', 'C', 'D'];
        let html = '';
        
        answersArray.forEach((ans, i) => {
            const uChoiceStr = ans.userChoice >= 0 ? `${alphabet[ans.userChoice]}) ${ans.options[ans.userChoice]}` : "No Answer";
            const cChoiceStr = `${alphabet[ans.correctChoice]}) ${ans.options[ans.correctChoice]}`;
            
            const isCorrClass = ans.isCorrect ? 'correct' : 'wrong';
            let icon = ans.isCorrect ? '<i class="fa-solid fa-check" style="color:var(--success);"></i>' : '<i class="fa-solid fa-times" style="color:var(--danger)"></i>';

            html += `
                <div class="review-item">
                    <div class="review-q">${i + 1}. ${ans.question}</div>
                    <div>Your Choice: <span class="review-ans ${isCorrClass}">${uChoiceStr}</span> ${icon}</div>
                    ${!ans.isCorrect ? `<div>Correct Answer: <span class="review-ans correct-ans">${cChoiceStr}</span></div>` : ''}
                    <div class="review-exp"><i class="fa-solid fa-graduation-cap" style="color:var(--info);"></i> <b>Rationale:</b> ${ans.exp}</div>
                </div>
            `;
        });
        return html;
    }

    function renderQuizReview() {
        DOM.answersReviewContainer.classList.remove('hidden');
        DOM.reviewList.innerHTML = buildReviewHTML(userAnswers);
        DOM.answersReviewContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // ---- ANALYTICS SECTION ----
    function loadAnalyticsView() {
        reloadUserFromDB();
        switchSection('analytics-section');
        populateHistoryList();
    }

    function populateHistoryList() {
        const history = currentUser.history || [];
        DOM.historyList.innerHTML = '';

        if (history.length === 0) {
            DOM.historyList.innerHTML = '<div class="text-center text-muted mt-3">No submissions yet. Complete a challenge to view analytics!</div>';
            return;
        }

        // Sort descending by date
        const sortedHistory = [...history].sort((a,b) => b.id - a.id);

        sortedHistory.forEach(record => {
            const div = document.createElement('div');
            div.className = 'history-item';
            
            const dateStr = new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            
            let colorClass = 'low';
            if (record.scorePercent >= 80) colorClass = 'high';
            else if (record.scorePercent >= 50) colorClass = 'mid';

            div.innerHTML = `
                <div class="hist-subject">${record.subjectTitle}</div>
                <div class="hist-meta">
                    <span><i class="fa-regular fa-calendar"></i> ${dateStr}</span>
                    <span class="hist-score ${colorClass}">${record.scorePercent}%</span>
                </div>
            `;

            div.addEventListener('click', () => {
                document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
                div.classList.add('active');
                viewHistoryDetailed(record);
            });

            DOM.historyList.appendChild(div);
        });
    }

    function viewHistoryDetailed(record) {
        DOM.histDetailsPanel.classList.remove('hidden');
        DOM.histDetailTitle.textContent = `${record.subjectTitle} Results`;
        
        const dateStr = new Date(record.date).toLocaleString();
        const m = Math.floor(record.timeTakenSec / 60);
        const s = record.timeTakenSec % 60;
        
        DOM.histDetailMeta.innerHTML = `<i class="fa-regular fa-clock"></i> Taken on ${dateStr} &bull; Time: ${m}m ${s}s &bull; Score: <b>${record.score}/${record.total}</b>`;
        
        if (record.answers && record.answers.length > 0) {
            DOM.histReviewList.innerHTML = buildReviewHTML(record.answers);
        } else {
            DOM.histReviewList.innerHTML = '<div class="text-muted"><i class="fa-solid fa-circle-exclamation"></i> Detailed answer history is not available for this legacy record.</div>';
        }

        // On mobile, scroll to details
        if (window.innerWidth < 800) {
            DOM.histDetailsPanel.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Call init
    init();
});
