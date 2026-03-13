import { useEffect, useRef, useState } from "react";

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const HIGH_SCORE_KEY = "neon-bug-hunt-high-score";
const HUD_SYNC_MS = 100;

type GamePhase = "ready" | "playing" | "game-over";

type Vec2 = {
  x: number;
  y: number;
};

type EnemyKind = "bug" | "null" | "race" | "leak";

type Enemy = {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  speed: number;
  reward: number;
  damage: number;
  label: string;
  hue: number;
  wobble: number;
};

type Projectile = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  hue: number;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  hue: number;
};

type GameRuntime = {
  player: {
    x: number;
    y: number;
    radius: number;
    speed: number;
    health: number;
    fireCooldown: number;
    invulnerability: number;
  };
  pointer: Vec2;
  nextId: number;
  score: number;
  time: number;
  kills: number;
  combo: number;
  bestCombo: number;
  comboTimer: number;
  spawnTimer: number;
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
};

type HudSnapshot = {
  score: number;
  health: number;
  combo: number;
  bestCombo: number;
  kills: number;
  time: number;
};

const enemyTemplates: Record<
  EnemyKind,
  Pick<Enemy, "radius" | "hp" | "speed" | "reward" | "damage" | "label" | "hue">
> = {
  bug: {
    radius: 12,
    hp: 1,
    speed: 85,
    reward: 12,
    damage: 8,
    label: "BUG",
    hue: 185
  },
  null: {
    radius: 18,
    hp: 2,
    speed: 62,
    reward: 24,
    damage: 16,
    label: "NULL",
    hue: 330
  },
  race: {
    radius: 10,
    hp: 1,
    speed: 128,
    reward: 18,
    damage: 10,
    label: "RACE",
    hue: 44
  },
  leak: {
    radius: 15,
    hp: 2,
    speed: 78,
    reward: 30,
    damage: 14,
    label: "LEAK",
    hue: 145
  }
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function distance(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(x: number, y: number) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function createInitialRuntime(): GameRuntime {
  return {
    player: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      radius: 16,
      speed: 280,
      health: 100,
      fireCooldown: 0,
      invulnerability: 0
    },
    pointer: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2 - 80
    },
    nextId: 1,
    score: 0,
    time: 0,
    kills: 0,
    combo: 0,
    bestCombo: 0,
    comboTimer: 0,
    spawnTimer: 0.7,
    enemies: [],
    projectiles: [],
    particles: []
  };
}

function getHudSnapshot(runtime: GameRuntime): HudSnapshot {
  return {
    score: runtime.score,
    health: runtime.player.health,
    combo: runtime.combo,
    bestCombo: runtime.bestCombo,
    kills: runtime.kills,
    time: runtime.time
  };
}

function spawnEnemy(runtime: GameRuntime) {
  const difficulty = Math.min(runtime.time / 35, 1.8);
  const roll = Math.random();
  let kind: EnemyKind = "bug";

  if (roll > 0.84 - difficulty * 0.08) {
    kind = "leak";
  } else if (roll > 0.62 - difficulty * 0.06) {
    kind = "null";
  } else if (roll > 0.34) {
    kind = "race";
  }

  const template = enemyTemplates[kind];
  const edge = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (edge === 0) {
    x = -40;
    y = Math.random() * CANVAS_HEIGHT;
  } else if (edge === 1) {
    x = CANVAS_WIDTH + 40;
    y = Math.random() * CANVAS_HEIGHT;
  } else if (edge === 2) {
    x = Math.random() * CANVAS_WIDTH;
    y = -40;
  } else {
    x = Math.random() * CANVAS_WIDTH;
    y = CANVAS_HEIGHT + 40;
  }

  const direction = normalize(runtime.player.x - x, runtime.player.y - y);

  runtime.enemies.push({
    id: runtime.nextId++,
    kind,
    x,
    y,
    vx: direction.x * template.speed,
    vy: direction.y * template.speed,
    radius: template.radius,
    hp: template.hp,
    speed: template.speed,
    reward: template.reward,
    damage: template.damage,
    label: template.label,
    hue: template.hue,
    wobble: Math.random() * Math.PI * 2
  });
}

function spawnProjectile(runtime: GameRuntime, aim: Vec2) {
  const speed = 520;
  const direction = normalize(aim.x, aim.y);

  runtime.projectiles.push({
    id: runtime.nextId++,
    x: runtime.player.x + direction.x * 20,
    y: runtime.player.y + direction.y * 20,
    vx: direction.x * speed,
    vy: direction.y * speed,
    radius: 5,
    life: 0.8,
    hue: 185
  });
}

