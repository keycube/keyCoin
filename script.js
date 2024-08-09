console.log('script.js is loaded');
const contractABI = [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "playerName",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "health",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "x",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "y",
          "type": "uint256"
        },
        {
          "internalType": "string[]",
          "name": "completedQuests",
          "type": "string[]"
        },
        {
          "internalType": "bool[]",
          "name": "enemiesDefeated",
          "type": "bool[]"
        }
      ],
      "name": "saveProgress",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "playerAddress",
          "type": "address"
        }
      ],
      "name": "getPlayerProgress",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "string[]",
          "name": "",
          "type": "string[]"
        },
        {
          "internalType": "bool[]",
          "name": "",
          "type": "bool[]"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    }
  ];

const contractAddress = '0xba0DEF175a5EbD815134a7F6Ca35771959F886bd';

let web3;
let playerProgress;
let accounts;

window.onload = async () => {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            accounts = await web3.eth.getAccounts();
            console.log('Connected accounts:', accounts);
            playerProgress = new web3.eth.Contract(contractABI, contractAddress);
            console.log('Contract:', playerProgress);
        } catch (error) {
            console.error("User denied account access", error);
            alert("Veuillez autoriser l'accès à MetaMask.");
        }
    } else {
        alert('MetaMask not detected');
        return;
    }

    document.getElementById('saveProgress').addEventListener('click', async () => {
        await savePlayerProgress();
        alert("Progress saved. You can now safely exit the game.");
    });
    document.getElementById('exitGame').addEventListener('click', async () => {
        location.reload();
    });
};


document.getElementById('newGame').addEventListener('click', async () => {
    const playerName = prompt("Entrez votre nom de joueur :");
    if (!playerName) {
        alert("Le nom du joueur ne peut pas être vide.");
        return;
    }
    player.name = playerName;
    document.getElementById('playerNameDisplay').innerText = `Nom du joueur: ${player.name}`; // Afficher le nom du joueur
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('gameInterface').style.display = 'block';
    update();
});

document.getElementById('loadGame').addEventListener('click', async () => {
    try {
        await loadPlayerProgress();
    } catch (error) {
        console.error("Failed to load player progress", error);
    }
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('gameInterface').style.display = 'block';
    update();
});

async function savePlayerProgress() {
    if (!playerProgress || !accounts) {
        console.error('Smart contract or accounts not initialized');
        return;
    }
    const questNames = quests.filter(quest => quest.completed).map(quest => quest.name);
    const enemiesDefeated = enemies.map(enemy => enemy.defeated);
    await playerProgress.methods.saveProgress(player.name, player.health, player.x, player.y, questNames, enemiesDefeated).send({ from: accounts[0] });
}


async function loadPlayerProgress() {
    if (!playerProgress || !accounts) {
        console.error('Smart contract or accounts not initialized');
        return;
    }
    try {
        const result = await playerProgress.methods.getPlayerProgress(accounts[0]).call();
        console.log("Result from blockchain:", result);
        
        const name = result[0];
        const health = result[1];
        const x = result[2];
        const y = result[3];
        const completedQuests = result[4];
        const enemiesDefeated = result[5];
        
        console.log("Parsed result:", { name, health, x, y, completedQuests, enemiesDefeated });

        player.name = name;
        player.health = parseInt(health);
        player.x = parseInt(x);
        player.y = parseInt(y);
        
        quests.forEach(quest => {
            quest.completed = completedQuests.includes(quest.name);
        });
        enemies.forEach((enemy, index) => {
            enemy.defeated = enemiesDefeated[index];
        });

        document.getElementById('playerNameDisplay').innerText = `Nom du joueur: ${player.name}`;
        update();
    } catch (error) {
        console.error("Failed to load player progress", error);
    }
}


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

