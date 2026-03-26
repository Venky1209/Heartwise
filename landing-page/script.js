// Initialize Icons
lucide.createIcons();

// --- 3D Tilt Effect for Cards ---
const cards = document.querySelectorAll('.tilt-card');

cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Multiplier for rotation intensity
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
});

// --- Heart Simulation Logic ---
const bpmSlider = document.getElementById('bpmSlider');
const heroBpmDisplay = document.getElementById('heroBPM');
const conditionTitle = document.getElementById('conditionTitle');
const conditionDesc = document.getElementById('conditionDesc');
const simHeart = document.getElementById('simHeart');
const ambientLight = document.getElementById('ambientLight');

// Simulation State
let currentBPM = 70;
let pulseInterval;

function updateSimulation() {
    const val = parseInt(bpmSlider.value);
    currentBPM = val;
    
    // Update visual info
    if (val < 60) {
        conditionTitle.innerText = "Sinus Bradycardia";
        conditionDesc.innerText = "Resting rate < 60 BPM. Often physiological in athletes due to high vagal tone. Pathological causes include Sick Sinus Syndrome, Hypothyroidism, or AV blocks.";
        conditionTitle.style.color = "#a855f7"; // Purple
        ambientLight.style.background = `radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.15), transparent 60%)`;
    } else if (val >= 60 && val <= 100) {
        conditionTitle.innerText = "Normal Sinus Rhythm";
        conditionDesc.innerText = "Rate 60-100 BPM. Regular rhythm originating from the SA node. P-waves are upright in leads I, II, and aVF, followed by a regular QRS complex.";
        conditionTitle.style.color = "#22d3ee"; // Blue
        ambientLight.style.background = `radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.15), transparent 60%)`;
    } else {
        conditionTitle.innerText = "Sinus Tachycardia";
        conditionDesc.innerText = "Resting rate > 100 BPM. Physiological response to stress/exercise. At very high rates (>150), P-waves may merge with T-waves.";
        conditionTitle.style.color = "#ef4444"; // Red
        ambientLight.style.background = `radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.15), transparent 60%)`;
    }

    // Update Hero text simply
    if(heroBpmDisplay) heroBpmDisplay.innerText = val;

    // Update Heart Animation Speed
    const beatDuration = (60 / val) * 1000;
    
    // CSS Keyframe manipulation or pure JS animation reset
    simHeart.style.animation = 'none';
    simHeart.offsetHeight; // trigger reflow
    simHeart.style.animation = `heartbeat ${60/val}s infinite`;
}

// Attach Styles for animation dynamically
const styleSheet = document.createElement("style");
styleSheet.innerHTML = `
    @keyframes heartbeat {
        0% { transform: scale(1); }
        15% { transform: scale(1.3); }
        30% { transform: scale(1); }
        45% { transform: scale(1.15); }
        60% { transform: scale(1); }
    }
`;
document.head.appendChild(styleSheet);

bpmSlider.addEventListener('input', updateSimulation);
updateSimulation(); // Init

// --- Canvas ECG Animation (Hero & Sim) ---
class ECGGraph {
    constructor(canvasId, lineColor = '#22d3ee', speed = 2) {
        this.canvas = document.getElementById(canvasId);
        if(!this.canvas) return; // Guard clause
        
        this.ctx = this.canvas.getContext('2d');
        this.lineColor = lineColor;
        this.speed = speed;
        this.points = [];
        this.time = 0;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }
    
    resize() {
        // Handle parent container sizing
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.offsetWidth;
        this.canvas.height = parent.offsetHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    getECGValue(t) {
        let val = this.height / 2;
        
        // Simulating medically accurate PQRST complex
        // Constants for 60fps simulation
        const msPerFrame = 1000 / 60; 
        const beatDurationMs = 60000 / currentBPM;
        const beatDurationFrames = beatDurationMs / msPerFrame;
        
        const phase = t % beatDurationFrames; // Frame count within current beat
        const msInBeat = phase * msPerFrame;  // Milliseconds within current beat
        
        // Baseline noise & respiration wander
        val += (Math.random() - 0.5) * 3;
        val += Math.sin(t / 150) * 1.5; 

        // Gaussian Waveform Generator
        const gaussian = (x, mean, sigma, amp) => {
            return amp * Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2));
        };

        // --- Wave Definition (Milliseconds) ---
        // P Wave (Atrial Depolarization) ~80-100ms
        // Starts at ~100ms into the cycle
        val -= gaussian(msInBeat, 120, 15, 5);
        
        // QRS Complex (Ventricular Depolarization) ~80-100ms
        // Q (Septal Depol)
        val += gaussian(msInBeat, 220, 5, 4);
        // R (Main Vertical Vector)
        val -= gaussian(msInBeat, 235, 8, 55);
        // S (Basal Depol)
        val += gaussian(msInBeat, 250, 6, 12);
        
        // T Wave (Ventricular Repolarization)
        // Dynamically calculate QT Interval using Bazett's Formula: QTc = QT / sqrt(RR)
        // QTc normal ~400ms. So QT = 400 * sqrt(RR)
        const rrIntervalSec = 60 / currentBPM;
        const qtDuration = 390 * Math.sqrt(rrIntervalSec); 
        