function spawnBurst(runtime: GameRuntime, x: number, y: number, hue: number, count: number) {
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + Math.random() * 0.6;
    const speed = 40 + Math.random() * 120;

    runtime.particles.push({
      id: runtime.nextId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.45 + Math.random() * 0.35,
      size: 2 + Math.random() * 4,
      hue
    });
  }
}

function getAimVector(runtime: GameRuntime) {
  const target = {
    x: runtime.pointer.x - runtime.player.x,
    y: runtime.pointer.y - runtime.player.y
  };

  if (Math.hypot(target.x, target.y) > 12) {
    return target;
  }

  const nearest = runtime.enemies
    .slice()
    .sort(
      (left, right) =>
        distance(left, runtime.player) - distance(right, runtime.player)
    )[0];

  if (nearest) {
    return {
      x: nearest.x - runtime.player.x,
      y: nearest.y - runtime.player.y
    };
  }

  return { x: 0, y: -1 };
}

function drawScene(
  context: CanvasRenderingContext2D,
  runtime: GameRuntime,
  phase: GamePhase
) {
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const gradient = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  gradient.addColorStop(0, "#050816");
  gradient.addColorStop(0.55, "#0b1224");
  gradient.addColorStop(1, "#170a22");
  context.fillStyle = gradient;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.save();
  context.strokeStyle = "rgba(80, 160, 255, 0.12)";
  context.lineWidth = 1;
  for (let x = 0; x < CANVAS_WIDTH; x += 48) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, CANVAS_HEIGHT);
    context.stroke();
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 48) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(CANVAS_WIDTH, y);
    context.stroke();
  }
  context.restore();

  runtime.particles.forEach((particle) => {
    context.save();
    context.globalAlpha = Math.max(particle.life / 0.8, 0);
    context.fillStyle = `hsl(${particle.hue} 95% 65%)`;
    context.shadowBlur = 16;
    context.shadowColor = `hsl(${particle.hue} 95% 65%)`;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    context.fill();
    context.restore();
  });

  runtime.projectiles.forEach((projectile) => {
    context.save();
    context.fillStyle = `hsl(${projectile.hue} 100% 72%)`;
    context.shadowBlur = 22;
    context.shadowColor = `hsl(${projectile.hue} 100% 72%)`;
    context.beginPath();
    context.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  });

  runtime.enemies.forEach((enemy) => {
    context.save();
    context.translate(enemy.x, enemy.y);
    context.shadowBlur = 20;
    context.shadowColor = `hsla(${enemy.hue} 95% 60% / 0.75)`;
    context.fillStyle = `hsla(${enemy.hue} 90% 45% / 0.88)`;
    context.strokeStyle = `hsl(${enemy.hue} 95% 72%)`;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, enemy.radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;
    context.font = "bold 10px ui-monospace, SFMono-Regular, monospace";
    context.textAlign = "center";
    context.fillStyle = "rgba(240, 248, 255, 0.9)";
    context.fillText(enemy.label, 0, 4);
    context.restore();
  });

  context.save();
  context.translate(runtime.player.x, runtime.player.y);
  context.shadowBlur = 30;
  context.shadowColor =
    runtime.player.invulnerability > 0
      ? "rgba(244, 114, 182, 0.9)"
      : "rgba(34, 211, 238, 0.9)";
  context.fillStyle =
    runtime.player.invulnerability > 0
      ? "rgba(244, 114, 182, 0.85)"
      : "rgba(34, 211, 238, 0.92)";
  context.beginPath();
  context.arc(0, 0, runtime.player.radius, 0, Math.PI * 2);
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = "rgba(255, 255, 255, 0.8)";
  context.stroke();
  context.rotate(
    Math.atan2(runtime.pointer.y - runtime.player.y, runtime.pointer.x - runtime.player.x)
  );
  context.fillStyle = "rgba(255, 255, 255, 0.94)";
  context.fillRect(runtime.player.radius - 2, -3, 18, 6);
  context.restore();

  context.save();
  context.strokeStyle = "rgba(125, 211, 252, 0.9)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(runtime.pointer.x, runtime.pointer.y, 11, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.moveTo(runtime.pointer.x - 16, runtime.pointer.y);
  context.lineTo(runtime.pointer.x + 16, runtime.pointer.y);
  context.moveTo(runtime.pointer.x, runtime.pointer.y - 16);
  context.lineTo(runtime.pointer.x, runtime.pointer.y + 16);
  context.stroke();
  context.restore();

  context.save();
  context.fillStyle = "rgba(255,255,255,0.05)";
  for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
    context.fillRect(0, y, CANVAS_WIDTH, 1);
  }
  context.restore();

  if (phase !== "playing") {
    context.fillStyle = "rgba(2, 6, 23, 0.55)";
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
}