const SPRITE_WIDTH = 48; // La largeur d'une seule frame du sprite sheet
const SPRITE_HEIGHT = 48; // La hauteur d'une seule frame du sprite sheet
const FRAME_COUNT = 4; // Nombre de frames par animation
let currentFrame = 0; // Frame actuelle de l'animation
let frameX = 0; // Colonne actuelle dans le sprite sheet
let frameY = 0;

const playerImage = new Image();
playerImage.src = 'spritesheet.png'; // Remplacez par le chemin de votre sprite sheet
const enemyImage = new Image();
enemyImage.src = 'bat.png';


const player = {
    name: '',
    x: canvas.width / 2 - 25,
    y: canvas.height / 2 - 25,
    width: SPRITE_WIDTH,
    height: SPRITE_HEIGHT,
    speed: 1,
    dx: 0,
    dy: 0,
    health: 100,
    maxHealth: 100,
    frameX: 0, // la colonne dans le sprite sheet
    frameY: 0, // la ligne dans le sprite sheet
    direction: 'down', // direction par défaut
    frameCount: 0, // compteur pour ralentir l'animation
    frameRate: 20 // vitesse de changement des frames
};

const directions = {
    down: 0,
    left: 1,
    right: 2,
    up: 3
};

const enemies = [
    { x: 100, y: 100, width: 50, height: 50, color: 'red', health: 50, maxHealth: 50, words: ['attack', 'defend', 'strike'], speed: 3000, defeated: false },
    { x: 300, y: 200, width: 50, height: 50, color: 'red', health: 50, maxHealth: 50, words: ['parry', 'dodge', 'slash'], speed: 3000, defeated: false },
    { x: 500, y: 300, width: 50, height: 50, color: 'red', health: 50, maxHealth: 50, words: ['block', 'thrust', 'lunge'], speed: 3000, defeated: false },
];

const quests = [
    { x: 700, y: 100, width: 30, height: 30, color: 'green', completed: false, name: 'First Quest' },
    { x: 200, y: 200, width: 30, height: 30, color: 'green', completed: false, name: 'Second Quest' },
    // Ajoutez plus de quêtes ici
];

function updatePlayerFrame() {
    if (player.dx !== 0 || player.dy !== 0) {
        player.frameCount++;
        if (player.frameCount >= player.frameRate) {
            player.frameCount = 0;
            player.frameY = (player.frameY + 1) % FRAME_COUNT; // Passer à la frame suivante dans la colonne
        }
    } else {
        player.frameX = 0; // Réinitialiser à la première frame pour l'arrêt
        player.frameY = 0; // Réinitialiser à la première frame pour l'arrêt
    }
}

let currentEnemy = null;
let enemyInterval = null;
let enemyTypingTimeout = null;

function drawPlayer() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Nettoyer l'ancien dessin

    // Dessiner l'image du joueur
    ctx.drawImage(
        playerImage,
        player.frameX * player.width, // Source X
        player.frameY * player.height, // Source Y
        player.width, // Largeur source
        player.height, // Hauteur source
        player.x, // Destination X
        player.y, // Destination Y
        player.width, // Largeur destination
        player.height // Hauteur destination
    );

    ctx.fillStyle = 'black';
    ctx.fillText(`HP: ${player.health}`, player.x, player.y - 10);
}

const ENEMY_FRAME_WIDTH = 32; // Largeur de chaque frame
const ENEMY_FRAME_HEIGHT = 32; // Hauteur de chaque frame
const ENEMY_FRAME_COUNT = 3; // Nombre total de frames

enemies.forEach((enemy) => {
    enemy.frameX = 0; // Frame initiale
    enemy.frameCount = 0; // Compteur de frames
    enemy.frameRate = 10; // Vitesse de l'animation (plus c'est bas, plus c'est rapide)
});

function updateEnemyFrames() {
    enemies.forEach((enemy) => {
        if (!enemy.defeated) {
            enemy.frameCount++;
            if (enemy.frameCount >= enemy.frameRate) {
                enemy.frameCount = 0;
                enemy.frameX = (enemy.frameX + 1) % ENEMY_FRAME_COUNT; // Passer à la frame suivante
            }
        }
    });
}


