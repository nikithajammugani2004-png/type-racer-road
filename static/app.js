document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('server-status');
    const canvas = document.getElementById('roadCanvas');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const typeInput = document.getElementById('typeInput');
    const difficultySelect = document.getElementById('difficultySelect');

    const scoreVal = document.getElementById('scoreVal');
    const accuracyVal = document.getElementById('accuracyVal');
    const missedVal = document.getElementById('missedVal');
    
    const gameOverModal = document.getElementById('gameOverModal');
    const finalScoreEl = document.getElementById('finalScore');
    const finalAccuracyEl = document.getElementById('finalAccuracy');
    const playerNameInput = document.getElementById('playerNameInput');
    const submitScoreBtn = document.getElementById('submitScoreBtn');
    const leaderboardList = document.getElementById('leaderboardList');

    let isGameRunning = false;
    let isGamePaused = false;
    let dashOffset = 0;

    // Game State Variables
    let wordQueue = [];
    let activeWords = [];
    let usedWords = new Set();
    let lastLaneY = 280; // Toggle state for top (120) / bottom (280) zigzag pattern
    let spawnTimer = null;
    
    let missedCount = 0;
    const MAX_MISSED = 25;

    let score = 0;
    let totalTypedChars = 0;
    let correctTypedChars = 0;

    // Dynamic Difficulty Parameters
    let wordSpeed = 0.8;
    let spawnInterval = 2800;

    const ROAD_TOP_Y = 40;
    const ROAD_HEIGHT = canvas.height - 80;
    const FINISH_LINE_X = canvas.width - 40;

    // Configure difficulty speed & spawn rate
    function configureDifficulty(selectedDifficulty) {
        if (selectedDifficulty === "hard") {
            wordSpeed = 0.8;
            spawnInterval = 2800;
        } else if (selectedDifficulty === "medium") {
            wordSpeed = 0.6;
            spawnInterval = 3200;
        } else {
            wordSpeed = 0.4;
            spawnInterval = 3800;
        }
    }

    // Fetch words based on difficulty
    async function fetchWords(difficulty = "easy") {
        try {
            const res = await fetch(`/api/words?difficulty=${difficulty}&count=40`);
            const data = await res.json();
            return data.words || [];
        } catch (err) {
            console.error("Failed to fetch words:", err);
            return ["cyber", "turbo", "hyper", "neon", "drive", "circuit", "pulse", "matrix"];
        }
    }

    // Load Leaderboard from backend
    async function loadLeaderboard() {
        try {
            const res = await fetch('/api/leaderboard');
            const data = await res.json();
            leaderboardList.innerHTML = '';
            
            if (data.leaderboard && data.leaderboard.length > 0) {
                data.leaderboard.forEach(entry => {
                    const li = document.createElement('li');
                    li.textContent = `${entry.player_name} — ${entry.score} PTS (${entry.accuracy}% ACC)`;
                    leaderboardList.appendChild(li);
                });
            } else {
                leaderboardList.innerHTML = '<li>No hall of fame scores recorded yet.</li>';
            }
        } catch (err) {
            console.error("Failed to load leaderboard:", err);
        }
    }

    // Smooth, Non-blocking Zigzag Spawning
    function spawnWord() {
        if (!isGameRunning || isGamePaused) return;

        // Pre-fetch more words asynchronously when queue gets low
        const currentDiff = difficultySelect.value;
        if (wordQueue.length < 10) {
            fetchWords(currentDiff).then(newWords => {
                newWords.forEach(w => {
                    if (!usedWords.has(w)) {
                        wordQueue.push(w);
                        usedWords.add(w);
                    }
                });
                // Reset set if memory gets full to prevent stopping
                if (usedWords.size > 500) usedWords.clear();
            });
        }

        if (wordQueue.length === 0) return;

        // Alternate Top (120) and Bottom (280) lanes smoothly
        const nextLaneY = lastLaneY === 120 ? 280 : 120;

        // Ensure there is at least 180px of clear road in front before placing a new word
        const wordsInLane = activeWords.filter(w => w.y === nextLaneY);
        if (wordsInLane.length > 0) {
            const trailingWord = wordsInLane[wordsInLane.length - 1];
            if (trailingWord.x < 180) {
                return; // Wait for space without freezing the frame
            }
        }

        const text = wordQueue.shift();
        lastLaneY = nextLaneY;

        activeWords.push({
            id: Date.now() + Math.random(),
            text: text,
            x: -50, // Smoothly slide in from off-screen left
            y: nextLaneY
        });
    }

    // Update HUD Metrics
    function updateHUD() {
        scoreVal.textContent = score;
        missedVal.textContent = `${missedCount} / ${MAX_MISSED}`;

        if (totalTypedChars === 0) {
            accuracyVal.textContent = "100%";
        } else {
            const acc = Math.round((correctTypedChars / totalTypedChars) * 100);
            accuracyVal.textContent = `${Math.max(0, acc)}%`;
        }
    }

    // Target Selection: Get active word closest to finish line
    function getTargetWord() {
        if (activeWords.length === 0) return null;
        return activeWords.reduce((closest, word) => word.x > closest.x ? word : closest, activeWords[0]);
    }

    // Typing Event Handler with +20 / -10 Scoring Rules
    typeInput.addEventListener('input', () => {
        if (!isGameRunning || isGamePaused) return;

        const typedText = typeInput.value.trim();
        const targetWord = getTargetWord();

        if (!targetWord) return;

        totalTypedChars++;

        const charIndex = typedText.length - 1;
        if (charIndex >= 0 && typedText[charIndex] === targetWord.text[charIndex]) {
            correctTypedChars++;
        }

        if (typedText === targetWord.text) {
            score += 20; // +20 points for typing correctly
            activeWords = activeWords.filter(w => w.id !== targetWord.id);
            typeInput.value = "";
        }

        updateHUD();
    });

    typeInput.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            // Penalty for clearing/submitting incorrect word
            if (typeInput.value.trim().length > 0) {
                score = Math.max(0, score - 10); // -10 points for wrong word submitted
                updateHUD();
            }
            typeInput.value = "";
        }
    });

    // Draw Cyberpunk Road Background
    function drawRoad() {
        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = "#05060f";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(0, 240, 255, 0.08)";
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, ROAD_TOP_Y);
            ctx.moveTo(x, ROAD_TOP_Y + ROAD_HEIGHT);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        ctx.fillStyle = "#121524";
        ctx.fillRect(0, ROAD_TOP_Y, width, ROAD_HEIGHT);

        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 12;
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 4;
        
        ctx.beginPath();
        ctx.moveTo(0, ROAD_TOP_Y);
        ctx.lineTo(width, ROAD_TOP_Y);
        ctx.moveTo(0, ROAD_TOP_Y + ROAD_HEIGHT);
        ctx.lineTo(width, ROAD_TOP_Y + ROAD_HEIGHT);
        ctx.stroke();

        const midY = ROAD_TOP_Y + ROAD_HEIGHT / 2;
        ctx.shadowColor = "#ffcc00";
        ctx.shadowBlur = 10;
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 3;
        ctx.setLineDash([25, 15]);
        ctx.lineDashOffset = -dashOffset;
        
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(width, midY);
        ctx.stroke();
        
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        const tileSize = 10;
        for (let y = ROAD_TOP_Y; y < ROAD_TOP_Y + ROAD_HEIGHT; y += tileSize) {
            for (let x = FINISH_LINE_X; x < FINISH_LINE_X + 20; x += tileSize) {
                const isMagenta = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
                ctx.fillStyle = isMagenta ? "#ff0055" : "#0d0f1d";
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }
    }

    // Update word movement & check missed penalties
    function updateWords() {
        for (let i = activeWords.length - 1; i >= 0; i--) {
            const word = activeWords[i];
            word.x += wordSpeed;

            ctx.font = "bold 20px 'Orbitron', monospace";
            const textWidth = ctx.measureText(word.text).width;
            
            if (word.x + textWidth >= FINISH_LINE_X) {
                missedCount++;
                score = Math.max(0, score - 10); // -10 points for missed word
                activeWords.splice(i, 1);
                updateHUD();

                if (missedCount >= MAX_MISSED) {
                    endGame();
                    break;
                }
            }
        }
    }

    // Render word badges
    function drawWords() {
        ctx.font = "bold 20px 'Orbitron', monospace";
        const currentTarget = getTargetWord();
        const currentTyped = typeInput.value;

        activeWords.forEach(word => {
            const textWidth = ctx.measureText(word.text).width;
            const isTarget = currentTarget && currentTarget.id === word.id;

            ctx.fillStyle = "rgba(8, 10, 20, 0.9)";
            ctx.beginPath();
            ctx.roundRect(word.x - 10, word.y - 24, textWidth + 20, 36, 6);
            ctx.fill();

            if (isTarget) {
                ctx.shadowColor = "#ffcc00";
                ctx.shadowBlur = 12;
                ctx.strokeStyle = "#ffcc00";
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowBlur = 0;
            } else {
                ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            let currentX = word.x;

            for (let i = 0; i < word.text.length; i++) {
                const char = word.text[i];
                const charWidth = ctx.measureText(char).width;

                if (isTarget && i < currentTyped.length) {
                    if (currentTyped[i] === char) {
                        ctx.fillStyle = "#00ff66";
                    } else {
                        ctx.fillStyle = "#ff0055";
                    }
                } else {
                    ctx.fillStyle = "#ffffff";
                }

                ctx.fillText(char, currentX, word.y);
                currentX += charWidth;
            }

            if (isTarget && currentTyped.length > word.text.length) {
                const extraText = currentTyped.substring(word.text.length);
                ctx.fillStyle = "#ff0055";
                ctx.fillText(extraText, currentX, word.y);
            }
        });
    }

    // Render Pause Overlay
    function drawPauseOverlay() {
        ctx.fillStyle = "rgba(5, 6, 12, 0.75)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 15;
        ctx.font = "bold 36px 'Orbitron', monospace";
        ctx.fillStyle = "#00f0ff";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
        
        ctx.shadowBlur = 0;
        ctx.font = "14px 'Orbitron', monospace";
        ctx.fillStyle = "#8a99ad";
        ctx.fillText("CLICK RESUME TO CONTINUE RACE", canvas.width / 2, canvas.height / 2 + 35);
        ctx.textAlign = "left";
    }

    // Main Game Loop
    function render() {
        if (isGameRunning && !isGamePaused) {
            dashOffset = (dashOffset + 2.5) % 40;
            updateWords();
        }
        
        drawRoad();
        drawWords();

        if (isGamePaused) {
            drawPauseOverlay();
        }
        
        requestAnimationFrame(render);
    }

    // Toggle Pause / Resume
    function togglePause() {
        if (!isGameRunning) return;

        isGamePaused = !isGamePaused;

        if (isGamePaused) {
            clearInterval(spawnTimer);
            typeInput.disabled = true;
            pauseBtn.textContent = "RESUME";
            pauseBtn.style.background = "linear-gradient(135deg, #00ff66 0%, #009933 100%)";
        } else {
            typeInput.disabled = false;
            typeInput.focus();
            pauseBtn.textContent = "PAUSE";
            pauseBtn.style.background = "linear-gradient(135deg, #00f0ff 0%, #0077ff 100%)";
            spawnTimer = setInterval(spawnWord, spawnInterval);
        }
    }

    pauseBtn.addEventListener('click', togglePause);

    // End Game Handler
    function endGame() {
        isGameRunning = false;
        isGamePaused = false;
        clearInterval(spawnTimer);
        typeInput.disabled = true;
        pauseBtn.disabled = true;
        pauseBtn.textContent = "PAUSE";
        pauseBtn.style.background = "linear-gradient(135deg, #00f0ff 0%, #0077ff 100%)";
        difficultySelect.disabled = false;

        const finalAcc = totalTypedChars === 0 ? 100 : Math.max(0, Math.round((correctTypedChars / totalTypedChars) * 100));
        
        finalScoreEl.textContent = score;
        finalAccuracyEl.textContent = `${finalAcc}%`;
        gameOverModal.classList.remove('hidden');
    }

    // Submit Score Handler
    submitScoreBtn.addEventListener('click', async () => {
        const name = playerNameInput.value.trim() || "DRIVER_X";
        const finalAcc = totalTypedChars === 0 ? 100 : Math.max(0, Math.round((correctTypedChars / totalTypedChars) * 100));

        try {
            await fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_name: name,
                    score: score,
                    accuracy: finalAcc
                })
            });
            
            gameOverModal.classList.add('hidden');
            loadLeaderboard();
            
            startGame();
        } catch (err) {
            console.error("Failed to submit score:", err);
        }
    });

    // Start Game
    async function startGame() {
        isGameRunning = false;
        isGamePaused = false;
        clearInterval(spawnTimer);
        
        const selectedDifficulty = difficultySelect.value;
        configureDifficulty(selectedDifficulty);
        difficultySelect.disabled = true;

        activeWords = [];
        usedWords.clear();
        lastLaneY = 280;
        missedCount = 0;
        score = 0;
        totalTypedChars = 0;
        correctTypedChars = 0;
        
        typeInput.value = "";
        updateHUD();
        
        wordQueue = await fetchWords(selectedDifficulty);
        
        isGameRunning = true;
        typeInput.disabled = false;
        pauseBtn.disabled = false;
        pauseBtn.textContent = "PAUSE";
        pauseBtn.style.background = "linear-gradient(135deg, #00f0ff 0%, #0077ff 100%)";
        typeInput.focus();
        startBtn.textContent = "RESTART RACE";

        spawnWord();
        spawnTimer = setInterval(spawnWord, spawnInterval);
    }

    startBtn.addEventListener('click', startGame);

    // Initial Setup Check
    fetch('/api/words?count=5')
        .then(res => res.json())
        .then(() => {
            statusEl.textContent = "ONLINE";
            statusEl.style.color = "#00ff66";
        })
        .catch(() => {
            statusEl.textContent = "OFFLINE";
            statusEl.style.color = "#ff0055";
        });

    loadLeaderboard();
    render();
});