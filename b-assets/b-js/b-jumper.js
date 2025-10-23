const GameState = {
    MENU: "menu",
    PLAYING: "playing",
    PAUSED: "paused",
    GAMEOVER: "gameover",
};

const EnemyState = {
    SPAWNING: "spawning",
    MOVING: "moving",
    ATTACKING: "attacking",
    RETREATING: "retreating",
    DEAD: "dead",
};

let context;
let game;
let gameState = GameState.PLAYING;

let canvasHeight = 576;
let canvasWidth = 1024;

// set canvas from html as canvas for out of game context use, might be redundent
const canvas = document.getElementById("b-jumper");
// define context for game space
context = canvas.getContext("2d");

window.onload = function () {
    // define canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    context.fillRect(0, 0, canvas.width, canvas.height);

    game = new Game(context);
    game.startGameLoop();

    // player.draw();

    isJumping = false;
    hasJumped = false;
    isDashing = false;
    isAlive = true;
};

// player sprite and movement variables
let playerSprite;
let playerBaseSpeed = 1;
let playerSpeed = playerBaseSpeed;
let playerRunSpeed = 2;
let gravity = 0.4;
let jumpSpeed = 8;
let dashSpeed = 40;

// bools
let isJumping;
let hasJumped;
let isAlive;
let isDashing;

// player dimensions
let playerHeight = 30;
let playerWidth = 12;

// player default position and velocity
let playerX = 100;
let playerY = 100;
let playerVelocityY = 0;
let playerVelocityX = 0;

// enemy has a radius but for collision detection we need height and width
let enemyRadius = 10;

// input handling, overkill for this project but allows for more complex input handling later if I decide to continue development
let lastKey;
const keys = {
    a: {
        pressed: false,
    },
    d: {
        pressed: false,
    },
    space: {
        pressed: false,
    },
    shift: {
        pressed: false,
    },
};
window.addEventListener("keydown", (event) => {
    // stop us scrolling when pressing spacebar
    if (event.key === " ") {
        event.preventDefault();
    }

    switch (event.key) {
        case "d":
            keys.d.pressed = true;
            lastKey = "d";
            break;
        case "a":
            keys.a.pressed = true;
            lastKey = "a";
            break;
        case " ":
            keys.space.pressed = true;
            lastKey = "space";
            break;
        case "Shift":
            keys.shift.pressed = true;
            lastKey = "Shift";
            break;
    }
    // console.log(event.key);
});
window.addEventListener("keyup", (event) => {
    switch (event.key) {
        case "d":
            keys.d.pressed = false;
            break;
        case "a":
            keys.a.pressed = false;
            break;
        case " ":
            keys.space.pressed = false;
            break;
        case "Shift":
            keys.shift.pressed = false;
            break;
    }
    // console.log(event.key);
});
// restart game
window.addEventListener("keydown", (event) => {
    if (event.key === "r" || event.key === "R") {
        if (gameState === "gameover") {
            restartGame();
        }
    }
});
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
});

canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const targetX = event.clientX - rect.left;
    const targetY = event.clientY - rect.top;

    // Fire a bullet toward the mouse
    game.fireBullet(targetX, targetY);
});

class Enemy {
    constructor(x, y, radius, context) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.context = context;
        this.health = 100;
        this.speed = 2;
        this.state = EnemyState.SPAWNING;
        this.velocityX = -this.speed;
        this.velocityY = 0;
        this.retreatTimer = 0;
        this.destroyed = false;
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;

