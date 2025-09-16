// Enhanced Quiz Game JavaScript with API Integration and Leaderboard
// API: Open Trivia Database - https://opentdb.com/

class QuizGame {
    constructor() {
        this.apiUrl = 'https://opentdb.com/api.php?amount=10&category=9&difficulty=easy&type=multiple';
        this.quizQuestions = [];
        this.currentQuestion = 0;
        this.score = 0;
        this.playerName = "";
        this.answered = false;
        this.isLoading = false;
        this.startTime = null;
        this.endTime = null;
        
        this.initializeEventListeners();
        this.initializeLeaderboard();
    }

    initializeLeaderboard() {
        // Initialize leaderboard in memory - no localStorage usage
        this.leaderboard = this.getStoredLeaderboard() || [];
    }

    getStoredLeaderboard() {
        try {
            // Try localStorage first, but provide fallback
            if (typeof Storage !== "undefined" && window.localStorage) {
                const stored = localStorage.getItem('quizifyLeaderboard');
                return stored ? JSON.parse(stored) : [];
            }
        } catch (error) {
            console.warn('localStorage not available, using in-memory storage');
        }
        return [];
    }

    saveLeaderboard(data) {
        try {
            if (typeof Storage !== "undefined" && window.localStorage) {
                localStorage.setItem('quizifyLeaderboard', JSON.stringify(data));
            }
        } catch (error) {
            console.warn('Could not save to localStorage:', error.message);
        }
        // Always keep in-memory copy
        this.leaderboard = data;
    }