function drawEnemies() {
    enemies.forEach((enemy) => {
        if (!enemy.defeated) {
            ctx.drawImage(
                enemyImage,
                enemy.frameX * ENEMY_FRAME_WIDTH, // Source X: sélection de la bonne frame
                0, // Source Y: si toutes les frames sont sur une seule ligne
                ENEMY_FRAME_WIDTH, // Largeur de la source
                ENEMY_FRAME_HEIGHT, // Hauteur de la source
                enemy.x, // Destination X
                enemy.y, // Destination Y
                ENEMY_FRAME_WIDTH, // Largeur de la destination
                ENEMY_FRAME_HEIGHT // Hauteur de la destination
            );
            ctx.fillStyle = 'black';
            ctx.fillText(`HP: ${enemy.health}`, enemy.x, enemy.y - 10);
        }
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
    drawPlayer();
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
            !enemy.defeated &&
            player.x < enemy.x + ENEMY_FRAME_WIDTH &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + ENEMY_FRAME_HEIGHT &&
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
    console.log("End Battle Triggered. Player speed:", player.speed);
    console.log("Before reset - dx:", player.dx, "dy:", player.dy);

    clearInterval(enemyInterval);
    clearInterval(enemyTypingTimeout);
    inBattle = false;
    battleScreen.style.display = 'none';
    battleResult.innerText = '';

    if (playerWon) {
        currentEnemy.defeated = true;
        console.log(`Enemy ${currentEnemy.name} defeated`);
    } else {
        alert('Game Over');
        resetGame();
    }
    currentEnemy = null;
    
    // Réinitialisation des valeurs de déplacement
    player.dx = 0;
    player.dy = 0;

    console.log("After reset - dx:", player.dx, "dy:", player.dy);
    console.log("Player speed:", player.speed);

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
            inBattle = false;
            setTimeout(() => {
                endBattle(true);
            }, 3000); // 3000 millisecondes = 3 secondes
        } else {
            wordToType.innerText = currentEnemy.words[Math.floor(Math.random() * currentEnemy.words.length)];
            clearInterval(enemyTypingTimeout); // Reset enemy progress
            startEnemyTyping();
        }
    }
});

function update() {
    if (inBattle) return;
    clear();

    newPos();
    updatePlayerFrame();
    updateEnemyFrames();

    drawPlayer();
    drawEnemies();
    drawQuests();

    detectWalls();
    detectEnemyCollision();
    detectQuestCollision();

    requestAnimationFrame(update);
}

function moveUp() {
    player.dy = -player.speed;
    player.dx = 0;
    player.frameX = 2; // Colonne pour le mouvement vers le haut
}

function moveDown() {
    player.dy = player.speed;
    player.dx = 0;
    player.frameX = 0; // Colonne pour le mouvement vers le bas
}

function moveRight() {
    player.dx = player.speed;
    player.dy = 0;
    player.frameX = 3; // Colonne pour le mouvement vers la droite
}

function moveLeft() {
    player.dx = -player.speed;
    player.dy = 0;
    player.frameX = 1; // Colonne pour le mouvement vers la gauche
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
        e.key === 'ArrowRight' || e.key === 'Right' ||
        e.key === 'ArrowLeft' || e.key === 'Left' ||
        e.key === 'ArrowUp' || e.key === 'Up' ||
        e.key === 'ArrowDown' || e.key === 'Down'
    ) {
        player.dx = 0;
        player.dy = 0;
        player.frameX = 0; // Réinitialiser à la première frame pour l'arrêt
        player.frameY = 0; // Réinitialiser à la première frame pour l'arrêt
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
    player.xp = 0;
    player.speed = 1;
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
    playerName.style.display = 'none';
    saveProgress.style.display = 'none';
    update();
}

update();

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