        switch (newState) {
            case EnemyState.SPAWNING:
                this.velocityX = -this.speed;
                break;
            case EnemyState.MOVING:
                this.velocityX = -this.speed;
                this.velocityY = 0;
                break;
            case EnemyState.RETREATING:
                this.retreatTimer = 60;
                this.velocityX = 4;
                break;
            case EnemyState.DEAD:
                this.destroyed = true;
                break;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.setState(EnemyState.DEAD);
        }
    }

    bounceBack() {
        if (this.state !== EnemyState.RETREATING) {
            this.setState(EnemyState.RETREATING);
            this.takeDamage(10);
        }
    }

    update() {
        switch (this.state) {
            case EnemyState.SPAWNING:
                this.setState(EnemyState.MOVING);
                break;

            case EnemyState.MOVING:
                this.x += this.velocityX;
                this.y += this.velocityY;
                break;

            case EnemyState.RETREATING:
                this.x += this.velocityX;
                this.retreatTimer--;
                if (this.retreatTimer <= 0) {
                    this.setState(EnemyState.MOVING);
                }
                break;

            case EnemyState.DEAD:
                this.destroyed = true;
                break;
        }
    }

    draw() {
        switch (this.state) {
            case EnemyState.MOVING:
                this.drawEvilFaceType1();
                break;
            case EnemyState.ATTACKING:
                this.drawEvilFaceType2();
                break;
            case EnemyState.RETREATING:
                this.drawEvilFaceType3();
                break;
            case EnemyState.DEAD:
                this.drawDeadFace();
                break;
            default:
                this.drawSurprisedFace();
                break;
        }
    }

    // --- FACE DRAWING METHODS BELOW ---

    drawEvilFaceType1() {
        const ctx = this.context;
        const r = this.radius;
        ctx.save();
        ctx.translate(this.x, this.y);

        // body
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // eyes
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(-r * 0.4, -r * 0.3, r * 0.2, 0, Math.PI * 2);
        ctx.arc(r * 0.4, -r * 0.3, r * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // mouth
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, r * 0.2, r * 0.4, 0, Math.PI, false);
        ctx.stroke();

        ctx.restore();
    }

    drawEvilFaceType2() {
        const ctx = this.context;
        const r = this.radius;
        ctx.save();
        ctx.translate(this.x, this.y);

        // body
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // eyes
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, -r * 0.3);
        ctx.lineTo(-r * 0.2, -r * 0.1);
        ctx.moveTo(r * 0.5, -r * 0.3);
        ctx.lineTo(r * 0.2, -r * 0.1);
        ctx.stroke();

        // jagged mouth
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, r * 0.4);
        for (let i = -r * 0.5; i <= r * 0.5; i += r * 0.2) {
            ctx.lineTo(i + r * 0.1, r * 0.4 - r * 0.2);
            ctx.lineTo(i + r * 0.2, r * 0.4);
        }
        ctx.stroke();

        ctx.restore();
    }

    drawEvilFaceType3() {
        const ctx = this.context;
        const r = this.radius;
        ctx.save();
        ctx.translate(this.x, this.y);

        // body
        ctx.fillStyle = "purple";
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // eyes
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.3, r * 0.15, 0, Math.PI * 2);
        ctx.arc(r * 0.3, -r * 0.3, r * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // wide grin
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.arc(0, r * 0.3, r * 0.5, 0, Math.PI, false);
        ctx.stroke();

        ctx.restore();
    }

    drawDeadFace() {
        const ctx = this.context;
        const r = this.radius;
        ctx.save();
        ctx.translate(this.x, this.y);

        // faded body
        ctx.fillStyle = "gray";
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // X eyes
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(-r * 0.4, -r * 0.3);
        ctx.lineTo(-r * 0.1, -r * 0.1);
        ctx.moveTo(-r * 0.1, -r * 0.3);
        ctx.lineTo(-r * 0.4, -r * 0.1);
        ctx.moveTo(r * 0.4, -r * 0.3);
        ctx.lineTo(r * 0.1, -r * 0.1);
        ctx.moveTo(r * 0.1, -r * 0.3);
        ctx.lineTo(r * 0.4, -r * 0.1);
        ctx.stroke();

        // drooping mouth
        ctx.beginPath();
        ctx.arc(0, r * 0.4, r * 0.3, Math.PI, 0, true);
        ctx.stroke();

        ctx.restore();
    }

    drawSurprisedFace() {
        const ctx = this.context;
        const r = this.radius;
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // eyes
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.3, r * 0.15, 0, Math.PI * 2);
        ctx.arc(r * 0.3, -r * 0.3, r * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // mouth (O)
        ctx.beginPath();
        ctx.arc(0, r * 0.3, r * 0.15, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

class HomingEnemy extends Enemy {
    constructor(x, y, speed, radius, context, targetPlayer = false) {
        super(x, y, radius, context);
        this.speed = speed;
        this.targetPlayer = targetPlayer;
        this.homingActive = false;
        this.currentTarget = null; // store chosen target once
    }

    update(player, wall) {
        // Activate homing once halfway across screen
        if (!this.homingActive && this.x < canvas.width / 2) {
            this.homingActive = true;

            // pick target when activating
            if (this.targetPlayer) {
                this.currentTarget = player;
            } else {
                const alive = wall.aliveSections;
                if (alive.length > 0) {
                    this.currentTarget =
                        alive[Math.floor(Math.random() * alive.length)];
                } else {
                    this.currentTarget = player; // fallback
                }
            }
        }

        switch (this.state) {
            case EnemyState.SPAWNING:
                this.setState(EnemyState.MOVING);
                break;

            case EnemyState.MOVING:
                if (this.homingActive && this.currentTarget) {
                    const targetX =
                        this.currentTarget.x +
                        (this.currentTarget.width ?? 0) / 2;
                    const targetY =
                        this.currentTarget.y +
                        (this.currentTarget.height ?? 0) / 2;

                    const dx = targetX - this.x;
                    const dy = targetY - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance > 0) {
                        this.velocityX = (dx / distance) * this.speed;
                        this.velocityY = (dy / distance) * this.speed;
                    }
                }

                this.x += this.velocityX;
                this.y += this.velocityY;
                break;

            case EnemyState.RETREATING:
                this.x += this.velocityX;
                this.retreatTimer--;
                if (this.retreatTimer <= 0) {
                    this.setState(EnemyState.MOVING);
                    this.homingActive = false; // reset so they can pick new target later
                    this.currentTarget = null;
                }
                break;

            case EnemyState.DEAD:
                this.destroyed = true;
                break;
        }
    }
}

class PowerUp {
    constructor(x, y, type, context, duration = 10000) {
        this.x = x;
        this.y = y;
        this.width = 32; // doubled
        this.height = 32; // doubled
        this.type = type;
        this.context = context;
        this.active = true;
        this.duration = duration;

        this.velocityY = 0;
        this.gravity = 0.5;
        this.floorY = canvasHeight - this.height;
    }

    update() {
        if (!this.active) return;
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        if (this.y > this.floorY) {
            this.y = this.floorY;
            this.velocityY = 0;
        }
    }

    draw() {
        if (!this.active) return;

        const ctx = this.context;
        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;

        ctx.beginPath();

        switch (this.type) {
            // SPEED: Lightning bolt
            case "speed":
                ctx.fillStyle = "green";
                ctx.moveTo(x + w * 0.5, y);
                ctx.lineTo(x + w * 0.7, y + h * 0.4);
                ctx.lineTo(x + w * 0.6, y + h * 0.4);
                ctx.lineTo(x + w * 0.8, y + h);
                ctx.lineTo(x + w * 0.3, y + h * 0.6);
                ctx.lineTo(x + w * 0.4, y + h * 0.6);
                ctx.closePath();
                ctx.fill();
                break;

            // JUMP: Upward arrow
            case "jump":
                ctx.fillStyle = "purple";
                ctx.moveTo(x + w * 0.5, y); // top point
                ctx.lineTo(x + w, y + h); // bottom right
                ctx.lineTo(x + w * 0.65, y + h); // inner right
                ctx.lineTo(x + w * 0.65, y + h * 0.75); // down
                ctx.lineTo(x + w * 0.35, y + h * 0.75); // bottom bar
                ctx.lineTo(x + w * 0.35, y + h); // inner left
                ctx.lineTo(x, y + h); // bottom left
                ctx.closePath();
                ctx.fill();
                break;

            // HEALTH: Heart
            case "health":
                ctx.fillStyle = "red";
                ctx.arc(x + w * 0.3, y + h * 0.3, w * 0.2, 0, Math.PI * 2);
                ctx.arc(x + w * 0.7, y + h * 0.3, w * 0.2, 0, Math.PI * 2);
                ctx.moveTo(x + w * 0.1, y + h * 0.4);
                ctx.lineTo(x + w * 0.9, y + h * 0.4);
                ctx.lineTo(x + w * 0.5, y + h);
                ctx.closePath();
                ctx.fill();
                break;

            default:
                ctx.fillStyle = "white";
                ctx.fillRect(x, y, w, h);
        }
    }

    apply(player) {
        if (!this.active) return;
        this.active = false;

        switch (this.type) {
            case "speed":
                player.playerBaseSpeed *= 2;
                player.playerRunSpeed *= 2;
                setTimeout(() => {
                    player.playerBaseSpeed /= 2;
                    player.playerRunSpeed /= 2;
                }, this.duration);
                break;
            case "jump":
                player.jumpSpeed *= 1.5;
                setTimeout(() => {
                    player.jumpSpeed /= 1.5;
                }, this.duration);
                break;
            case "health":
                player.health = Math.min(player.maxHealth, player.health + 25); // heal 25
                break;
        }
    }

    checkCollision(player) {
        if (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        ) {
            this.apply(player);
        }
    }
}

class Player {
    constructor(playerX, playerY, playerWidth, playerHeight, context) {
        this.x = playerX;
        this.y = playerY;
        this.width = playerWidth;
        this.height = playerHeight;
        this.gravity = gravity;
        this.playerBaseSpeed = playerBaseSpeed;
        this.speed = playerSpeed;
        this.playerRunSpeed = playerRunSpeed;
        this.playerDashSpeed = dashSpeed;
        this.jumpSpeed = jumpSpeed;
        this.context = context;
        this.playerVelocityY = 0;
        this.playerVelocityX = 0;

        this.wallBounceVelocity = 40;

        this.isAlive;

        this.jumpCount = 0; // counts double jumps
        this.maxJumps = 2; // allow 1 double jump
        this.wallJumpUsed = false; // tracks wall jump usage
        this.isJumping = false; // true while in the air
        this.hasJumped;
        this.isDashing;

        this.enemyLeft = true;

        this.health = 100;
        this.maxHealth = 100;
        this.invincible = false; // flag for temporary invincibility
        this.invincibleDuration = 1000; // 1 second in ms
        this.lastHitTime = 0; // timestamp of last hit
    }

    draw() {
        const ctx = this.context;
        const w = this.width;
        const h = this.height;

        ctx.save(); // save current transform state

        if (!this.enemyLeft) {
            // Flip horizontally around the center of the player
            ctx.translate(this.x + w / 2, 0); // move origin to player's center x
            ctx.scale(-1, 1); // flip horizontally
            ctx.translate(-(this.x + w / 2), 0); // move back
        }

        // Draw the player as usual (right-facing)
        ctx.fillStyle = "blue";
        ctx.fillRect(this.x, this.y, w, h);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, w, h);

        // Eyes
        ctx.fillStyle = "white";
        ctx.fillRect(this.x + w * 0.45, this.y + h * 0.25, w * 0.2, h * 0.2);
        ctx.fillRect(this.x + w * 0.15, this.y + h * 0.25, w * 0.2, h * 0.2);

        // Pupils
        ctx.fillStyle = "black";
        ctx.fillRect(this.x + w * 0.5, this.y + h * 0.3, w * 0.1, h * 0.1);
        ctx.fillRect(this.x + w * 0.2, this.y + h * 0.3, w * 0.1, h * 0.1);

        // Eyebrows
        ctx.beginPath();
        ctx.moveTo(this.x + w * 0.45, this.y + h * 0.2);
        ctx.lineTo(this.x + w * 0.65, this.y + h * 0.18);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.x + w * 0.15, this.y + h * 0.18);
        ctx.lineTo(this.x + w * 0.35, this.y + h * 0.2);
        ctx.stroke();

        // Mouth
        ctx.beginPath();
        ctx.moveTo(this.x + w * 0.25, this.y + h * 0.7);
        ctx.lineTo(this.x + w * 0.6, this.y + h * 0.7);
        ctx.stroke();

        ctx.restore(); // restore original transform state

        this.drawHealthBar();
    }

    drawHealthBar() {
        const ctx = this.context;
        const barWidth = this.width;
        const barHeight = 5;
        const healthRatio = this.health / this.maxHealth;

        // Background
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y - barHeight - 2, barWidth, barHeight);

        // Health
        ctx.fillStyle = "limegreen";
        ctx.fillRect(
            this.x,
            this.y - barHeight - 2,
            barWidth * healthRatio,
            barHeight
        );

        // Optional: border
        ctx.strokeStyle = "black";
        ctx.strokeRect(this.x, this.y - barHeight - 2, barWidth, barHeight);
    }

    handleInput(keys, lastKey, wall) {
        // Horizontal movement
        const speed = keys.shift.pressed
            ? this.playerRunSpeed
            : this.playerBaseSpeed;

        if (keys.a.pressed && keys.d.pressed) {
            this.playerVelocityX = lastKey === "a" ? -speed : speed;
        } else if (keys.a.pressed) {
            this.playerVelocityX = -speed;
            this.enemyLeft = true;
        } else if (keys.d.pressed) {
            this.playerVelocityX = speed;
            this.enemyLeft = false;
        } else {
            this.playerVelocityX = 0;
        }

        // Jumping
        if (keys.space.pressed) {
            if (this.jumpCount < this.maxJumps) {
                // Normal double jump
                this.playerVelocityY = -this.jumpSpeed;
                this.jumpCount++;
                keys.space.pressed = false;
            } else {
                // Wall jump
                const touchingWall = this.isTouchingWall(wall);
                if (!this.wallJumpUsed && touchingWall) {
                    this.playerVelocityY = -this.jumpSpeed;

                    // Push away from wall
                    if (
                        this.x + this.width / 2 <
                        touchingWall.x + touchingWall.width / 2
                    ) {
                        // Player is on left side of wall, jump right
                        this.playerVelocityX -= this.wallBounceVelocity;
                        this.playerVelocityY -= this.jumpSpeed;
                    } else {
                        // Player is on right side of wall, jump left
                        this.playerVelocityX += this.wallBounceVelocity;
                        this.playerVelocityY -= this.jumpSpeed;
                    }

                    this.wallJumpUsed = true;
                    keys.space.pressed = false;
                }
            }
        }
    }

    isTouchingWall(wall) {
        // Returns the wall section being touched (or null if none)
        for (let section of wall.aliveSections) {
            const overlapX =
                this.x <= section.x + section.width &&
                this.x + this.width >= section.x;
            const overlapY =
                this.y + this.height > section.y &&
                this.y < section.y + section.height;

            if (overlapX && overlapY) {
                return section;
            }
        }
        return null;
    }

    updatePosition() {
        // Apply gravity
        this.playerVelocityY += this.gravity;
        this.x += this.playerVelocityX;
        this.y += this.playerVelocityY;

        // Floor collision
        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            this.playerVelocityY = 0;
            this.jumpCount = 0; // reset double jump
            this.wallJumpUsed = false; // reset wall jump
            this.isJumping = false; // back on floor
        } else {
            this.isJumping = true; // in air
        }

        // Keep inside horizontal bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvasWidth)
            this.x = canvasWidth - this.width;

        // Reset invincibility after cooldown
        if (
            this.invincible &&
            Date.now() - this.lastHitTime > this.invincibleDuration
        ) {
            this.invincible = false;
        }
    }
    updatePlayer() {
        this.player.handleInput(keys, lastKey, this.wall); // ✅ pass wall here
        this.player.updatePosition();
        this.player.handleWallCollisions(this.wall);
    }

    handleWallCollisions(wall) {
        this.isOnGround = false; // assume in air until proven otherwise

        wall.sections.forEach((section) => {
            if (section.destroyed) return;

            // AABB collision detection
            const px = this.x;
            const py = this.y;
            const pw = this.width;
            const ph = this.height;

            const sx = section.x;
            const sy = section.y;
            const sw = section.width;
            const sh = section.height;

            const overlapX = px + pw > sx && px < sx + sw;
            const overlapY = py + ph > sy && py < sy + sh;

            if (overlapX && overlapY) {
                // Vertical collision
                if (py + ph - this.playerVelocityY <= sy) {
                    // landed on top of wall
                    this.y = sy - ph;
                    this.playerVelocityY = 0;
                    this.jumpCount = 0; // reset jumps when on top
                    this.isOnGround = true;
                } else if (py - this.playerVelocityY >= sy + sh) {
                    // hit the bottom of a wall
                    this.y = sy + sh;
                    this.playerVelocityY = 0;
                }

                // Horizontal collision
                if (px + pw - this.playerVelocityX <= sx) {
                    // hit left side
                    this.x = sx - pw;
                } else if (px - this.playerVelocityX >= sx + sw) {
                    // hit right side
                    this.x = sx + sw;
                }
            }
        });
    }
}

