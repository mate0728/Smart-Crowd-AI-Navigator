// Audio Context setup for syntesized alerts without external sound files
let audioCtx;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Ensure audio works on interaction
document.body.addEventListener('click', () => {
    if(!audioCtx) initAudio();
});

function playSound(type) {
    if(!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') return; // Cannot play without user interaction yet
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'emergency') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(700, audioCtx.currentTime + 0.3);
        osc.frequency.linearRampToValueAtTime(300, audioCtx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
    } else {
        // Soft blip for regular alerts
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    }
}


// Fetch queue data
function loadQueues() {
    fetch("/api/queues")
        .then(res => res.json())
        .then(data => {
            let html = "";
            data.forEach(item => {
                let severity = item.wait_time >= 10 ? "danger" : (item.wait_time >= 6 ? "warning" : "safe");
                let pct = Math.min((item.wait_time / 15) * 100, 100);
                html += `
                <div class="queue-item" style="cursor: pointer;" onclick="simulateAction('Dispatching queue support to ${item.name}', this)">
                    <div style="flex:1;">
                        <span class="queue-name">${item.name}</span>
                        <div style="height:4px; background:rgba(255,255,255,0.1); border-radius:4px; margin-top:8px; overflow:hidden;">
                            <div class="progress-fill ${severity}" style="width: ${pct}%"></div>
                        </div>
                    </div>
                    <span class="queue-time" style="margin-left: 20px;">${item.wait_time}m</span>
                </div>`;
            });
            let qEle = document.getElementById("queues");
            if(qEle) qEle.innerHTML = html;
        });
}
let qEleCheck = document.getElementById("queues");
if (qEleCheck) {
    loadQueues();
    setInterval(loadQueues, 6000);
}

// Socket connection
var socket = io();
let shownAlerts = new Set();

socket.on("alert", function(msg) {
    injectAlert(msg, false);
});

// Heatmap fetch
function loadHeatmap() {
    fetch("/api/heatmap")
        .then(res => res.json())
        .then(data => {
            let html = "";
            data.forEach(zone => {
                html += `
          <div class="zone ${zone.crowd}" onclick="simulateAction('Dispatching team to Zone ${zone.zone}', this)">
            <div class="zone-label">Zone ${zone.zone}</div>
            <div class="zone-status">${zone.crowd}</div>
          </div>
        `;
            });
            let hEle = document.getElementById("heatmap");
            if(hEle) hEle.innerHTML = html;
        });
}
let hEleCheck = document.getElementById("heatmap");
if (hEleCheck) {
    loadHeatmap();
    setInterval(loadHeatmap, 5000);
}

// --- NEW HACKATHON INTERACTIVITY ---

function injectAlert(msg, isCommand=false) {
    let alertsDiv = document.getElementById("alerts");
    if (!alertsDiv) {
        if(msg.includes("CRITICAL")) playSound('emergency');
        return;
    }
    
    let placeholder = alertsDiv.querySelector('.placeholder');
    if(placeholder) placeholder.remove();

    if (!shownAlerts.has(msg) || isCommand) {
        if(!isCommand) shownAlerts.add(msg); // Only dedupe system sockets, not manual commands

        // Play the alert sound
        playSound(msg.includes("CRITICAL") ? 'emergency' : 'info');

        let newAlert = document.createElement("div");
        newAlert.className = "alert-pill";
        
        // Generate current timestamp
        let timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        let timeHtml = `<span style="opacity:0.5; font-size:0.8rem; font-family:monospace; margin-right:8px;">[${timeStr}]</span>`;

        if(isCommand) {
            newAlert.style.borderLeftColor = "#3FB950";
            newAlert.style.background = "rgba(63, 185, 80, 0.1)";
            newAlert.style.borderColor = "rgba(63, 185, 80, 0.3)";
            newAlert.innerHTML = `${timeHtml}<strong>[CMD]</strong> &nbsp; ${msg}`;
        } else {
            newAlert.innerHTML = `${timeHtml} ${msg}`;
        }

        alertsDiv.prepend(newAlert);

        if (alertsDiv.children.length > 5) {
            alertsDiv.removeChild(alertsDiv.lastChild);
        }
    }
}

// Simulate command center buttons
function simulateAction(text, btnElement) {
    let originalText = btnElement.innerText;
    btnElement.innerText = "⏳ Processing...";
    btnElement.style.opacity = "0.7";
    btnElement.disabled = true;
    
    setTimeout(() => {
        btnElement.innerText = "✅ Success";
        btnElement.style.opacity = "1";
        
        injectAlert("SYSTEM: " + text, true);

        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.disabled = false;
        }, 2000);
    }, 800);
}

// Full stadium evacuation sequence
let evacInterval;
function triggerEvacuation(btn) {
    document.getElementById("evac-overlay").classList.remove("hidden");
    document.body.classList.add("evac-mode");
    injectAlert("CRITICAL: EVACUATION PROTOCOL INITIATED", false);
    
    // Play recurring emergency alarm while evacuating
    evacInterval = setInterval(() => {
        playSound('emergency');
    }, 1200);
}

function cancelEvacuation() {
    document.getElementById("evac-overlay").classList.add("hidden");
    document.body.classList.remove("evac-mode");
    clearInterval(evacInterval);
    injectAlert("SYSTEM CLEAR: Evacuation aborted. Resuming normal operations.", true);
}

// Randomize Vitals to simulate IoT sensors
setInterval(() => {
    let noiseBase = 75;
    let newNoise = noiseBase + Math.floor(Math.random() * 20);
    let valNoise = document.getElementById("val-noise");
    if(!valNoise) return;
    
    valNoise.innerText = newNoise + " dB";
    let progNoise = document.getElementById("prog-noise");
    progNoise.style.width = Math.min(newNoise, 100) + "%";
    
    if(newNoise > 88) progNoise.className = "progress-fill danger";
    else if(newNoise > 80) progNoise.className = "progress-fill warning";
    else progNoise.className = "progress-fill safe";

}, 2500);

// Slowly increase occupancy over time
let occ = 42500;
setInterval(() => {
    occ += Math.floor(Math.random() * 8);
    let occEle = document.getElementById("val-occupancy");
    if(!occEle) return;
    occEle.innerHTML = occ.toLocaleString() + ' <span class="sub-val">/ 55,000</span>';
    let pct = (occ / 55000) * 100;
    document.getElementById("prog-occupancy").style.width = pct + "%";
}, 4000);
