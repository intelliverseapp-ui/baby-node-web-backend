// MGI Inspector v3 — Baby Node Live Event Stream Viewer

console.log("MGI Inspector v3 loaded");

// Connect to Baby Node backend
const url = "https://baby-node-web-backend.onrender.com/mgi/live";   // IMPORTANT: localhost, not 127.0.0.1

const eventList = document.getElementById("event-list");
const statusEl = document.getElementById("status");

function addEventLine(text) {
    const div = document.createElement("div");
    div.className = "event-line";
    div.textContent = text;
    eventList.prepend(div);
}

function connect() {
    statusEl.textContent = "Connecting…";

    const source = new EventSource(url);

    source.onopen = () => {
        statusEl.textContent = "Connected to /mgi/live";
    };

    source.onerror = () => {
        statusEl.textContent = "Error connecting";
    };

    source.onmessage = (msg) => {
        try {
            const obj = JSON.parse(msg.data);
            const line = `[${obj.domain}] ${obj.type} → ${JSON.stringify(obj.payload)}`;
            addEventLine(line);
        } catch (err) {
            console.error("Bad JSON:", msg.data);
        }
    };
}

connect();
