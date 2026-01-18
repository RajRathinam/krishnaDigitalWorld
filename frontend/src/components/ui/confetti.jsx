import React, { useEffect, useRef } from "react";

export const Confetti = ({ isActive, duration = 3000 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!isActive) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let animationFrameId;
        let particles = [];
        const colors = ["#FF6B35", "#F7C59F", "#FFD700", "#22C55E", "#3B82F6", "#A855F7", "#EC4899"];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.size = Math.random() * 8 + 4;
                this.speedX = Math.random() * 6 - 3; // Horizontal spread
                this.speedY = Math.random() * -15 - 5; // Upward explosion
                this.gravity = 0.5;
                this.rotation = Math.random() * 360;
                this.rotationSpeed = Math.random() * 10 - 5;
                this.opacity = 1;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.speedY += this.gravity;
                this.rotation += this.rotationSpeed;
                if (this.y > canvas.height) {
                    // Reset or remove? For explosion, we let them fall off
                    this.opacity -= 0.02;
                }
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.rotation * Math.PI) / 180);
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }
        }

        // Create explosion from center
        const createExplosion = () => {
            for (let i = 0; i < 150; i++) {
                particles.push(new Particle(canvas.width / 2, canvas.height / 2));
            }
        };

        createExplosion();

        let startTime = Date.now();

        const animate = () => {
            const currentTime = Date.now();
            if (currentTime - startTime > duration) {
                cancelAnimationFrame(animationFrameId);
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear final frame
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, index) => {
                p.update();
                p.draw();

                // Remove particles that are off screen or invisible
                if (p.y > canvas.height + 50 || p.opacity <= 0) {
                    particles.splice(index, 1);
                }
            });

            // Keep adding a few particles for the duration if desired, or just one big explosion.
            // Let's do one big explosion for "Sign In" / "Order Placed" feel.
            // If we want continuous rain, we'd add checks here. 
            // Current impl is closer to "Explosion".

            if (particles.length > 0) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isActive, duration]);

    if (!isActive) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]"
            style={{ width: "100%", height: "100%" }}
        />
    );
};