let nextBulletId = 0;
class Bullet {
    constructor(x, y, targetX, targetY, context) {
        this.id = nextBulletId++;
        this.x = x;
        this.y = y;
        this.radius = 3;
        this.context = context;
        this.speed = 8;

        // Calculate direction vector toward the target
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalize direction vector
        this.velocityX = (dx / distance) * this.speed;
        this.velocityY = (dy / distance) * this.speed;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw() {
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.context.fillStyle = "yellow";
        this.context.fill();
    }

    isOffScreen(canvasWidth, canvasHeight) {
        return (
            this.x < 0 ||
            this.x > canvasWidth ||
            this.y < 0 ||
            this.y > canvasHeight
        );
    }
}

class Game {
    constructor(context) {
        this.player = new Player(
            playerX,
            playerY,
            playerWidth,
            playerHeight,
            context
        );
        this.context = context;
        this.gravity = gravity;
        this.intervalId = null;

        // create a list to hold multiple enemies
        this.enemies = [];
        // spawn every 2 seconds
        this.spawnInterval = 2000;
        this.lastSpawnTime = 0;

        // add bullet storage
        this.bullets = [];

        // add walls
        this.wall = new Wall(context, canvasHeight);

        // powerups
        this.powerUps = [];

        // waves
        this.waveNumber = 0;
        this.enemiesPerWave = 5; // starting enemy count
        this.waveCooldown = 4000; // ms between waves
        this.waveActive = false;
        this.lastWaveEnd = Date.now();

        // score system
        this.killScore = 0;
        this.timeScore = 0;
        this.lastScoreTime = Date.now();
    }

