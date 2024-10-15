"use client";

import { useEffect, useRef } from "react";
import Matter from "matter-js";
import { useViewportSize } from "@mantine/hooks";

export function Field({ blurAmount = 0 }: { blurAmount?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = useViewportSize();

  const lastAimingAngles = [0, 0, 0, 0, 0, 0];
  const lastRobotPositions = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ];
  const lastMoveTimes = Array(6).fill(Date.now());

  useEffect(() => {
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
    });

    const render = Matter.Render.create({
      canvas: canvasRef.current!,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: "transparent",
        hasBounds: false,
      },
    });

    const wallOptions = { isStatic: true, render: { visible: false } };
    const ground = Matter.Bodies.rectangle(
      width / 2,
      height + 25,
      width,
      50,
      wallOptions,
    );
    const ceiling = Matter.Bodies.rectangle(
      width / 2,
      -25,
      width,
      50,
      wallOptions,
    );
    const leftWall = Matter.Bodies.rectangle(
      -25,
      height / 2,
      50,
      height,
      wallOptions,
    );
    const rightWall = Matter.Bodies.rectangle(
      width + 25,
      height / 2,
      50,
      height,
      wallOptions,
    );

    let gamePieces = Array.from({ length: 10 }, () => ({
      body: Matter.Bodies.circle(
        Math.random() * (width - 200) + 100,
        Math.random() * (height - 200) + 100,
        15,
        { restitution: 0.8, render: { fillStyle: "#FFA500" } },
      ),
      lastFired: 0,
    }));

    const robots = [
      // Scoring robots for team blue
      Matter.Bodies.rectangle(width - 50, height / 2 - 100, 50, 50, {
        frictionAir: 0.05,
        render: { fillStyle: "#3496eb" },
      }),
      Matter.Bodies.rectangle(width - 50, height / 2, 50, 50, {
        frictionAir: 0.05,
        render: { fillStyle: "#3496eb" },
      }),
      // Defense robot for team blue
      Matter.Bodies.rectangle(width - 50, height / 2 + 100, 55, 50, {
        frictionAir: 0.05,
        restitution: 0.95,
        mass: 10,
        render: { fillStyle: "#3496eb" },
      }),
      // Scoring robots for team red
      Matter.Bodies.rectangle(50, height / 2 - 100, 50, 50, {
        frictionAir: 0.05,
        render: { fillStyle: "#eb4034" },
      }),
      Matter.Bodies.rectangle(50, height / 2, 50, 50, {
        frictionAir: 0.05,
        render: { fillStyle: "#eb4034" },
      }),
      // Defense robot for team red
      Matter.Bodies.rectangle(50, height / 2 + 100, 55, 50, {
        frictionAir: 0.05,
        restitution: 0.95,
        mass: 10,
        render: { fillStyle: "#eb4034" },
      }),
    ];

    const turret = {
      width: 40,
      height: 30,
      offsetX: 0,
      offsetY: 0,
    };

    const intake = {
      width: 10,
      height: 60,
      offsetX: 0,
      offsetY: 0,
    };

    const carrying = Array(6).fill(null);

    function findClosestGamePiece(robot: Matter.Body, isTopHalf: boolean) {
      const currentTime = Date.now();
      return gamePieces.reduce(
        (
          closest: { piece: Matter.Body; distance: number } | null,
          gamePiece,
        ) => {
          const { body: piece, lastFired } = gamePiece;
          if (currentTime - lastFired < 1000) return closest;
          const dx = piece.position.x - robot.position.x;
          const dy = piece.position.y - robot.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const pieceInTargetHalf = isTopHalf
            ? piece.position.y < height / 2
            : piece.position.y >= height / 2;
          return pieceInTargetHalf &&
              (closest === null || distance < closest.distance)
            ? { piece, distance }
            : closest;
        },
        null,
      )?.piece;
    }

    function lerpAngle(
      currentAngle: number,
      targetAngle: number,
      t: number,
    ): number {
      const difference = targetAngle - currentAngle;
      const shortestAngle = ((difference + Math.PI) % (2 * Math.PI)) - Math.PI;
      return currentAngle + shortestAngle * t;
    }

    function drawTurret(
      robot: Matter.Body,
      lastAimingAngle: number,
      scoringPoint: { x: number; y: number },
      color: string,
      index: number,
    ) {
      if (index % 3 === 2) return;
      const ctx = canvasRef.current!.getContext("2d");
      if (ctx) {
        const dx = scoringPoint.x - (robot.position.x + turret.offsetX);
        const dy = scoringPoint.y - (robot.position.y + turret.offsetY);
        const distanceToScoringPoint = Math.sqrt(dx * dx + dy * dy);

        let angleToUse;

        if (distanceToScoringPoint <= 500) {
          const targetAngle = Math.atan2(dy, dx);
          angleToUse = lerpAngle(
            robot.angle + lastAimingAngle,
            targetAngle,
            0.1,
          );
          lastAimingAngles[index] = angleToUse - robot.angle;
        } else {
          angleToUse = robot.angle + lastAimingAngle;
        }

        ctx.save();
        ctx.translate(
          robot.position.x + turret.offsetX,
          robot.position.y + turret.offsetY,
        );
        ctx.rotate(angleToUse);
        ctx.fillStyle = color;
        ctx.fillRect(
          -turret.width / 2,
          -turret.height / 2,
          turret.width,
          turret.height,
        );
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          -turret.width / 2,
          -turret.height / 2,
          turret.width,
          turret.height,
        );
        ctx.restore();
      }
    }

    function drawIntake(robot: Matter.Body, color: string, index: number) {
      if (index % 3 === 2) return;
      const ctx = canvasRef.current!.getContext("2d");
      if (ctx) {
        const intakeOffsetX = Math.cos(robot.angle) * 25;
        const intakeOffsetY = Math.sin(robot.angle) * 25;

        ctx.save();
        ctx.translate(
          robot.position.x + intakeOffsetX,
          robot.position.y + intakeOffsetY,
        );
        ctx.rotate(robot.angle);
        ctx.fillStyle = color;
        ctx.fillRect(
          -intake.width / 2,
          -intake.height / 2,
          intake.width,
          intake.height,
        );
        ctx.restore();
      }
    }

    function drawScoringPoints() {
      const ctx = canvasRef.current!.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.fillStyle = "rgba(52, 150, 230, 0.5)";
        ctx.beginPath();
        ctx.arc(width - 50, height / 2, 40, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "rgba(235, 64, 52, 0.5)";
        ctx.beginPath();
        ctx.arc(50, height / 2, 40, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }
    }

    Matter.Events.on(render, "afterRender", () => {
      for (let i = 0; i < robots.length; i++) {
        const color = i < 3 ? "rgba(0, 0, 255, 0.7)" : "rgba(255, 0, 0, 0.7)";
        const scoringPoint = i < 3
          ? { x: width - 50, y: height / 2 }
          : { x: 50, y: height / 2 };
        drawTurret(robots[i], lastAimingAngles[i], scoringPoint, color, i);
        drawIntake(robots[i], color, i);
      }
      drawScoringPoints();
    });

    Matter.Events.on(engine, "beforeUpdate", () => {
      const scoringPoints = [
        { x: width - 50, y: height / 2 },
        { x: width - 50, y: height / 2 },
        { x: width - 50, y: height / 2 },
        { x: 50, y: height / 2 },
        { x: 50, y: height / 2 },
        { x: 50, y: height / 2 },
      ];

      function updateRobot(
        robot: Matter.Body,
        carrying: Matter.Body | null,
        lastAimingAngle: number,
        scoringPoint: { x: number; y: number },
        index: number,
      ) {
        if (index % 3 === 2) { // Defense robot behavior
          const opposingScoringRobots = robots.filter((_, robotIndex) =>
            robotIndex % 3 !== 2 &&
            (index < 3 ? robotIndex >= 3 : robotIndex < 3)
          );

          const closestScoringRobot = opposingScoringRobots.reduce(
            (
              closest: { robot: Matter.Body; distance: number } | null,
              scoringRobot,
            ) => {
              const dx = scoringRobot.position.x - robot.position.x;
              const dy = scoringRobot.position.y - robot.position.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              return (closest === null || distance < closest.distance)
                ? { robot: scoringRobot, distance }
                : closest;
            },
            null,
          );

          if (closestScoringRobot) {
            const dx = closestScoringRobot.robot.position.x -
              (width - scoringPoint.x);
            const dy = closestScoringRobot.robot.position.y - scoringPoint.y;
            const targetX = closestScoringRobot.robot.position.x - dx / 2;
            const targetY = closestScoringRobot.robot.position.y - dy / 2;
            const targetAngle = Math.atan2(
              targetY - robot.position.y,
              targetX - robot.position.x,
            );

            const currentAngle = robot.angle;
            const angleDifference = Math.atan2(
              Math.sin(targetAngle - currentAngle),
              Math.cos(targetAngle - currentAngle),
            );

            const shouldReverse = Math.abs(angleDifference) > Math.PI / 2;

            const effectiveAngle = shouldReverse
              ? targetAngle + Math.PI
              : targetAngle;
            const adjustedAngleDifference = Math.atan2(
              Math.sin(effectiveAngle - currentAngle),
              Math.cos(effectiveAngle - currentAngle),
            );
            const newAngle = currentAngle + adjustedAngleDifference * 0.05;

            const forceMagnitude = 0.007;
            const forceDirection = shouldReverse ? -1 : 1;
            Matter.Body.applyForce(robot, robot.position, {
              x: Math.cos(newAngle) * forceMagnitude * forceDirection,
              y: Math.sin(newAngle) * forceMagnitude * forceDirection,
            });
            Matter.Body.setAngle(robot, newAngle);
          }
        } else { // Scoring robot behavior
          const isTopHalf = index === 0 || index === 3;
          if (!carrying) {
            const closestPiece = findClosestGamePiece(robot, isTopHalf);
            if (closestPiece) {
              const dx = closestPiece.position.x - robot.position.x;
              const dy = closestPiece.position.y - robot.position.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const targetAngle = Math.atan2(dy, dx);
              const currentAngle = robot.angle;

              const angleDifference = Math.atan2(
                Math.sin(targetAngle - currentAngle),
                Math.cos(targetAngle - currentAngle),
              );

              if (distance < 250) {
                const newAngle = lerpAngle(currentAngle, targetAngle, 0.05);
                Matter.Body.setAngle(robot, newAngle);
              }

              const forceMagnitude = 0.002;
              Matter.Body.applyForce(robot, robot.position, {
                x: Math.cos(targetAngle) * forceMagnitude,
                y: Math.sin(targetAngle) * forceMagnitude,
              });

              if (distance < 45 && Math.abs(angleDifference) < Math.PI / 6) {
                carrying = closestPiece;
                Matter.World.remove(engine.world, carrying);
                const gamePieceObject = gamePieces.find((gp) =>
                  gp.body === closestPiece
                );
                if (gamePieceObject) {
                  gamePieceObject.lastFired = Date.now();
                }
              }
            }
          } else {
            const dx = scoringPoint.x - robot.position.x;
            const dy = scoringPoint.y - robot.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const targetAngle = Math.atan2(dy, dx);

            if (distance <= 100) {
              const backAwayForceMagnitude = 0.002;
              Matter.Body.applyForce(robot, robot.position, {
                x: -Math.cos(targetAngle) * backAwayForceMagnitude,
                y: -Math.sin(targetAngle) * backAwayForceMagnitude,
              });
            } else if (distance <= 400) {
              const firingPositionX = robot.position.x +
                Math.cos(lastAimingAngle + robot.angle) * (turret.offsetX + 50);
              const firingPositionY = robot.position.y +
                Math.sin(lastAimingAngle + robot.angle) * (turret.offsetY + 50);

              Matter.Body.setPosition(carrying, {
                x: firingPositionX,
                y: firingPositionY,
              });

              const carryingPiece = gamePieces.find((gp) =>
                gp.body === carrying
              );

              if (carryingPiece && Date.now() - carryingPiece.lastFired > 200) {
                const firingForceMagnitude = 0.025;
                Matter.Body.applyForce(carrying, {
                  x: firingPositionX,
                  y: firingPositionY,
                }, {
                  x: Math.cos(targetAngle) * firingForceMagnitude,
                  y: Math.sin(targetAngle) * firingForceMagnitude,
                });

                carryingPiece.lastFired = Date.now();
                Matter.World.add(engine.world, carrying);
                carrying = null;
              }
            } else {
              const forceMagnitude = 0.002;
              Matter.Body.applyForce(robot, robot.position, {
                x: Math.cos(targetAngle) * forceMagnitude,
                y: Math.sin(targetAngle) * forceMagnitude,
              });
            }
          }
        }
        return carrying;
      }

      for (let i = 0; i < robots.length; i++) {
        carrying[i] = updateRobot(
          robots[i],
          carrying[i],
          lastAimingAngles[i],
          scoringPoints[i],
          i,
        );
      }

      const remainingGamePieces = gamePieces.filter((gamePiece) => {
        const pieceToScoringPointDistance1 = Math.sqrt(
          Math.pow(gamePiece.body.position.x - scoringPoints[0].x, 2) +
            Math.pow(gamePiece.body.position.y - scoringPoints[0].y, 2),
        );
        const pieceToScoringPointDistance2 = Math.sqrt(
          Math.pow(gamePiece.body.position.x - scoringPoints[3].x, 2) +
            Math.pow(gamePiece.body.position.y - scoringPoints[3].y, 2),
        );
        if (
          pieceToScoringPointDistance1 < 35 || pieceToScoringPointDistance2 < 35
        ) {
          Matter.World.remove(engine.world, gamePiece.body);
          return false;
        }
        return true;
      });

      const numberOfPiecesToRemove = gamePieces.length -
        remainingGamePieces.length;
      let topHalfPieces = remainingGamePieces.filter((gp) =>
        gp.body.position.y < height / 2
      ).length;
      let bottomHalfPieces = remainingGamePieces.filter((gp) =>
        gp.body.position.y >= height / 2
      ).length;

      for (let i = 0; i < numberOfPiecesToRemove; i++) {
        let yPos;
        if (topHalfPieces < 3) {
          yPos = Math.random() * (height / 2 - 200) + 100;
        } else if (bottomHalfPieces < 3) {
          yPos = Math.random() * (height / 2 - 200) + (height / 2) + 100;
        } else {
          yPos = Math.random() * (height - 200) + 100;
        }

        const newPiece = {
          body: Matter.Bodies.circle(
            Math.random() * (width - 200) + 100,
            yPos,
            15,
            { restitution: 0.8, render: { fillStyle: "#FFA500" } },
          ),
          lastFired: 0,
        };
        remainingGamePieces.push(newPiece);
        Matter.World.add(engine.world, newPiece.body);

        if (yPos < height / 2) {
          topHalfPieces++;
        } else {
          bottomHalfPieces++;
        }
      }
      gamePieces = remainingGamePieces;

      const currentTime = Date.now();

      for (let i = 0; i < robots.length; i++) {
        if (
          Math.sqrt(
            Math.pow(robots[i].position.x - lastRobotPositions[i].x, 2) +
              Math.pow(robots[i].position.y - lastRobotPositions[i].y, 2),
          ) < 1
        ) {
          if (currentTime - lastMoveTimes[i] > 5000) {
            Matter.Body.setPosition(robots[i], {
              x: i < 3 ? width - 50 : 50,
              y: height / 2 + (i % 3 - 1) * 100,
            });
            Matter.Body.setVelocity(robots[i], { x: 0, y: 0 });
            carrying[i] = null;
            lastMoveTimes[i] = currentTime;
          }
        } else {
          lastMoveTimes[i] = currentTime;
        }

        lastRobotPositions[i] = {
          x: robots[i].position.x,
          y: robots[i].position.y,
        };
      }
    });

    Matter.World.add(engine.world, [
      ground,
      ceiling,
      leftWall,
      rightWall,
      ...gamePieces.map((gp) => gp.body),
      ...robots,
    ]);

    Matter.Runner.run(engine);
    Matter.Render.run(render);

    return () => {
      Matter.Render.stop(render);
      Matter.Engine.clear(engine);
      Matter.World.clear(engine.world, false);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        zIndex: -1,
        position: "fixed",
        top: 0,
        left: 0,
        filter: `blur(${blurAmount}px)`,
        padding: 0,
        margin: 0,
      }}
    />
  );
}