export default function NeonBugHunt() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const runtimeRef = useRef<GameRuntime>(createInitialRuntime());
  const phaseRef = useRef<GamePhase>("ready");
  const keysRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    shooting: false
  });
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [hud, setHud] = useState<HudSnapshot>(getHudSnapshot(runtimeRef.current));
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(HIGH_SCORE_KEY) || 0);
      if (Number.isFinite(saved)) {
        setHighScore(saved);
      }
    } catch {
      setHighScore(0);
    }
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    let animationFrame = 0;
    let lastTimestamp = performance.now();
    let lastHudSync = 0;

    const syncHud = () => {
      setHud(getHudSnapshot(runtimeRef.current));
    };

    const saveHighScore = (score: number) => {
      setHighScore((current) => {
        const next = Math.max(current, score);
        try {
          window.localStorage.setItem(HIGH_SCORE_KEY, String(next));
        } catch {
          return next;
        }
        return next;
      });
    };

    const handleGameOver = () => {
      setPhase("game-over");
      saveHighScore(runtimeRef.current.score);
      syncHud();
    };

    const update = (dt: number) => {
      const runtime = runtimeRef.current;
      const { player } = runtime;

      runtime.time += dt;
      player.fireCooldown = Math.max(0, player.fireCooldown - dt);
      player.invulnerability = Math.max(0, player.invulnerability - dt);
      runtime.comboTimer = Math.max(0, runtime.comboTimer - dt);

      if (runtime.comboTimer === 0) {
        runtime.combo = 0;
      }

      const axisX = Number(keysRef.current.right) - Number(keysRef.current.left);
      const axisY = Number(keysRef.current.down) - Number(keysRef.current.up);
      const movement = normalize(axisX, axisY);
      const hasMovement = axisX !== 0 || axisY !== 0;

      if (hasMovement) {
        player.x = clamp(
          player.x + movement.x * player.speed * dt,
          player.radius + 8,
          CANVAS_WIDTH - player.radius - 8
        );
        player.y = clamp(
          player.y + movement.y * player.speed * dt,
          player.radius + 8,
          CANVAS_HEIGHT - player.radius - 8
        );
      }

      runtime.spawnTimer -= dt;
      if (runtime.spawnTimer <= 0) {
        spawnEnemy(runtime);
        const nextSpawn = lerp(0.82, 0.28, Math.min(runtime.time / 75, 1));
        runtime.spawnTimer = Math.max(0.18, nextSpawn - Math.random() * 0.12);
      }

      if (keysRef.current.shooting && player.fireCooldown <= 0) {
        spawnProjectile(runtime, getAimVector(runtime));
        player.fireCooldown = 0.16;
      }

      runtime.projectiles = runtime.projectiles.filter((projectile) => {
        projectile.x += projectile.vx * dt;
        projectile.y += projectile.vy * dt;
        projectile.life -= dt;
        return (
          projectile.life > 0 &&
          projectile.x > -40 &&
          projectile.x < CANVAS_WIDTH + 40 &&
          projectile.y > -40 &&
          projectile.y < CANVAS_HEIGHT + 40
        );
      });

      runtime.particles = runtime.particles.filter((particle) => {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.life -= dt;
        return particle.life > 0;
      });

      runtime.enemies.forEach((enemy) => {
        const direction = normalize(player.x - enemy.x, player.y - enemy.y);
        enemy.wobble += dt * (enemy.kind === "race" ? 7 : 4);
        const wobbleStrength = enemy.kind === "leak" ? 28 : enemy.kind === "race" ? 16 : 8;

        enemy.vx = direction.x * enemy.speed + Math.cos(enemy.wobble) * wobbleStrength;
        enemy.vy = direction.y * enemy.speed + Math.sin(enemy.wobble) * wobbleStrength;
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;
      });

      const remainingEnemies: Enemy[] = [];

      runtime.enemies.forEach((enemy) => {
        let enemyDestroyed = false;

        for (const projectile of runtime.projectiles) {
          if (distance(enemy, projectile) <= enemy.radius + projectile.radius) {
            projectile.life = 0;
            enemy.hp -= 1;
            spawnBurst(runtime, projectile.x, projectile.y, projectile.hue, 5);

            if (enemy.hp <= 0) {
              runtime.kills += 1;
              runtime.combo += 1;
              runtime.bestCombo = Math.max(runtime.bestCombo, runtime.combo);
              runtime.comboTimer = 1.8;
              runtime.score += enemy.reward + runtime.combo * 3;
              spawnBurst(runtime, enemy.x, enemy.y, enemy.hue, 14);
              enemyDestroyed = true;
              break;
            }
          }
        }

        if (enemyDestroyed) {
          return;
        }

        if (
          player.invulnerability <= 0 &&
          distance(enemy, player) <= enemy.radius + player.radius
        ) {
          player.health = Math.max(0, player.health - enemy.damage);
          player.invulnerability = 0.9;
          runtime.combo = 0;
          runtime.comboTimer = 0;
          spawnBurst(runtime, player.x, player.y, 345, 12);

          if (player.health <= 0) {
            handleGameOver();
            return;
          }

          return;
        }

        remainingEnemies.push(enemy);
      });

      runtime.enemies = remainingEnemies;
      runtime.projectiles = runtime.projectiles.filter((projectile) => projectile.life > 0);
    };

    const frame = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.033);
      lastTimestamp = timestamp;

      if (phaseRef.current === "playing") {
        update(dt);

        if (timestamp - lastHudSync >= HUD_SYNC_MS) {
          syncHud();
          lastHudSync = timestamp;
        }
      }

      drawScene(context, runtimeRef.current, phaseRef.current);
      animationFrame = window.requestAnimationFrame(frame);
    };

    animationFrame = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    const updatePointer = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;

      runtimeRef.current.pointer = {
        x: clamp((clientX - rect.left) * scaleX, 0, CANVAS_WIDTH),
        y: clamp((clientY - rect.top) * scaleY, 0, CANVAS_HEIGHT)
      };
    };

    const setKey = (event: KeyboardEvent, value: boolean) => {
      const key = event.key.toLowerCase();
      if (["w", "arrowup"].includes(key)) {
        keysRef.current.up = value;
      } else if (["s", "arrowdown"].includes(key)) {
        keysRef.current.down = value;
      } else if (["a", "arrowleft"].includes(key)) {
        keysRef.current.left = value;
      } else if (["d", "arrowright"].includes(key)) {
        keysRef.current.right = value;
      } else if (key === " " || key === "spacebar") {
        keysRef.current.shooting = value;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat && event.key !== " ") {
        return;
      }

      if (event.key === "Enter" && phaseRef.current !== "playing") {
        event.preventDefault();
        runtimeRef.current = createInitialRuntime();
        setHud(getHudSnapshot(runtimeRef.current));
        setPhase("playing");
        return;
      }

      if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
      }

      setKey(event, true);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      setKey(event, false);
    };

    const onPointerMove = (event: PointerEvent) => {
      updatePointer(event.clientX, event.clientY);
    };

    const onPointerDown = (event: PointerEvent) => {
      updatePointer(event.clientX, event.clientY);
      keysRef.current.shooting = true;
    };

    const onPointerUp = () => {
      keysRef.current.shooting = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    const canvas = canvasRef.current;
    canvas?.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas?.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const startRun = async (immersive = false) => {
    if (
      immersive &&
      stageRef.current &&
      document.fullscreenElement !== stageRef.current &&
      typeof stageRef.current.requestFullscreen === "function"
    ) {
      try {
        await stageRef.current.requestFullscreen();
      } catch {
        // Ignore browsers that block fullscreen requests.
      }
    }

    runtimeRef.current = createInitialRuntime();
    setHud(getHudSnapshot(runtimeRef.current));
    setPhase("playing");
  };

  return (
    <main className="nbh-page">
      <section className="nbh-stage" ref={stageRef}>
        <section className="nbh-game-panel">
          <div className="nbh-topbar">
            <div>
              <span className="nbh-label">Score</span>
              <strong>{hud.score}</strong>
            </div>
            <div>
              <span className="nbh-label">Health</span>
              <strong>{hud.health}</strong>
            </div>
            <div>
              <span className="nbh-label">Best</span>
              <strong>{Math.max(highScore, hud.score)}</strong>
            </div>
            <div>
              <span className="nbh-label">Time</span>
              <strong>{hud.time.toFixed(1)}s</strong>
            </div>
          </div>

          <div className="nbh-canvas-wrap">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="nbh-canvas"
            />

            {phase !== "playing" && (
              <div className="nbh-overlay">
                <div className="nbh-overlay-top">
                  <a className="nbh-button nbh-button--ghost" href="/">
                    Go To Home
                  </a>
                </div>
                <span className="nbh-overlay-badge">
                  {phase === "ready" ? "Arcade Briefing" : "Run Failed"}
                </span>
                <h2>
                  {phase === "ready" ? "Press Start and clear the bugs" : "Core integrity lost"}
                </h2>
                <p>
                  Move with <kbd>WASD</kbd> or <kbd>Arrow Keys</kbd>. Aim with the mouse and hold
                  click or <kbd>Space</kbd> to fire your debug pulse.
                </p>
                <div className="nbh-overlay-actions">
                  <button className="nbh-button nbh-button--primary" onClick={() => startRun(true)}>
                    {phase === "ready" ? "Boot Fullscreen" : "Retry Fullscreen"}
                  </button>
                  <button className="nbh-button" onClick={() => startRun(false)}>
                    {phase === "ready" ? "Start Windowed" : "Retry Windowed"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
