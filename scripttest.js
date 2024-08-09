const contractABI = [
    // Copiez l'ABI du fichier build/contracts/PlayerProgress.json ici
];

const contractAddress = '0x...'; // Remplacez par l'adresse du contrat déployé

let web3;
let playerProgress;
let accounts;

window.onload = async () => {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            // Demander la connexion à MetaMask
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            accounts = await web3.eth.getAccounts();
            playerProgress = new web3.eth.Contract(contractABI, contractAddress);
            console.log('Connected accounts:', accounts);
        } catch (error) {
            console.error("User denied account access");
        }
    } else {
        alert('MetaMask not detected');
        return;
    }
};

document.getElementById('newGame').addEventListener('click', async () => {
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    promptPlayerName();
    await registerPlayer();
    update();
});

document.getElementById('loadGame').addEventListener('click', async () => {
    await loadPlayerProgress();
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'block';
    update();
});

async function registerPlayer() {
    await playerProgress.methods.registerPlayer(player.name).send({ from: accounts[0] });
}

async function savePlayerProgress() {
    const questNames = quests.filter(quest => quest.completed).map(quest => quest.name);
    await playerProgress.methods.saveProgress(player.health, questNames).send({ from: accounts[0] });
}

async function loadPlayerProgress() {
    const result = await playerProgress.methods.getPlayerProgress(accounts[0]).call();
    const [name, health, completedQuests] = result;
    player.name = name;
    player.health = health;
    quests.forEach(quest => {
        quest.completed = completedQuests.includes(quest.name);
    });
    update();
}

// Le reste de votre code existant, y compris les définitions de fonctions et la logique du jeu.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menuScreen = document.getElementById('menuScreen');
const battleScreen = document.getElementById('battleScreen');
const wordToType = document.getElementById('wordToType');
const typeInput = document.getElementById('typeInput');
const battleResult = document.getElementById('battleResult');
const playerHP = document.getElementById('playerHP');
const enemyHP = document.getElementById('enemyHP');
const enemyProgress = document.getElementById('enemyProgress');
let inBattle = false;

const player = {
    name: '',
    x: canvas.width / 2 - 25,
    y: canvas.height / 2 - 25,
    width: 50,
    height: 50,
    color: 'blue',
    speed: 5,
    dx: 0,
    dy: 0,
    health: 100,
    maxHealth: 100,
    level: 1,
    xp: 0
};

const enemies = [
    { x: 100, y: 100, width: 50, height: 50, color: 'red', health: 50, maxHealth: 50, words: ['attack', 'defend', 'strike'], speed: 3000 },
    { x: 300, y: 200, width: 50, height: 50, color: 'red', health: 50, maxHealth: 50, words: ['parry', 'dodge', 'slash'], speed: 3000 },
    { x: 500, y: 300, width: 50, height: 50, color: 'red', health: 50, maxHealth: 50, words: ['block', 'thrust', 'lunge'], speed: 3000 },
];

const quests = [
    { x: 700, y: 100, width: 30, height: 30, color: 'green', completed: false, name: 'First Quest' },
    { x: 200, y: 200, width: 30, height: 30, color: 'green', completed: false, name: 'Second Quest' },
    // Ajoutez plus de quêtes ici
];

let currentEnemy = null;
let enemyInterval = null;
let enemyTypingTimeout = null;

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = 'black';
    ctx.fillText(`HP: ${player.health}`, player.x, player.y - 10);
}

function drawEnemies() {
    enemies.forEach((enemy) => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.fillStyle = 'black';
        ctx.fillText(`HP: ${enemy.health}`, enemy.x, enemy.y - 10);
    });
}

function drawQuests() {
    quests.forEach((quest) => {
        if (!quest.completed) {
            ctx.fillStyle = quest.color;
            ctx.fillRect(quest.x, quest.y, quest.width, quest.height);
        }
    });
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function newPos() {
    player.x += player.dx;
    player.y += player.dy;

    detectWalls();
}

function detectWalls() {
    if (player.x < 0) {
        player.x = 0;
    }

    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }

    if (player.y < 0) {
        player.y = 0;
    }

    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
    }
}

function detectEnemyCollision() {
    enemies.forEach((enemy) => {
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y &&
            !inBattle
        ) {
            startBattle(enemy);
        }
    });
}

function detectQuestCollision() {
    quests.forEach((quest) => {
        if (
            player.x < quest.x + quest.width &&
            player.x + player.width > quest.x &&
            player.y < quest.y + quest.height &&
            player.y + player.height > quest.y &&
            !quest.completed
        ) {
            console.log('Quest completed!');
            completeQuest(quest);
        }
    });
}

function completeQuest(quest) {
    quest.completed = true;
    player.xp += 10;
    levelUp();
    savePlayerProgress(); // Sauvegarder les progrès du joueur après avoir complété une quête
}