    initializeEventListeners() {
        // Enter key to start quiz
        const usernameInput = document.getElementById("username");
        if (usernameInput) {
            usernameInput.addEventListener("keypress", (event) => {
                if (event.key === "Enter") {
                    this.startQuiz();
                }
            });

            // Validate input - only letters, numbers, spaces, and common characters
            usernameInput.addEventListener("input", (event) => {
                const value = event.target.value;
                // Remove any potentially harmful characters
                event.target.value = value.replace(/[<>\"'&]/g, '');
            });
        }
    }

    // Fetch questions from Open Trivia Database API
    async fetchQuestions() {
        try {
            this.showLoading("🔄 Fetching questions from trivia database...");
            
            const response = await fetch(this.apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.response_code !== 0) {
                let errorMessage = 'API returned an error response';
                switch(data.response_code) {
                    case 1:
                        errorMessage = 'Not enough questions available. Try a different category.';
                        break;
                    case 2:
                        errorMessage = 'Invalid parameter in API request.';
                        break;
                    case 3:
                    case 4:
                        errorMessage = 'Token error. Please try again.';
                        break;
                    default:
                        errorMessage = 'Unknown API error occurred.';
                }
                throw new Error(errorMessage);
            }

            // Transform API data to our format
            this.quizQuestions = data.results.map(item => {
                // Decode HTML entities
                const question = this.decodeHtml(item.question);
                const correctAnswer = this.decodeHtml(item.correct_answer);
                const incorrectAnswers = item.incorrect_answers.map(answer => this.decodeHtml(answer));
                
                // Shuffle options
                const allOptions = [...incorrectAnswers, correctAnswer];
                const shuffledOptions = this.shuffleArray(allOptions);
                
                return {
                    question: question,
                    options: shuffledOptions,
                    correct: shuffledOptions.indexOf(correctAnswer),
                    category: this.decodeHtml(item.category),
                    difficulty: item.difficulty
                };
            });

            this.showLoading("Your quiz will start soon🎉...");
            return true;
        } catch (error) {
            console.error('Error fetching questions:', error);
            this.showError(`❌ Failed to load questions: ${error.message}`);
            return false;
        }
    }

    // Decode HTML entities (like &quot;, &amp;, etc.)
    decodeHtml(html) {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }

    // Shuffle array using Fisher-Yates algorithm
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    showLoading(message = "Your quiz will start soon🎉...") {
        const welcomeMessage = document.getElementById("welcomeMessage");
        const loadingElement = welcomeMessage.querySelector('.loading');
        if (loadingElement) {
            // Preserve the original spinner design
            loadingElement.innerHTML = `<span class="spinner"></span>${message}`;
            loadingElement.style.color = '#718096';
            loadingElement.classList.remove('error');
        }
    }

    showError(message) {
        const welcomeMessage = document.getElementById("welcomeMessage");
        const loadingElement = welcomeMessage.querySelector('.loading');
        if (loadingElement) {
            loadingElement.innerHTML = message;
            loadingElement.style.color = '#e53e3e';
            loadingElement.classList.add('error');
        }
        
        // Add retry button
        setTimeout(() => {
            const existingRetryButton = welcomeMessage.querySelector('.retry-button');
            if (existingRetryButton) {
                existingRetryButton.remove();
            }
            
            const retryButton = document.createElement('button');
            retryButton.textContent = '🔄 Try Again';
            retryButton.className = 'retry-button';
            retryButton.onclick = () => this.startQuiz();
            retryButton.style.marginTop = '20px';
            welcomeMessage.appendChild(retryButton);
        }, 1000);
    }

    async startQuiz() {
        const name = document.getElementById("username").value.trim();
        if (name === "") {
            alert("Please enter your name!");
            return;
        }

        if (name.length > 20) {
            alert("Name must be 20 characters or less!");
            return;
        }

        if (this.isLoading) {
            return; // Prevent multiple clicks
        }

        this.isLoading = true;
        this.playerName = name;
        this.currentQuestion = 0;
        this.score = 0;
        this.startTime = new Date();
        
        // Hide Sign In, show Welcome
        document.getElementById("signInSection").style.display = "none";
        document.getElementById("welcomeMessage").style.display = "block";
        document.getElementById("welcomeMessage").classList.add("fade-in");
        document.getElementById("welcomeText").innerText = "Welcome, " + name + "!";

        // Reset welcome message state
        const existingRetryButton = document.getElementById("welcomeMessage").querySelector('.retry-button');
        if (existingRetryButton) existingRetryButton.remove();

        // Fetch questions from API
        const questionsLoaded = await this.fetchQuestions();
        
        if (!questionsLoaded) {
            this.isLoading = false;
            return;
        }

        // Show quiz after successful loading
        setTimeout(() => {
            this.isLoading = false;
            document.getElementById("welcomeMessage").style.display = "none";
            document.getElementById("quizSection").style.display = "block";
            document.getElementById("quizSection").classList.add("fade-in");
            this.loadQuestion();
        }, 3000);
    }

    loadQuestion() {
        if (this.currentQuestion >= this.quizQuestions.length) {
            this.showResults();
            return;
        }

        this.answered = false;
        const question = this.quizQuestions[this.currentQuestion];
        
        // Update UI elements
        document.getElementById("questionCounter").innerText = 
            `Question ${this.currentQuestion + 1} of ${this.quizQuestions.length}`;
        document.getElementById("questionText").innerText = question.question;
        document.getElementById("scoreDisplay").innerText = `Score: ${this.score}`;

        // Clear and populate options
        const optionsContainer = document.getElementById("options");
        optionsContainer.innerHTML = "";

        question.options.forEach((option, index) => {
            const button = document.createElement("button");
            button.className = "option-btn";
            button.innerText = option;
            button.onclick = () => this.selectAnswer(index);
            optionsContainer.appendChild(button);
        });
    }

    selectAnswer(selectedIndex) {
        if (this.answered) return;
        
        this.answered = true;
        const question = this.quizQuestions[this.currentQuestion];
        const buttons = document.querySelectorAll(".option-btn");

        // Highlight correct and incorrect answers
        buttons.forEach((button, index) => {
            if (index === question.correct) {
                button.classList.add("correct");
            } else if (index === selectedIndex && index !== question.correct) {
                button.classList.add("incorrect");
            }
            button.style.pointerEvents = "none";
        });

        // Update score
        if (selectedIndex === question.correct) {
            this.score++;
            document.getElementById("scoreDisplay").innerText = `Score: ${this.score}`;
        }

        // Move to next question after a delay
        setTimeout(() => {
            this.currentQuestion++;
            this.loadQuestion();
        }, 1500);
    }

    showResults() {
        this.endTime = new Date();
        const timeTaken = Math.round((this.endTime - this.startTime) / 1000); // in seconds
        
        document.getElementById("quizSection").style.display = "none";
        document.getElementById("resultsSection").style.display = "block";
        document.getElementById("resultsSection").classList.add("fade-in");

        const percentage = Math.round((this.score / this.quizQuestions.length) * 100);
        document.getElementById("finalScore").innerText = 
            `${this.playerName}, you scored ${this.score}/${this.quizQuestions.length} (${percentage}%)`;

        let message = "";
        if (percentage >= 80) {
            message = "🎉 Excellent work! You're a trivia master!";
        } else if (percentage >= 60) {
            message = "👍 Good job! Well done!";
        } else if (percentage >= 40) {
            message = "📚 Not bad, but there's room for improvement!";
        } else {
            message = "💪 Keep studying and try again! Practice makes perfect!";
        }
        document.getElementById("resultMessage").innerText = message;

        // Show achievement if applicable
        this.showAchievement(percentage, timeTaken);

        // Save score to leaderboard
        this.saveToLeaderboard(percentage, timeTaken);
    }

    showAchievement(percentage, timeTaken) {
        const achievementBadge = document.getElementById("achievementBadge");
        const achievementText = document.getElementById("achievementText");
        let achievement = null;

        // Check for achievements
        if (percentage === 100) {
            achievement = "🏆 Perfect Score! - You got every question right!";
        } else if (percentage >= 90) {
            achievement = "🌟 Quiz Master - 90% or higher!";
        } else if (timeTaken <= 60) {
            achievement = "⚡ Speed Demon - Completed in under 1 minute!";
        } else if (this.isFirstQuiz()) {
            achievement = "🎯 First Timer - Welcome to Quizify!";
        }

        if (achievement) {
            achievementText.innerText = achievement;
            achievementBadge.style.display = 'block';
        }
    }

    isFirstQuiz() {
        const leaderboard = this.getStoredLeaderboard();
        return leaderboard.length === 0;
    }

    saveToLeaderboard(percentage, timeTaken) {
        const scoreEntry = {
            id: Date.now() + Math.random(), // Unique ID
            name: this.playerName,
            score: this.score,
            totalQuestions: this.quizQuestions.length,
            percentage: percentage,
            timeTaken: timeTaken,
            date: new Date().toISOString(),
            category: this.quizQuestions[0]?.category || 'General Knowledge',
            difficulty: this.quizQuestions[0]?.difficulty || 'Easy'
        };

        const leaderboard = this.getStoredLeaderboard();
        leaderboard.push(scoreEntry);
        
        // Sort by percentage (descending), then by time taken (ascending)
        leaderboard.sort((a, b) => {
            if (b.percentage === a.percentage) {
                return a.timeTaken - b.timeTaken;
            }
            return b.percentage - a.percentage;
        });

        // Keep only top 100 scores
        if (leaderboard.length > 100) {
            leaderboard.splice(100);
        }

        this.saveLeaderboard(leaderboard);
    }

    getLeaderboard() {
        return this.getStoredLeaderboard();
    }

    viewLeaderboard() {
        // Simple alert-based leaderboard view
        const leaderboard = this.getLeaderboard();
        if (leaderboard.length === 0) {
            alert("📊 Leaderboard is empty. Complete a quiz to add your score!");
            return;
        }
        
        let leaderboardText = "🏆 TOP SCORES:\n\n";
        leaderboard.slice(0, 10).forEach((entry, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;
            leaderboardText += `${medal} ${entry.name}: ${entry.percentage}% (${entry.timeTaken}s)\n`;
        });
        
        alert(leaderboardText);
    }

    // Enhanced leaderboard opening function
    openLeaderboard() {
        // Try to open leaderboard.html in a new window/tab
        try {
            window.open('leaderboard.html', '_blank');
        } catch (error) {
            console.warn('Could not open leaderboard page:', error);
            // Fallback to simple alert
            this.viewLeaderboard();
        }
    }

    async restartQuiz() {
        this.currentQuestion = 0;
        this.score = 0;
        this.quizQuestions = [];
        
        document.getElementById("resultsSection").style.display = "none";
        document.getElementById("welcomeMessage").style.display = "block";
        document.getElementById("welcomeText").innerText = `Welcome back, ${this.playerName}!`;
        
        // Hide achievement badge
        document.getElementById("achievementBadge").style.display = 'none';
        
        // Reset welcome message state with original loading
        this.showLoading("Your quiz will start soon🎉...");
        
        // Fetch new questions for restart
        const questionsLoaded = await this.fetchQuestions();
        
        if (!questionsLoaded) {
            return;
        }

        setTimeout(() => {
            document.getElementById("welcomeMessage").style.display = "none";
            document.getElementById("quizSection").style.display = "block";
            this.loadQuestion();
        }, 3000);
    }

    goToSignIn() {
        this.resetGame();
        
        document.getElementById("resultsSection").style.display = "none";
        document.getElementById("signInSection").style.display = "block";
        document.getElementById("username").value = "";
        
        // Hide achievement badge
        document.getElementById("achievementBadge").style.display = 'none';
    }

    goBack() {
        // Navigation logic with confirmation
        if (this.currentQuestion > 0 || this.score > 0) {
            if (confirm("⚠️ Are you sure you want to go back? Your progress will be lost.")) {
                this.handleBackNavigation();
            }
        } else {
            this.handleBackNavigation();
        }
    }

    handleBackNavigation() {
        this.resetGame();
        
        // Check if there's a referrer or main page to go back to
        if (document.referrer && document.referrer !== window.location.href) {
            window.history.back();
        } else {
            // If no referrer, reset to sign-in screen
            this.goToSignIn();
            alert("ℹ️ Returned to sign-in screen. Configure the back button to navigate to your main menu.");
        }
    }

    resetGame() {
        this.currentQuestion = 0;
        this.score = 0;
        this.quizQuestions = [];
        this.playerName = "";
        this.answered = false;
        this.isLoading = false;
        this.startTime = null;
        this.endTime = null;
    }

    // Alternative API endpoints for different categories and difficulties
    changeQuizSettings(amount = 10, category = 9, difficulty = 'easy') {
        this.apiUrl = `https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${difficulty}&type=multiple`;
    }

    // Get available categories (for future enhancements)
    async getCategories() {
        try {
            const response = await fetch('https://opentdb.com/api_category.php');
            const data = await response.json();
            return data.trivia_categories;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    }

    // Utility functions for leaderboard integration
    getLeaderboardStats() {
        const leaderboard = this.getLeaderboard();
        
        if (leaderboard.length === 0) {
            return {
                totalPlayers: 0,
                highestScore: 0,
                averageAccuracy: 0,
                topScores: []
            };
        }

        const totalPlayers = leaderboard.length;
        const highestScore = Math.max(...leaderboard.map(entry => entry.percentage));
        const averageAccuracy = Math.round(
            leaderboard.reduce((sum, entry) => sum + entry.percentage, 0) / leaderboard.length
        );

        return {
            totalPlayers,
            highestScore,
            averageAccuracy,
            topScores: leaderboard.slice(0, 10)
        };
    }

    // Filter leaderboard by time period
    filterLeaderboardByTime(period = 'all') {
        const leaderboard = this.getLeaderboard();
        const now = new Date();
        
        return leaderboard.filter(entry => {
            const entryDate = new Date(entry.date);
            
            switch (period) {
                case 'today':
                    return entryDate.toDateString() === now.toDateString();
                case 'weekly':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return entryDate >= weekAgo;
                case 'monthly':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return entryDate >= monthAgo;
                default:
                    return true;
            }
        }).sort((a, b) => {
            if (b.percentage === a.percentage) {
                return a.timeTaken - b.timeTaken;
            }
            return b.percentage - a.percentage;
        });
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create global instance
    window.quizGame = new QuizGame();
    
    // Make functions available globally for HTML onclick handlers
    window.startQuiz = () => window.quizGame.startQuiz();
    window.restartQuiz = () => window.quizGame.restartQuiz();
    window.goToSignIn = () => window.quizGame.goToSignIn();
    window.goBack = () => window.quizGame.goBack();
    window.viewLeaderboard = () => window.quizGame.viewLeaderboard();
    window.openLeaderboard = () => window.quizGame.openLeaderboard();
    
    // Make game instance available for leaderboard
    window.getQuizGameData = () => {
        return {
            leaderboard: window.quizGame.getLeaderboard(),
            stats: window.quizGame.getLeaderboardStats(),
            filterByTime: (period) => window.quizGame.filterLeaderboardByTime(period)
        };
    };
});

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizGame;
}