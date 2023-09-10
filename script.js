window.addEventListener("load", () => {
  const canvas = document.querySelector("#canvas1");
  const ctx = canvas.getContext("2d");

  canvas.width = 1200;
  canvas.height = 800;
  function create_UUID() {
    var dt = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
    return uuid;
  }

  class Player {
    constructor(game) {
      this.game = game;
      this.width = 120;
      this.height = 213;
      this.x = 235;
      this.y = 416;
      this.image = document.getElementById("player");
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 39;
      this.seaHorses = [];

      this.seaHorses.push(new SeaHorse(this.game, 320, 545, 1));
      this.seaHorses.push(new SeaHorse(this.game, 400, 545, 2));
      this.seaHorses.push(new SeaHorse(this.game, 320, 625, 3));
      this.seaHorses.push(new SeaHorse(this.game, 400, 625, 4));
    }

    updateFrame() {
      this.seaHorses.forEach((seaHorse) => {
        seaHorse.updateFrame();
      });
    }

    update() {
      this.seaHorses.forEach((seaHorse) => {
        seaHorse.update();
      });
    }

    selectSeaHorse(index) {
      this.seaHorses[index].selectSeaHorse();
    }

    checkActionable() {
      if (this.game.canSetActive) return true;

      let isActionable = false;

      this.seaHorses.forEach((seaHorse) => {
        if (seaHorse.isActive) {
          isActionable = true;
        }
      });

      return isActionable;
    }

    draw(context) {
      this.seaHorses.forEach((seaHorse) => {
        seaHorse.draw(context);
      });
    }
  }

  class SeaHorse {
    constructor(game, x, y, number) {
      this.id = create_UUID();
      this.game = game;
      this.width = 120;
      this.height = 213;
      this.x = x;
      this.y = y;
      this.image = document.getElementById("player");
      this.isActive = false;
      this.moveable = false;
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 37;
      this.currentStep = -1;
      this.steps = -1;

      this.number = number;
    }

    updateFrame() {
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = 0;
    }

    update() {
      if (!this.isActive) {
        return;
      }

      if (this.currentStep < this.steps) {
        this.currentStep++;
        this.x = this.game.steps[this.currentStep].x;
        this.y = this.game.steps[this.currentStep].y;
      }

      //verticel boundaries
      if (this.y > this.game.height - this.height * 0.5) {
        this.y = this.game.height - this.height * 0.5;
      } else if (this.y < -this.height * 0.5) {
        this.y = -this.height * 0.5;
      }
    }

    draw(context) {
      context.beginPath();
      ctx.font = "48px serif";
      context.fillStyle = "red";
      context.fillText(this.number, this.x + 15, this.y - 50);
      context.strokeRect(this.x, this.y, 50, 50);
      context.save();
      context.restore();
      context.stroke();

      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y - 50,
        0.4 * this.width,
        0.4 * this.height
      );
    }

    selectSeaHorse() {
      if (this.game.canSetActive) {
        if (this.isActive) {
          this.moveable = true;
          this.steps += this.game.diceNumber;
        } else {
          this.isActive = true;
          this.steps = 0;
        }
        this.game.canSetActive = false;
      } else {
        if (this.isActive) {
          this.moveable = true;
          this.steps += this.game.diceNumber;
        }
      }

      this.game.status = "waiting";
    }
  }

  class Step {
    constructor(game, x, y) {
      this.game = game;
      this.width = 50;
      this.height = 50;
      this.x = x + 233;
      this.y = y;
    }

    draw(context) {
      context.strokeRect(this.x, this.y, this.width, this.height);
    }
  }

  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.player = new Player(this);
      this.steps = [];
      this.keys = [];
      this.enemies = [];
      this.particles = [];
      this.ammo = 20;
      this.maxAmmo = 50;
      this.ammoTimer = 0;
      this.ammoInterval = 500;
      this.enemyTimer = 0;
      this.enemyInterval = 1000;
      this.gameOver = false;
      this.score = 0;
      this.winningScore = 100;
      this.timeLimit = 60000;
      this.gameTime = 0;
      this.speed = 1;
      this.diceNumber = 0;
      this.status = "waiting";

      this.nextMove = 0;
      this.currentMove = 0;
      this.timer = 0;
      this.interval = 500;

      window.addEventListener("keydown", (e) => {
        console.log(e.key);

        if (e.key === "r") {
          if (this.status !== "waiting") return;
          this.status = "rolling";
          this.diceNumber = Math.floor(Math.random() * 5) + 1;
          if (this.diceNumber === 1) this.canSetActive = true;
          this.status = "playeraction";
        }

        if ((this.status === "playeraction")) {
          if (!this.player.checkActionable()) {
            this.status = "waiting";
            return;
          }
          if (e.key === "1") {
            this.player.selectSeaHorse(0);
          } else if (e.key === "2") {
            this.player.selectSeaHorse(1);
          } else if (e.key === "3") {
            this.player.selectSeaHorse(2);
          } else if (e.key === "4") {
            this.player.selectSeaHorse(3);
          }
        }
      });
    }

    init() {
      this.steps = [];
      for (let i = 0; i < 54; i++) {
        if (i < 6) {
          this.addStep(i * 50, 416);
        } else if (i < 12) {
          this.addStep(300, i * 50 + 165);
        } else if (i < 14) {
          this.addStep((i - 5) * 50, 11 * 50 + 165);
        } else if (i < 19) {
          this.addStep(400, 11 * 50 + 165 - (i - 13) * 50);
        } else if (i < 25) {
          this.addStep((i - 18) * 50 + 400, 416);
        } else if (i < 27) {
          this.addStep(700, 416 - (i - 24) * 50);
        } else if (i < 33) {
          this.addStep(700 - (i - 27) * 50, 316);
        } else if (i < 39) {
          this.addStep(400, 316 - (i - 32) * 50);
        } else if (i < 41) {
          this.addStep(-(i - 38) * 50 + 400, 16);
        } else if (i < 47) {
          this.addStep(300, 16 + (i - 41) * 50);
        } else if (i < 53) {
          this.addStep(300 - (i - 46) * 50, 316);
        } else {
          this.addStep(0, 366);
        }
      }
    }

    update(deltaTime) {
      if (!this.gameOver) this.gameTime += deltaTime;
      if (this.gameTime >= this.timeLimit) {
        this.gameOver = true;
      }

      this.player.updateFrame();
      if (this.timer > this.interval) {
        this.player.update();
        this.timer = 0;
      }
      this.timer += deltaTime;
    }

    draw(context) {
      context.beginPath();
      ctx.font = "24px serif";
      context.fillStyle = "#20b347";
      context.fillText("Dice Number: " + this.diceNumber, 20, this.height - 70);
      context.fillText("Fress R to role the dice", 20, this.height - 50);
      context.fillText(
        "Fress 1,2,3,4 to select the sea horse",
        20,
        this.height - 30
      );
      context.save();
      context.restore();
      context.stroke();

      this.player.draw(context);
      this.steps.forEach((step) => {
        step.draw(context);
      });
    }

    addEnemy() {
      const random = Math.random();
      if (random > 0.5) {
        this.enemies.push(new Angler1(this));
      } else if (random < 0.2) {
        this.enemies.push(new LuckyFish(this));
      } else {
        this.enemies.push(new Angler2(this));
      }
    }

    addStep(x, y) {
      this.steps.push(new Step(this, x, y));
    }

    checkCollision(rect1, rect2) {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      );
    }
  }

  const game = new Game(canvas.width, canvas.height);
  let lastTime = 0;
  //animation loop
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.init();
    game.update(deltaTime);
    game.draw(ctx);
    requestAnimationFrame(animate);
  }

  animate(0);
});
