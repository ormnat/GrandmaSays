// script.js
// Use a self-invoking function to prevent global scope pollution
(function() {
    // --- DOM Elements ---
    const marigoldBtn = document.getElementById('marigold');
    const skullBtn = document.getElementById('skull');
    const candleBtn = document.getElementById('candle');
    const crossBtn = document.getElementById('cross');
    const startBtn = document.getElementById('start-btn');
    const roundDisplay = document.getElementById('round-display');
    const messageArea = document.getElementById('message-area');
    const hiddenNumber = document.getElementById('hidden-number'); // Reference to the number element

    // --- Game State Variables ---
    // The color names are updated to match the new theme IDs
    const colors = ['marigold', 'skull', 'candle', 'cross'];
    let sequence = [];
    let playerSequence = [];
    let round = 0;
    let isPlayerTurn = false;
    let canClick = false;
    const maxRounds = 10;

    // --- Audio Setup (Web Audio API) ---
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillators = {};

    const createOscillator = (frequency) => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        return oscillator;
    };

    // Pre-create oscillators and gain nodes for each button
    const colorSounds = {
        // Frequencies are kept the same for game consistency
        'marigold': { freq: 329.63, osc: createOscillator(329.63) }, // E4
        'skull': { freq: 440.00, osc: createOscillator(440.00) }, // A4
        'candle': { freq: 392.00, osc: createOscillator(392.00) }, // G4
        'cross': { freq: 261.63, osc: createOscillator(261.63) }, // C4
    };

    const playSound = (color, duration = 200) => {
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration / 1000);

        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = colorSounds[color].freq;
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    };

    const playWinSound = () => {
        const now = audioContext.currentTime;
        const gain = audioContext.createGain();
        gain.connect(audioContext.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.5);

        const osc1 = audioContext.createOscillator();
        osc1.frequency.value = 523.25; // C5
        osc1.type = 'triangle';
        osc1.connect(gain);
        osc1.start(now);
        osc1.stop(now + 0.5);

        const osc2 = audioContext.createOscillator();
        osc2.frequency.value = 659.25; // E5
        osc2.type = 'triangle';
        osc2.connect(gain);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.5);

        const osc3 = audioContext.createOscillator();
        osc3.frequency.value = 783.99; // G5
        osc3.type = 'triangle';
        osc3.connect(gain);
        osc3.start(now + 0.2);
        osc3.stop(now + 0.5);
    };
    
    const playLoseSound = () => {
        const now = audioContext.currentTime;
        const gain = audioContext.createGain();
        gain.connect(audioContext.destination);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

        const osc = audioContext.createOscillator();
        osc.frequency.value = 100; // Low frequency for a "buzz" sound
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.5);
    };

    // --- Game Logic ---
    const startGame = () => {
        // Reset game state
        sequence = [];
        playerSequence = [];
        round = 0;
        isPlayerTurn = false;
        canClick = false;

        // Hide start button, clear message area
        startBtn.style.display = 'none';
        messageArea.textContent = '';
        roundDisplay.textContent = `Round ${round}`;

        // Wait a moment before starting the first round
        setTimeout(nextRound, 1000);
    };

    const nextRound = () => {
        // Check if the game is won
        if (round >= maxRounds) {
            celebration();
            return;
        }

        round++;
        roundDisplay.textContent = `Round ${round}`;
        playerSequence = [];
        isPlayerTurn = false;
        canClick = false;
        
        // Add a random color to the sequence
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        sequence.push(randomColor);

        // Play the entire sequence
        playSequence(0);
    };

    const playSequence = (index) => {
        if (index < sequence.length) {
            const color = sequence[index];
            const button = document.getElementById(color);

            // Light up the button and play the sound
            button.classList.add('lit');
            playSound(color);

            setTimeout(() => {
                button.classList.remove('lit');
                setTimeout(() => {
                    playSequence(index + 1);
                }, 150); // Pause between flashes, shortened to 150ms
            }, 300); // How long the button stays lit, shortened to 300ms
        } else {
            // Sequence is finished, it's the player's turn
            isPlayerTurn = true;
            canClick = true;
        }
    };

    const handleButtonClick = (event) => {
        if (!isPlayerTurn || !canClick) {
            return; // Ignore clicks if it's not the player's turn or if a sequence is playing
        }

        const clickedColor = event.target.closest('.calavera-button').id;
        playerSequence.push(clickedColor);
        
        // Play the sound and light up the button briefly
        event.target.closest('.calavera-button').classList.add('lit');
        playSound(clickedColor);
        setTimeout(() => {
            event.target.closest('.calavera-button').classList.remove('lit');
        }, 200);

        checkPattern();
    };

    const checkPattern = () => {
        const currentIndex = playerSequence.length - 1;
        
        // Check if the last clicked color is correct
        if (playerSequence[currentIndex] !== sequence[currentIndex]) {
            // Incorrect sequence
            endGame();
            return;
        }

        // Correct so far, check if the player has finished the round
        if (playerSequence.length === sequence.length) {
            isPlayerTurn = false;
            canClick = false;
            setTimeout(nextRound, 1000); // Wait a second before the next round
        }
    };

    const endGame = () => {
        playLoseSound();
        messageArea.textContent = 'I thought you were smart...';
        startBtn.style.display = 'block';
        isPlayerTurn = false;
        canClick = false;
    };

    const celebration = () => {
        playWinSound();
        messageArea.textContent = 'You did it! Your memory is as sharp as a tack, just like Grandma\'s.';
        startBtn.style.display = 'block';
    };

    // --- Event Listeners ---
    startBtn.addEventListener('click', startGame);
    document.querySelectorAll('.calavera-button').forEach(button => {
        button.addEventListener('click', handleButtonClick);
    });
})();
