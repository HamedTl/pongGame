import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./CartoonPong.css";

const CartoonPong = () => {
  const canvasRef = useRef(null);

  // امتیازها و وضعیت بازی
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winnerText, setWinnerText] = useState("");

  // صفحات شروع و مودال‌ها
  const [isStarted, setIsStarted] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [isCreator, setIsCreator] = useState(false);

  const rafRef = useRef(null);

  // ایجاد و گوش دادن به سوکت
  const createSocketAndListen = ({ roomId, onStart }) => {
    if (window.socket && window.socket.connected) {
      window.socket.off("startGame");
      window.socket.on("startGame", () => onStart && onStart());
      return window.socket;
    }

    const socket = io("ws://10h8rlg1-3000.inc1.devtunnels.ms/", {
      query: { roomId },
    });

    window.socket = socket;

    socket.on("game-start", () => onStart && onStart());

    socket.on("connect", () => console.log("[socket] connected", socket.id));
    socket.on("connect_error", (err) =>
      console.warn("[socket] connect_error", err)
    );
    socket.on('player-move',(e)=>{
        ai.y = e.location
    })

    return socket;
  };

  // باز کردن مودال‌ها
  const handleOpenJoin = () => {
    setPlayerName("");
    setRoomIdInput("");
    setIsCreator(false);
    setShowJoinModal(true);
  };

  const handleOpenCreate = () => {
    setRoomIdInput("");
    setPlayerName("");
    setIsCreator(true);
    setShowCreateModal(true);
  };

  // ارسال فرم‌ها
  const handleSubmitJoin = (e) => {
    e.preventDefault();
    if (!playerName.trim() || !roomIdInput.trim()) return;
    setShowJoinModal(false);
    setIsWaiting(true);

    const socket = createSocketAndListen({
      roomId: roomIdInput.trim(),
      onStart: () => {
        setIsWaiting(false);
        setIsStarted(true);
      },
    });
  };

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    if (!roomIdInput.trim()) return;
    setShowCreateModal(false);
    setIsWaiting(true);

    const socket = createSocketAndListen({
      roomId: roomIdInput,
      onStart: () => {
        setIsWaiting(false);
        setIsStarted(true);
      },
    });
  };

  // تولید Room ID تصادفی
  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomIdInput(id);
  };

  // ستاره‌های پس‌زمینه
  useEffect(() => {
    for (let i = 0; i < 25; i++) {
      const star = document.createElement("div");
      star.className = "star";
      star.style.width = Math.random() * 3 + "px";
      star.style.height = star.style.width;
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 100 + "%";
      star.style.animationDelay = Math.random() * 2 + "s";
      document.body.appendChild(star);
    }
    return () => {
      document.querySelectorAll(".star").forEach((s) => s.remove());
    };
  }, []);

  // راه‌اندازی بوم (Canvas)
  useEffect(() => {
    if (!isStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let playerScoreVal = 0;
    let aiScoreVal = 0;
    const winningScore = 5;
    let gameRunning = true;

    const paddleWidth = 15;
    const paddleHeight = 100;
    const paddleSpeed = 8;

    const player = {
      x: 20,
      y: canvas.height / 2 - paddleHeight / 2,
      width: paddleWidth,
      height: paddleHeight,
      dy: 0,
      color: "#ff6b6b",
    };
    const ai = {
      x: canvas.width - 20 - paddleWidth,
      y: canvas.height / 2 - paddleHeight / 2,
      width: paddleWidth,
      height: paddleHeight,
      speed: 4,
      color: "#4ecdc4",
    };
    const ball = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 12,
      dx: 5,
      dy: 3,
      color: "#ffe66d",
    };

    const keys = {};
    document.addEventListener("keydown", (e) => (keys[e.key] = true));
    document.addEventListener("keyup", (e) => (keys[e.key] = false));

    const drawRect = (p) => {
      ctx.shadowBlur = 20;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.shadowBlur = 0;
    };

    const drawBall = () => {
      ctx.shadowBlur = 25;
      ctx.shadowColor = ball.color;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const drawCenterLine = () => {
      ctx.setLineDash([10, 15]);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const updatePlayer = () => {
      if (keys["ArrowUp"]) player.y -= paddleSpeed;
      if (keys["ArrowDown"]) player.y += paddleSpeed;
      if (player.y < 0) player.y = 0;
      if (player.y + player.height > canvas.height)
        player.y = canvas.height - player.height;

      window.socket.emit("move",player.y)
    };

    

    const resetBall = () => {
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
      ball.dy = (Math.random() - 0.5) * 4;
    };

    const updateBall = () => {
      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height)
        ball.dy *= -1;

      if (
        ball.x - ball.radius < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height &&
        ball.dx < 0
      )
        ball.dx = Math.abs(ball.dx);

      if (
        ball.x + ball.radius > ai.x &&
        ball.y > ai.y &&
        ball.y < ai.y + ai.height &&
        ball.dx > 0
      )
        ball.dx = -Math.abs(ball.dx);

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
        setWinnerText(
          playerScoreVal >= winningScore
            ? "🎉 شما برنده شدید! 🎉"
            : "🤖 کامپیوتر برنده شد! 🤖"
        );
        setGameOver(true);
        gameRunning = false;
      }
    };

    const loop = () => {
      if (!gameRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCenterLine();
      drawRect(player);
      drawRect(ai);
      drawBall();
      updatePlayer();
      updateBall();
      rafRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      gameRunning = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [isStarted]);

  const restartGame = () => window.location.reload();

  return (
    <div className="container" dir="rtl">
      <h1>🎮 پینگ‌پنگ کارتونی 🎮</h1>

      <div className="score" id="playerScore">
        {playerScore}
      </div>
      <div className="score" id="aiScore">
        {aiScore}
      </div>

      <canvas
        ref={canvasRef}
        id="gameCanvas"
        width="800"
        height="600"
        style={{ display: isStarted ? "block" : "none" }}
      ></canvas>

      {!isStarted && (
        <div className="start-panel">
          <div className="controls">برای شروع، یکی از گزینه‌ها را انتخاب کن:</div>
          <button className="btn" onClick={handleOpenJoin}>
            🎯 پیوستن به بازی
          </button>
       
        </div>
      )}

      {isWaiting && (
        <div className="modal active">
          <div className="modal-card">
            <h3>در انتظار شروع بازی...</h3>
            <p>اتصال برقرار است — منتظر بمان تا میزبان بازی را آغاز کند.</p>
          </div>
        </div>
      )}

      {/* مودال پیوستن */}
      <div
        className={`modal ${showJoinModal ? "active" : ""}`}
        style={{ display: showJoinModal ? "flex" : "none" }}
      >
        <div className="modal-card">
          <h3>پیوستن به بازی</h3>
          <form onSubmit={handleSubmitJoin}>
            <label>نام بازیکن:</label>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="مثلاً: علی"
            />
            <label>شناسه اتاق (Room ID):</label>
            <input
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              placeholder="مثلاً: ABC123"
            />
            <div className="actions">
              <button className="btn" type="submit">
                پیوستن
              </button>
              <button
                className="btn cancel"
                type="button"
                onClick={() => setShowJoinModal(false)}
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* مودال ساخت */}
      <div
        className={`modal ${showCreateModal ? "active" : ""}`}
        style={{ display: showCreateModal ? "flex" : "none" }}
      >
        <div className="modal-card">
          <h3>ساخت اتاق جدید</h3>
          <form onSubmit={handleSubmitCreate}>
            <label>شناسه اتاق:</label>
            <input
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              placeholder="می‌توانی خالی بگذاری تا تولید شود"
            />
            <div className="actions">
              <button type="button" className="btn" onClick={generateRoomId}>
                تولید شناسه
              </button>
              <button className="btn" type="submit">
                ساخت
              </button>
              <button
                className="btn cancel"
                type="button"
                onClick={() => setShowCreateModal(false)}
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      </div>

      {gameOver && (
        <div className="game-over">
          <div id="winnerText">{winnerText}</div>
          <button className="restart-btn" onClick={restartGame}>
            🎯 بازی دوباره
          </button>
        </div>
      )}
    </div>
  );
};

export default CartoonPong;
