import { getCommand, sendCommand } from "./api.js";
import { initRobot3D, setPose, resetCamera } from "./robot3d.js";

const fields = ["angleS", "angleE", "angleH"];
const inputs = Object.fromEntries(fields.map(id => [id, document.getElementById(id)]));
const sendButton = document.getElementById("send-command");
const homeButton = document.getElementById("home-position");
const toast = document.getElementById("toast");

let toastTimer;
let activityCount = 1;

function currentPose() {
  return Object.fromEntries(fields.map(id => [id, Number(inputs[id].value)]));
}

function renderPose(pose) {
  for (const id of fields) {
    const value = Number(pose[id]);
    inputs[id].value = value;
    document.getElementById(`${id}-output`).textContent = `${value}°`;
    const summaryId = { angleS: "summaryS", angleE: "summaryE", angleH: "summaryH" }[id];
    document.getElementById(summaryId).textContent = `${value}°`;
    const percent = ((value - 10) / 150) * 100;
    inputs[id].style.background =
      `linear-gradient(to right,#2d94ed 0%,#2d94ed ${percent}%,#2c3949 ${percent}%,#2c3949 100%)`;
  }
  setPose(pose);
}

function setConnection(online) {
  document.getElementById("connection-dot").classList.toggle("online", online);
  document.getElementById("connection-label").textContent =
    online ? "Servidor conectado" : "Servidor indisponível";
}

function logActivity(message, error = false) {
  const log = document.getElementById("activity-log");
  const row = document.createElement("div");
  row.className = `activity-entry${error ? " error" : ""}`;
  const marker = document.createElement("i");
  const time = document.createElement("time");
  time.textContent = new Date().toLocaleTimeString("pt-BR", { hour12: false });
  const text = document.createElement("span");
  text.textContent = message;
  row.append(marker, time, text);
  log.prepend(row);
  activityCount += 1;
  document.getElementById("activity-count").textContent = String(activityCount).padStart(2, "0");
  while (log.children.length > 4) log.lastElementChild.remove();
}

function showToast(message, error = false) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("error", error);
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function renderServerPose(pose) {
  document.getElementById("serverS").innerHTML = `${pose.angleS}<em>°</em>`;
  document.getElementById("serverE").innerHTML = `${pose.angleE}<em>°</em>`;
  document.getElementById("serverH").innerHTML = `${pose.angleH}<em>°</em>`;
}

async function syncFromServer() {
  try {
    const pose = await getCommand();
    renderServerPose(pose);
    setConnection(true);
    return pose;
  } catch (error) {
    setConnection(false);
    throw error;
  }
}

async function initialize() {
  try {
    const pose = await syncFromServer();
    renderPose(pose);
    document.getElementById("session-state").textContent = "SINCRONIZADO";
    document.getElementById("session-state").style.color = "var(--green)";
    logActivity("Estado inicial recebido do servidor.");
  } catch (error) {
    document.getElementById("session-state").textContent = "SEM CONEXÃO";
    logActivity(`Falha ao consultar API: ${error.message}`, true);
    showToast("Não foi possível conectar ao servidor.", true);
  }
}

for (const id of fields) {
  inputs[id].addEventListener("input", () => renderPose(currentPose()));
}

sendButton.addEventListener("click", async () => {
  const pose = currentPose();
  sendButton.disabled = true;
  sendButton.textContent = "Enviando...";
  try {
    const result = await sendCommand(pose);
    renderServerPose(result.comando || pose);
    setConnection(true);
    document.getElementById("session-state").textContent = "COMANDO ENVIADO";
    document.getElementById("session-state").style.color = "var(--green)";
    document.getElementById("last-update").textContent =
      `Enviado às ${new Date().toLocaleTimeString("pt-BR", { hour12: false })}`;
    logActivity(`POST concluído: S ${pose.angleS}° · E ${pose.angleE}° · H ${pose.angleH}°`);
    showToast("Comando enviado ao servidor.");
  } catch (error) {
    setConnection(false);
    logActivity(`Erro ao enviar comando: ${error.message}`, true);
    showToast(error.message, true);
  } finally {
    sendButton.disabled = false;
    sendButton.innerHTML = 'Enviar comando <span>↗</span>';
  }
});

homeButton.addEventListener("click", () => {
  renderPose({
    angleS: 90,
    angleE: 180,
    angleH: 90
  });

  showToast("Prévia ajustada para a posição de referência.");
});

document.getElementById("reset-camera").addEventListener("click", resetCamera);

try {
  initRobot3D(document.getElementById("viewport"));
} catch (error) {
  document.getElementById("viewport-error").classList.remove("hidden");
  logActivity(`Falha no visualizador 3D: ${error.message}`, true);
}


initialize();