        // T-wave peak happens roughly at the end of the QT interval
        // We anchor it to the QRS start (220ms) + QT duration
        const tWavePeak = 220 + (qtDuration * 0.85); // Peak is slightly before end of QT
        const tWaveAmp = 9;
        
        // T Wave
        val -= gaussian(msInBeat, tWavePeak, 35, tWaveAmp);
        
        // High Rate modifications (P on T phenomenon)
        // At extremely high rates, the T wave of previous beat might merge with next P
        // But here we simulate one beat cycle.
        
        return val;
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // New point
        const y = this.getECGValue(this.time);
        this.points.push(y);
        
        // Shift if full
        if (this.points.length > this.width / this.speed) {
            this.points.shift();
        }
        
        // Draw
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.lineColor;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.lineColor;
        
        for (let i = 0; i < this.points.length; i++) {
            const x = i * this.speed;
            if (i === 0) this.ctx.moveTo(x, this.points[i]);
            else this.ctx.lineTo(x, this.points[i]);
        }
        this.ctx.stroke();
        
        // Leading Dot
        if(this.points.length > 0) {
            const lastX = (this.points.length - 1) * this.speed;
            const lastY = this.points[this.points.length - 1];
            
            this.ctx.beginPath();
            this.ctx.fillStyle = '#fff';
            this.ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.time++;
        requestAnimationFrame(() => this.animate());
    }
}

// Init Hero Canvas
new ECGGraph('heroECG', '#22d3ee', 2);

// Make a second canvas for the simulation logic if needed, 
// OR simpler: inject a canvas into the .ecg-scroller div
const simCanvas = document.createElement('canvas');
simCanvas.id = 'simCanvas';
simCanvas.style.width = '100%';
simCanvas.style.height = '100%';
document.getElementById('scrollerContainer').appendChild(simCanvas);
// Pass a dynamic color getter or just static for now (color changes via CSS usually, but canvas needs JS)
// Let's make the second graph update color based on BPM in the loop. 
// For now, simpler implementation:
const simGraph = new ECGGraph('simCanvas', '#10b981', 3);

// Modify animate loop for simGraph to check BPM color
const originalAnimate = simGraph.animate;
simGraph.animate = function() {
    if(currentBPM < 60) this.lineColor = '#a855f7';
    else if(currentBPM > 100) this.lineColor = '#ef4444';
    else this.lineColor = '#22d3ee';
    
    this.ctx.shadowColor = this.lineColor;
    originalAnimate.call(this);
}

// --- GSAP Scroll Animations ---
gsap.registerPlugin(ScrollTrigger);

// Hero Text Reveal
gsap.from(".reveal-text", {
    y: 50,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    ease: "power3.out",
    delay: 0.2
});

// Section Transitions
const sections = document.querySelectorAll('section');
sections.forEach(sec => {
    gsap.from(sec.children, {
        scrollTrigger: {
            trigger: sec,
            start: "top 80%",
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out"
    });
});

// --- PQRST Interactive Logic ---
const waveGroups = document.querySelectorAll('.wave-group');
const infoCards = document.querySelectorAll('.info-card');

waveGroups.forEach(group => {
    group.addEventListener('mouseenter', () => {
        // Highlight logic
        waveGroups.forEach(g => g.classList.remove('active'));
        group.classList.add('active');
        
        // Show info logic
        const waveId = group.getAttribute('data-wave');
        infoCards.forEach(card => card.classList.remove('active'));
        document.getElementById(`info-${waveId}`).classList.add('active');
    });
});

// --- Artery Plaque Simulation ---
const plaqueSlider = document.getElementById('plaqueSlider');
const topPlaque = document.querySelector('.top-plaque');
const bottomPlaque = document.querySelector('.bottom-plaque');
const plaqueLevelVal = document.getElementById('plaqueLevelVal');
const cells = document.querySelectorAll('.cell');

plaqueSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    plaqueLevelVal.innerText = val + "%";
    
    // Animate Plaque Growth (max 40px height each side)
    const height = (val / 100) * 80; // Max obstruction
    topPlaque.style.height = `${height}px`;
    bottomPlaque.style.height = `${height}px`;
    
    // Change Artery Color to show inflammation
    const arteryContainer = document.querySelector('.artery-container');
    const redness = 63 + (val * 0.5); // base 63 (dark red) to brighter
    arteryContainer.style.background = `rgb(${redness}, 9, 9)`;
    
    // Calibrate blood flow based on obstruction (Venturi effect + Turbulence)
    // Speed increases as gap narrows
    const speedFactor = 1 + (val / 20); // 1x to 6x speed roughly
    
    cells.forEach(cell => {
        // Use Web Animations API so speed changes don't reset position (smoother)
        const anims = cell.getAnimations();
        let hasAnim = false;
        if(anims.length > 0) {
            anims.forEach(a => { a.playbackRate = speedFactor; hasAnim = true; });
        }
        
        if(!hasAnim) {
            const duration = 3 / speedFactor;
            cell.style.animationDuration = `${duration}s`;
        }

        // Add visual stress to cells at high blockage
        if(val > 50) {
            const stress = (val - 50) / 50; // 0 to 1
            cell.style.filter = `drop-shadow(0 0 ${5 + stress * 10}px rgba(255, 255, 0, ${0.5 + stress * 0.5}))`;
        } else {
            cell.style.filter = "drop-shadow(0 0 5px #ff9999)";
        }
    });
});
