import React, { useEffect, useRef, useState } from "react";
import "./CartoonPong.css"; // استایل‌ها را از فایل جدا می‌گیریم

const CartoonPong = () => {
  const canvasRef = useRef(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winnerText, setWinnerText] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // ⭐ ایجاد ستاره‌ها
    for (let i = 0; i < 20; i++) {
      const star = document.createElement("div");
      star.className = "star";
      star.style.width = Math.random() * 3 + "px";
      star.style.height = star.style.width;
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 100 + "%";
      star.style.animationDelay = Math.random() * 2 + "s";
      document.body.appendChild(star);
    }

    let playerScoreVal = 0;
    let aiScoreVal = 0;
    const winningScore = 5;
    let gameRunning = true;

    // 🎮 Paddle و Ball
    const paddleWidth = 15;
    const paddleHeight = 100;
    const paddleSpeed = 8;

    const player = { x: 20, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, dy: 0, color: "#ff6b6b", trail: [] };
    const ai = { x: canvas.width - 20 - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, speed: 4, color: "#4ecdc4", trail: [] };
    const ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 12, dx: 5, dy: 3, color: "#ffe66d", trail: [], particles: [], baseSpeed: 5 };

    // 🎇 Particles
    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.01;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // کنترل ورودی
    const keys = {};
    const keyDownHandler = (e) => (keys[e.key] = true);
    const keyUpHandler = (e) => (keys[e.key] = false);
    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    function drawRoundRect(x, y, width, height, radius, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
    }

    function drawPaddle(paddle) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = paddle.color;
      drawRoundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8, paddle.color);
      ctx.shadowBlur = 0;
    }

    function drawBall() {
      ctx.shadowBlur = 25;
      ctx.shadowColor = ball.color;
      const gradient = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 0, ball.x, ball.y, ball.radius);
      gradient.addColorStop(0, "#fff");
      gradient.addColorStop(0.3, ball.color);
      gradient.addColorStop(1, "#ff9f43");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function drawCenterLine() {
      ctx.setLineDash([10, 15]);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function updatePlayer() {
      if (keys["ArrowUp"]) player.dy = -paddleSpeed;
      else if (keys["ArrowDown"]) player.dy = paddleSpeed;
      else player.dy = 0;

      player.y += player.dy;
      if (player.y < 0) player.y = 0;
      if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
    }

    function updateAI() {
      const aiCenter = ai.y + ai.height / 2;
      const ballCenter = ball.y;
      if (aiCenter < ballCenter - 35) ai.y += ai.speed;
      else if (aiCenter > ballCenter + 35) ai.y -= ai.speed;
      if (ai.y < 0) ai.y = 0;
      if (ai.y + ai.height > canvas.height) ai.y = canvas.height - ai.height;
    }

    function resetBall() {
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
      ball.dy = (Math.random() - 0.5) * 4;
      ball.particles = [];
    }

    function updateBall() {
      ball.x += ball.dx;
      ball.y += ball.dy;
      if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) ball.dy *= -1;

      // برخورد با بازیکن
      if (ball.x - ball.radius < player.x + player.width && ball.y > player.y && ball.y < player.y + player.height && ball.dx < 0) {
        ball.dx = Math.abs(ball.dx) * 1.05;
        const hitPos = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
        ball.dy = hitPos * 8;
      }

      // برخورد با AI
      if (ball.x + ball.radius > ai.x && ball.y > ai.y && ball.y < ai.y + ai.height && ball.dx > 0) {
        ball.dx = -Math.abs(ball.dx) * 1.05;
        const hitPos = (ball.y - (ai.y + ai.height / 2)) / (ai.height / 2);
        ball.dy = hitPos * 8;
      }

      if (ball.x - ball.radius < 0) {
        aiScoreVal++;
        setAiScore(aiScoreVal);
        resetBall();
      }

      if (ball.x + ball.radius > canvas.width) {
        playerScoreVal++;
        setPlayerScore(playerScoreVal);
        resetBall();
      }

      if (playerScoreVal >= winningScore || aiScoreVal >= winningScore) {
        setWinnerText(playerScoreVal >= winningScore ? "🎉 YOU WIN! 🎉" : "🤖 AI WINS! 🤖");
        setGameOver(true);
        gameRunning = false;
      }
    }

    function loop() {
      if (!gameRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCenterLine();
      drawPaddle(player);
      drawPaddle(ai);
      drawBall();
      updatePlayer();
      updateAI();
      updateBall();
      requestAnimationFrame(loop);
    }

    loop();

    return () => {
      document.removeEventListener("keydown", keyDownHandler);
      document.removeEventListener("keyup", keyUpHandler);
    };
  }, []);

  const restartGame = () => {
    setPlayerScore(0);
    setAiScore(0);
    setGameOver(false);
    window.location.reload(); // ساده‌ترین ریست
  };

  return (
    <div className="container">
      <h1>🎮 CARTOON PONG 🎮</h1>
      <div className="score" id="playerScore">{playerScore}</div>
      <div className="score" id="aiScore">{aiScore}</div>
      <canvas ref={canvasRef} id="gameCanvas" width="800" height="600"></canvas>
      <div className="controls">Use ⬆️ Arrow Up and ⬇️ Arrow Down to play!</div>

      {gameOver && (
        <div className="game-over" id="gameOver">
          <div id="winnerText">{winnerText}</div>
          <button className="restart-btn" onClick={restartGame}>
            Play Again! 🎯
          </button>
        </div>
      )}
    </div>
  );
};

export default CartoonPong;