function levelUp() {
    if (player.xp >= 100) {
        player.level += 1;
        player.xp = 0;
        player.speed += 1;
        player.maxHealth += 20;
        player.health = player.maxHealth;
        console.log('Level up!');
    }
}

function startBattle(enemy) {
    inBattle = true;
    currentEnemy = enemy;
    battleScreen.style.display = 'block';
    typeInput.value = '';
    typeInput.focus();
    wordToType.innerText = enemy.words[Math.floor(Math.random() * enemy.words.length)];
    updateBattleUI();
    startEnemyTyping();
}

function startEnemyTyping() {
    let progress = 0;
    enemyProgress.innerText = `Enemy Progress: ${progress}%`;
    enemyTypingTimeout = setInterval(() => {
        if (!inBattle) return;
        progress += 10;
        enemyProgress.innerText = `Enemy Progress: ${progress}%`;
        if (progress >= 100) {
            clearInterval(enemyTypingTimeout);
            player.health -= 10;
            typeInput.value = '';
            progress = 0;
            updateBattleUI();
            if (player.health <= 0) {
                battleResult.innerText = 'You lost the battle!';
                endBattle(false);
            } else {
                wordToType.innerText = currentEnemy.words[Math.floor(Math.random() * currentEnemy.words.length)];
                startEnemyTyping();
            }
        }
    }, currentEnemy.speed / 10);
}

function endBattle(playerWon) {
    clearInterval(enemyInterval);
    clearInterval(enemyTypingTimeout);
    inBattle = false;
    battleScreen.style.display = 'none';
    if (playerWon) {
        enemies.splice(enemies.indexOf(currentEnemy), 1);
        player.xp += 20;
        levelUp();
        savePlayerProgress(); // Sauvegarder les progrès du joueur après avoir gagné un combat
    } else {
        alert('Game Over');
        resetGame();
    }
    currentEnemy = null;
    update();
}

function updateBattleUI() {
    playerHP.innerText = `Player HP: ${player.health}`;
    enemyHP.innerText = `Enemy HP: ${currentEnemy.health}`;
}

typeInput.addEventListener('input', () => {
    if (typeInput.value === wordToType.innerText) {
        currentEnemy.health -= 10;
        typeInput.value = '';
        updateBattleUI();
        if (currentEnemy.health <= 0) {
            battleResult.innerText = 'You won the battle!';
            endBattle(true);
        } else {
            wordToType.innerText = currentEnemy.words[Math.floor(Math.random() * currentEnemy.words.length)];
            startEnemyTyping();
        }
    }
});

function update() {
    if (inBattle) return;
    clear();

    drawPlayer();
    drawEnemies();
    drawQuests();

    newPos();

    detectWalls();
    detectEnemyCollision();
    detectQuestCollision();

    requestAnimationFrame(update);
}

function moveUp() {
    player.dy = -player.speed;
}

function moveDown() {
    player.dy = player.speed;
}

function moveRight() {
    player.dx = player.speed;
}

function moveLeft() {
    player.dx = -player.speed;
}

function keyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'Right') {
        moveRight();
    } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        moveLeft();
    } else if (e.key === 'ArrowUp' || e.key === 'Up') {
        moveUp();
    } else if (e.key === 'ArrowDown' || e.key === 'Down') {
        moveDown();
    }
}

function keyUp(e) {
    if (
        e.key === 'ArrowRight' ||
        e.key === 'Right' ||
        e.key === 'ArrowLeft' ||
        e.key === 'Left' ||
        e.key === 'ArrowUp' ||
        e.key === 'Up' ||
        e.key === 'ArrowDown' ||
        e.key === 'Down'
    ) {
        player.dx = 0;
        player.dy = 0;
    }
}

function promptPlayerName() {
    player.name = prompt("Enter your player name:");
    if (!player.name) {
        player.name = 'Hero';
    }
}

function resetGame() {
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height / 2 - 25;
    player.health = 100;
    player.maxHealth = 100;
    player.level = 1;
    player.xp = 0;
    player.speed = 5;
    inBattle = false;
    currentEnemy = null;
    enemies.length = 0;
    enemies.push(
        { x: 100, y: 100, width: 50, height: 50, color: 'red', health: 50, maxHealth: 50, words: ['attack', 'defend', 'strike'], speed: 3000 },
        { x: 300, y: 200, width: 50, height: 50, color: 'red', health: 50, maxHealth: 50, words: ['parry', 'dodge', 'slash'], speed: 3000 },
        { x: 500, y: 300, width: 50, height: 50, color: 'red', health: 50, maxHealth: 50, words: ['block', 'thrust', 'lunge'], speed: 3000 }
    );
    quests.forEach(quest => quest.completed = false);
    menuScreen.style.display = 'flex';
    canvas.style.display = 'none';
    battleScreen.style.display = 'none';
    update();
}

update();

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