    allWallsDestroyed() {
        return this.wall.sections.every((section) => section.destroyed);
    }

    spawnWave() {
        this.waveNumber++;
        this.waveActive = true;

        // scale difficulty: more enemies per wave
        this.totalEnemiesToSpawn = this.enemiesPerWave + this.waveNumber * 2;

        // spawn delay in milliseconds (smaller = faster)
        this.spawnDelay = Math.max(150, 800 - this.waveNumber * 50);

        this.spawnedEnemies = 0;
        this.nextEnemySpawnTime = Date.now() + this.spawnDelay;

        console.log(
            `Wave ${this.waveNumber} incoming! (${this.totalEnemiesToSpawn} enemies)`
        );
    }

    spawnEnemy() {
        const x = canvasWidth + enemyRadius * 2;
        const y =
            Math.random() * (canvasHeight - enemyRadius * 2) + enemyRadius;

        let enemy;

        // only start spawning homing enemies from certain wave
        if (this.waveNumber >= 2 && Math.random() < 0.2) {
            // 20% chance
            enemy = new HomingEnemy(x, y, 2, enemyRadius, this.context);
        } else {
            enemy = new Enemy(x, y, enemyRadius, this.context);
        }

        this.enemies.push(enemy);

        // adjust normal enemies speed per wave
        if (!(enemy instanceof HomingEnemy)) {
            enemy.velocityX -= this.waveNumber * 0.2;
        }
    }

