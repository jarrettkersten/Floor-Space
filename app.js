const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");

let shapes = [];
let currentZoom = 1;
let gridSize = 20;
let isDrawing = false;
let drawStart = null;
let currentDate = null;
let visibleLayers = new Set();

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#eee";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += gridSize * currentZoom) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize * currentZoom) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawShapes() {
  drawGrid();
  shapes.forEach(shape => {
    if (!visibleLayers.has(shape.layer)) return;
    if (new Date(shape.startDate) <= currentDate && currentDate <= new Date(shape.endDate)) {
      ctx.fillStyle = shape.color || "rgba(0, 150, 255, 0.4)";
      ctx.strokeStyle = "#000";
      ctx.fillRect(...shape.coords.map(c => c * currentZoom));
      ctx.strokeRect(...shape.coords.map(c => c * currentZoom));
    }
  });
}

function updateDateDisplay() {
  const slider = document.getElementById("timelineSlider");
  if (!shapes.length) return;
  const min = new Date(Math.min(...shapes.map(s => new Date(s.startDate))));
  const max = new Date(Math.max(...shapes.map(s => new Date(s.endDate))));
  const days = (max - min) / (1000 * 3600 * 24);
  slider.max = days;
  const offset = parseInt(slider.value);
  const targetDate = new Date(min);
  targetDate.setDate(min.getDate() + offset);
  currentDate = targetDate;
  document.getElementById("currentDate").innerText = currentDate.toISOString().split("T")[0];
  drawShapes();
}

canvas.addEventListener("mousedown", e => {
  if (!document.getElementById("drawMode").classList.contains("active")) return;
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  drawStart = [
    Math.floor((e.clientX - rect.left) / (gridSize * currentZoom)),
    Math.floor((e.clientY - rect.top) / (gridSize * currentZoom))
  ];
});

canvas.addEventListener("mouseup", e => {
  if (!isDrawing) return;
  isDrawing = false;
  const rect = canvas.getBoundingClientRect();
  const end = [
    Math.floor((e.clientX - rect.left) / (gridSize * currentZoom)),
    Math.floor((e.clientY - rect.top) / (gridSize * currentZoom))
  ];

  const coords = [
    Math.min(drawStart[0], end[0]),
    Math.min(drawStart[1], end[1]),
    Math.abs(drawStart[0] - end[0]),
    Math.abs(drawStart[1] - end[1])
  ];

  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const layer = document.getElementById("layerInput").value || "Default";

  const shape = {
    coords,
    startDate,
    endDate,
    layer,
    color: randomColorFromLayer(layer)
  };
  shapes.push(shape);
  updateLayers();
  updateDateDisplay();
});

function updateLayers() {
  const container = document.getElementById("layerFilters");
  container.innerHTML = "";
  const layers = [...new Set(shapes.map(s => s.layer))];
  layers.forEach(layer => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.onchange = () => {
      if (checkbox.checked) visibleLayers.add(layer);
      else visibleLayers.delete(layer);
      drawShapes();
    };
    visibleLayers.add(layer);
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + layer));
    container.appendChild(label);
  });
}

function randomColorFromLayer(layer) {
  const hash = Array.from(layer).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const r = (hash * 123) % 255;
  const g = (hash * 321) % 255;
  const b = (hash * 231) % 255;
  return `rgba(${r},${g},${b},0.4)`;
}

document.getElementById("drawMode").onclick = e => {
  e.target.classList.toggle("active");
};

document.getElementById("saveShape").onclick = () => {
  localStorage.setItem("shapes", JSON.stringify(shapes));
  alert("Shapes saved!");
};

document.getElementById("zoomIn").onclick = () => {
  currentZoom *= 1.25;
  drawShapes();
};

document.getElementById("zoomOut").onclick = () => {
  currentZoom = Math.max(0.5, currentZoom / 1.25);
  drawShapes();
};

document.getElementById("timelineSlider").addEventListener("input", updateDateDisplay);

window.onload = () => {
  const saved = localStorage.getItem("shapes");
  if (saved) shapes = JSON.parse(saved);
  updateLayers();
  updateDateDisplay();
};
