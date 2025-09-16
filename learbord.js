// Leaderboard JavaScript with Real User Data Integration

class LeaderboardManager {
    constructor() {
        this.currentFilter = 'all';
        this.leaderboardData = [];
        this.avatarEmojis = ['👨‍💻', '👩‍💻', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑‍🚀', '👨‍🚀', '👩‍🚀', '🧑‍🎨', '👨‍🎨', '👩‍🎨', '🧙‍♂️', '🧙‍♀️', '🦸‍♂️', '🦸‍♀️'];
        
        this.initializeLeaderboard();
    }

    // Get leaderboard data from storage
    getStoredLeaderboard() {
        try {
            if (typeof Storage !== "undefined" && window.localStorage) {
                const stored = localStorage.getItem('quizifyLeaderboard');
                return stored ? JSON.parse(stored) : [];
            }
        } catch (error) {
            console.warn('localStorage not available, creating sample data');
        }
        
        // If no data exists, create sample data for demonstration
        return this.createSampleData();
    }

    // Create sample data for demonstration purposes
    createSampleData() {
        const sampleNames = [
            'Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Emma Brown',
            'Frank Miller', 'Grace Lee', 'Henry Taylor', 'Ivy Chen', 'Jack Thompson'
        ];
        
        const categories = ['General Knowledge', 'Science', 'History', 'Geography', 'Sports'];
        const difficulties = ['easy', 'medium', 'hard'];
        
        const sampleData = [];
        const now = new Date();
        
        for (let i = 0; i < 25; i++) {
            const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
            const score = Math.floor(Math.random() * 10) + 1;
            const totalQuestions = 10;
            const percentage = Math.round((score / totalQuestions) * 100);
            const timeTaken = Math.floor(Math.random() * 180) + 30; // 30-210 seconds
            
            // Create dates within the last month for variety
            const daysAgo = Math.floor(Math.random() * 30);
            const entryDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            
            sampleData.push({
                id: Date.now() + Math.random() + i,
                name: `${randomName}_${i + 1}`,
                score: score,
                totalQuestions: totalQuestions,
                percentage: percentage,
                timeTaken: timeTaken,
                date: entryDate.toISOString(),
                category: categories[Math.floor(Math.random() * categories.length)],
                difficulty: difficulties[Math.floor(Math.random() * difficulties.length)]
            });
        }
        
        return sampleData.sort((a, b) => {
            if (b.percentage === a.percentage) {
                return a.timeTaken - b.timeTaken;
            }
            return b.percentage - a.percentage;
        });
    }

    // Initialize leaderboard display
    initializeLeaderboard() {
        this.leaderboardData = this.getStoredLeaderboard();
        this.renderTopWinners();
        this.renderLeaderboard();
        this.updateDashboard();
    }

    // Render top 3 winners
    renderTopWinners() {
        const topWinnersContainer = document.getElementById('top-winners');
        const filteredData = this.filterDataByPeriod(this.currentFilter);
        
        if (filteredData.length === 0) {
            topWinnersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <h3>No Champions Yet</h3>
                    <p>Be the first to claim the throne!</p>
                    <a href="game.html" class="play-now-btn">Start Playing</a>
                </div>
            `;
            return;
        }

        const top3 = filteredData.slice(0, 3);
        const rankings = ['🥇', '🥈', '🥉'];
        const cardClasses = ['winner-first', 'winner-second', 'winner-third'];
        
        let winnersHTML = '';
        
        for (let i = 0; i < Math.min(3, top3.length); i++) {
            const winner = top3[i];
            const avatar = this.getAvatarForUser(winner.name);
            const formatTime = this.formatTime(winner.timeTaken);
            const formatDate = this.formatDate(winner.date);
            
            winnersHTML += `
                <div class="winner-card ${cardClasses[i]}">
                    <div class="winner-rank">${rankings[i]}</div>
                    <div class="winner-avatar">${avatar}</div>
                    <div class="winner-name">${this.truncateName(winner.name)}</div>
                    <div class="winner-score">${winner.percentage}%</div>
                    <div class="winner-details">
                        <div>${winner.score}/${winner.totalQuestions} correct</div>
                        <div>Time: ${formatTime}</div>
                        <div>Date: ${formatDate}</div>
                        <div>Category: ${winner.category}</div>
                    </div>
                </div>
            `;
        }
        
        topWinnersContainer.innerHTML = winnersHTML;
    }

    // Render full leaderboard
    renderLeaderboard() {
        const leaderboardContainer = document.getElementById('leaderboard-container');
        const filteredData = this.filterDataByPeriod(this.currentFilter);
        
        if (filteredData.length === 0) {
            leaderboardContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <h3>No Data Available</h3>
                    <p>No quiz results found for the selected time period.</p>
                    <a href="game.html" class="play-now-btn">Play Now</a>
                </div>
            `;
            return;
        }

        let leaderboardHTML = '';
        
        filteredData.forEach((entry, index) => {
            const rank = index + 1;
            const avatar = this.getAvatarForUser(entry.name);
            const formatTime = this.formatTime(entry.timeTaken);
            const formatDate = this.formatDate(entry.date);
            
            let rankClass = '';
            if (rank === 1) rankClass = 'rank-1';
            else if (rank === 2) rankClass = 'rank-2';
            else if (rank === 3) rankClass = 'rank-3';
            
            leaderboardHTML += `
                <div class="player-row">
                    <div class="player-rank ${rankClass}">${rank}</div>
                    <div class="player-info">
                        <div class="player-avatar">${avatar}</div>
                        <div class="player-details">
                            <h3>${this.truncateName(entry.name)}</h3>
                            <div class="player-stats">
                                <span class="stat-item">
                                    <i class="fas fa-bullseye"></i>
                                    ${entry.score}/${entry.totalQuestions}
                                </span>
                                <span class="stat-item">
                                    <i class="fas fa-clock"></i>
                                    ${formatTime}
                                </span>
                                <span class="stat-item">
                                    <i class="fas fa-calendar"></i>
                                    ${formatDate}
                                </span>
                                <span class="stat-item">
                                    <i class="fas fa-tag"></i>
                                    ${entry.category}
                                </span>
                            </div>
                            <div class="performance-bar">
                                <div class="performance-fill" style="width: ${entry.percentage}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="player-score">${entry.percentage}%</div>
                </div>
            `;
        });
        
        leaderboardContainer.innerHTML = leaderboardHTML;
    }

    // Update dashboard statistics
    updateDashboard() {
        const filteredData = this.filterDataByPeriod(this.currentFilter);
        
        let totalPlayers = filteredData.length;
        let highestScore = 0;
        let totalAccuracy = 0;

        if (filteredData.length > 0) {
            highestScore = Math.max(...filteredData.map(entry => entry.percentage));
            totalAccuracy = Math.round(
                filteredData.reduce((sum, entry) => sum + entry.percentage, 0) / filteredData.length
            );
        }

        // Animate counter updates
        this.animateCounter('total-players', totalPlayers);
        this.animateCounter('highest-score', highestScore, '%');
        this.animateCounter('average-accuracy', totalAccuracy, '%');
    }

    // Animate counter values
    animateCounter(elementId, targetValue, suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const currentValue = parseInt(element.textContent) || 0;
        const increment = Math.ceil((targetValue - currentValue) / 20);
        
        if (currentValue < targetValue) {
            const timer = setInterval(() => {
                const current = parseInt(element.textContent) || 0;
                const next = Math.min(current + increment, targetValue);
                element.textContent = next + suffix;
                
                if (next >= targetValue) {
                    clearInterval(timer);
                }
            }, 50);
        } else {
            element.textContent = targetValue + suffix;
        }
    }

    // Filter data by time period
    filterDataByPeriod(period) {
        const now = new Date();
        
        return this.leaderboardData.filter(entry => {
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

    // Get consistent avatar for user
    getAvatarForUser(username) {
        // Generate consistent avatar based on username hash
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            const char = username.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        const index = Math.abs(hash) % this.avatarEmojis.length;
        return this.avatarEmojis[index];
    }

    // Format time display
    formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
        }
    }

    // Format date display
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Truncate long names
    truncateName(name, maxLength = 15) {
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength) + '...';
    }

    // Refresh leaderboard data
    refreshData() {
        this.leaderboardData = this.getStoredLeaderboard();
        this.renderTopWinners();
        this.renderLeaderboard();
        this.updateDashboard();
    }
}

// Filter switching function
function switchFilter(buttonElement, period) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    buttonElement.classList.add('active');
    