    fireBullet(targetX, targetY) {
        const bullet = new Bullet(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2,
            targetX,
            targetY,
            this.context
        );
        this.bullets.push(bullet);
    }

    updatePlayer() {
        this.player.handleInput(keys, lastKey, this.wall);
        this.player.updatePosition();
        this.player.handleWallCollisions(this.wall);
    }

    updateEnemies() {
        this.enemies.forEach((enemy) => {
            // Update enemy depending on type
            if (enemy instanceof HomingEnemy) {
                enemy.update(this.player, this.wall);
            } else {
                enemy.update();
            }

            // Check collision with wall
            this.wall.checkCollision(enemy);

            // Drop power-up if the enemy just died
            if (enemy.destroyed && !enemy.powerUpDropped) {
                this.dropPowerUp(enemy.x, enemy.y);
                enemy.powerUpDropped = true;
            }
        });

        // Remove destroyed/offscreen enemies
        this.enemies = this.enemies.filter(
            (enemy) => !enemy.destroyed && enemy.x + enemy.radius > 0
        );
    }

    updateBullets() {
        this.bullets.forEach((bullet) => bullet.update());
        this.bullets = this.bullets.filter(
            (bullet) => !bullet.isOffScreen(canvasWidth, canvasHeight)
        );
    }

    handleCollisions() {
        // bullets vs enemies
        this.enemies.forEach((enemy) => {
            this.bullets.forEach((bullet) => {
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < bullet.radius + enemy.radius) {
                    enemy.takeDamage(50);
                    this.killScore++;
                    bullet.destroyed = true;

                    // Drop power-up if enemy just died
                    if (enemy.health <= 0 && !enemy.powerUpDropped) {
                        this.dropPowerUp(enemy.x, enemy.y);
                        enemy.powerUpDropped = true;
                    }

                    // Mark enemy destroyed
                    if (enemy.health <= 0) enemy.destroyed = true;
                }
            });
        });

        // bullets vs wall
        this.bullets.forEach((bullet) => {
            this.wall.sections.forEach((section) => {
                if (
                    !section.destroyed &&
                    bullet.x + bullet.radius > section.x &&
                    bullet.x - bullet.radius < section.x + section.width &&
                    bullet.y + bullet.radius > section.y &&
                    bullet.y - bullet.radius < section.y + section.height
                ) {
                    section.takeDamage(10);
                    bullet.destroyed = true;
                }
            });
        });

        // player vs enemies
        this.enemies.forEach((enemy) => {
            this.playerenemyColliding(enemy, this.player);
        });

        // ✅ cleanup phase (only once)
        this.bullets = this.bullets.filter(
            (b) => !b.isOffScreen(canvasWidth, canvasHeight) && !b.destroyed
        );
        this.enemies = this.enemies.filter((enemy) => !enemy.destroyed);
    }

    dropPowerUp(x, y) {
        const types = ["speed", "jump"];
        const baseChance = 0.2;
        const waveBonus = 0.05 * this.waveNumber; // +5% per wave
        const chance = Math.min(0.7, baseChance + waveBonus); // cap at 70%

        if (Math.random() < chance) {
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerUps.push(new PowerUp(x, y, type, this.context));
        }
    }

    handleWaves() {
        const now = Date.now();

        if (!this.waveActive && now - this.lastWaveEnd > this.waveCooldown) {
            this.spawnWave();
        }

        if (this.waveActive && this.spawnedEnemies < this.totalEnemiesToSpawn) {
            if (now >= this.nextEnemySpawnTime) {
                this.spawnEnemy();
                this.spawnedEnemies++;
                this.nextEnemySpawnTime = now + this.spawnDelay;
            }
        }

        if (
            this.waveActive &&
            this.spawnedEnemies >= this.totalEnemiesToSpawn &&
            this.enemies.length === 0
        ) {
            this.waveActive = false;
            this.lastWaveEnd = now;
        }
    }