    // Update leaderboard
    window.leaderboardManager.currentFilter = period;
    window.leaderboardManager.renderTopWinners();
    window.leaderboardManager.renderLeaderboard();
    window.leaderboardManager.updateDashboard();
}

// Auto-refresh functionality
function setupAutoRefresh() {
    // Refresh every 30 seconds to catch new quiz completions
    setInterval(() => {
        if (window.leaderboardManager) {
            window.leaderboardManager.refreshData();
        }
    }, 30000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Create global leaderboard manager instance
    window.leaderboardManager = new LeaderboardManager();
    
    // Setup auto-refresh
    setupAutoRefresh();
    
    // Add some loading effects
    setTimeout(() => {
        document.querySelectorAll('.winner-card, .player-row').forEach((element, index) => {
            element.style.animationDelay = `${index * 0.1}s`;
            element.classList.add('fade-in');
        });
    }, 500);
    
    // Add click handlers for winner cards
    document.addEventListener('click', (e) => {
        const winnerCard = e.target.closest('.winner-card');
        if (winnerCard) {
            winnerCard.style.transform = 'scale(0.95)';
            setTimeout(() => {
                winnerCard.style.transform = '';
            }, 150);
        }
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'r' || e.key === 'R') {
            window.leaderboardManager.refreshData();
        }
        
        // Number keys to switch filters
        if (e.key >= '1' && e.key <= '3') {
            const filterButtons = document.querySelectorAll('.filter-btn');
            const index = parseInt(e.key) - 1;
            if (filterButtons[index]) {
                filterButtons[index].click();
            }
        }
    });
});

// Add CSS animation for fade-in effect
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        animation: slideInUp 0.6s ease-out forwards;
        opacity: 0;
        transform: translateY(30px);
    }
    
    @keyframes slideInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .winner-card:active {
        transform: scale(0.95) !important;
        transition: transform 0.1s ease;
    }
    
    .player-row:hover .performance-fill::after {
        animation-duration: 1s;
    }
`;
document.head.appendChild(style);

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardManager;
}