    updateScore() {
        const currentTime = Date.now();
        if (currentTime - this.lastScoreTime >= 1000) {
            this.timeScore++;
            this.lastScoreTime = currentTime;
        }
    }

    checkGameOver() {
        if (!isAlive && gameState === GameState.PLAYING) {
            gameState = GameState.GAMEOVER;
            const finalScore = this.killScore * 100 + this.timeScore;
            const highScore = localStorage.getItem("highScore") || 0;
            if (finalScore > highScore) {
                localStorage.setItem("highScore", finalScore);
                console.log("New High Score!");
            }
            this.stopGameLoop();
            setTimeout(() => {
                this.drawGameOver(finalScore, highScore);
            }, 50);
        }
    }

    drawGameOver(finalScore, highScore) {
        // fade background
        this.context.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.context.fillRect(0, 0, canvasWidth, canvasHeight);

        // text styling
        this.context.fillStyle = "white";
        this.context.font = "36px monospace";
        this.context.textAlign = "center";

        // main text
        this.context.fillText(
            "GAME OVER",
            canvasWidth / 2,
            canvasHeight / 2 - 60
        );
        this.context.font = "24px monospace";
        this.context.fillText(
            `Final Score: ${finalScore}`,
            canvasWidth / 2,
            canvasHeight / 2 - 20
        );
        this.context.fillText(
            `High Score: ${localStorage.getItem("highScore") || 0}`,
            canvasWidth / 2,
            canvasHeight / 2 + 20
        );
        this.context.fillText(
            "Press R to Restart",
            canvasWidth / 2,
            canvasHeight / 2 + 80
        );
    }

    draw() {
        // Clear the canvas before drawing
        this.context.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw the background
        this.context.fillStyle = "black";
        this.context.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw the wall
        this.wall.draw();
        // Draw the player
        this.player.draw();
        // Draw the enemy
        this.enemies.forEach((enemy) => enemy.draw());
        // draw bullets
        this.bullets.forEach((bullet) => bullet.draw());

        // draw score
        this.context.fillStyle = "white";
        this.context.font = "24px monospace";
        this.context.fillText(`Score: ${this.timeScore}`, 10, 30);
        this.context.fillText(`Kills: ${this.killScore}`, 10, 50);
        this.context.fillText(`Wave: ${this.waveNumber}`, 10, 70);

        this.powerUps.forEach((pu) => pu.draw());
    }

    startGameLoop() {
        const loop = () => {
            this.update();
            this.draw();
            if (isAlive) requestAnimationFrame(loop);
        };
        // Example: spawn near middle of canvas
        this.powerUps.push(
            new PowerUp(
                canvasWidth / 2,
                canvasHeight - 36,
                "speed",
                this.context
            )
        );
        requestAnimationFrame(loop);
    }

    stopGameLoop() {
        clearInterval(this.intervalId);
    }

    // return true if the playerangle and enemy are colliding
    playerenemyColliding(enemy, player) {
        // Find the x/y distance to center of objects
        const distX = Math.abs(enemy.x - player.x - player.width / 2);
        const distY = Math.abs(enemy.y - player.y - player.height / 2);

        if (distX > player.width / 2 + enemy.radius) return false;
        if (distY > player.height / 2 + enemy.radius) return false;

        const dx = distX - player.width / 2;
        const dy = distY - player.height / 2;
        const collision = dx * dx + dy * dy <= enemy.radius * enemy.radius;

        if (collision && !player.invincible) {
            player.health -= 20; // amount of damage per hit
            player.invincible = true;
            player.lastHitTime = Date.now();
            console.log(`Player hit! Health: ${player.health}`);

            if (player.health <= 0) {
                isAlive = false;
                console.log("Player dead");
            }
        }

        return collision;
    }

    update() {
        this.updatePlayer();
        this.updateEnemies();
        this.updateBullets();
        this.handleCollisions();
        this.handleWaves();
        this.updateScore();
        this.checkGameOver();
        this.powerUps.forEach((pu) => pu.checkCollision(this.player));
        this.powerUps.forEach((pu) => {
            pu.update();
            pu.checkCollision(this.player);
        });
    }
}

function restartGame() {
    console.log("Restarting game...");
    isAlive = true;
    gameState = "playing";

    // reset player position and variables
    playerX = 100;
    playerY = 100;
    lastKey = null;

    // create a new game instance
    game = new Game(context);
    game.startGameLoop();
}

class WallSection {
    constructor(x, y, width, height, context, parentWall) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.context = context;
        this.health = 100;
        this.destroyed = false;
        this.parentWall = parentWall;
    }

    draw() {
        if (this.destroyed) return;
        this.context.fillStyle = "gray";
        this.context.fillRect(this.x, this.y, this.width, this.height);
        this.context.strokeStyle = "black";
        this.context.strokeRect(this.x, this.y, this.width, this.height);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0 && !this.destroyed) {
            this.destroyed = true;

            // ✅ Let the wall know to refresh aliveSections
            this.parentWall.handleSectionDestroyed();

            if (this.parentWall.sections.every((s) => s.destroyed)) {
                console.log("All walls destroyed! Game over.");
                isAlive = false;
            }
        }
    }
}

class Wall {
    constructor(context, canvasHeight) {
        this.context = context;
        this.sections = [];

        const sectionCount = 6;
        const sectionHeight = canvasHeight / sectionCount;
        const wallWidth = 40;
        const wallX = 0;

        for (let i = 0; i < sectionCount; i++) {
            const y = i * sectionHeight;
            const section = new WallSection(
                wallX,
                y,
                wallWidth,
                sectionHeight,
                context,
                this
            );
            this.sections.push(section);
        }

        // ✅ Keep a cached array of alive sections
        this.aliveSections = [...this.sections];
    }

    draw() {
        this.sections.forEach((section) => section.draw());
    }

    // ✅ Update alive section cache when a section dies
    handleSectionDestroyed() {
        this.aliveSections = this.sections.filter((s) => !s.destroyed);
    }

    checkCollision(enemy) {
        this.aliveSections.forEach((section) => {
            if (
                enemy.x - enemy.radius < section.x + section.width &&
                enemy.x + enemy.radius > section.x &&
                enemy.y - enemy.radius < section.y + section.height &&
                enemy.y + enemy.radius > section.y
            ) {
                section.takeDamage(20);
                if (!enemy.isRetreating) enemy.bounceBack();
            }
        });
    }
}
