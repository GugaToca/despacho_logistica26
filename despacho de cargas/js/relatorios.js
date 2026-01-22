import { db } from "./firebase.js";
import { toast } from "./ui.js";

import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

let chartStatus;
let chartAbertura;
let chartVolumes;

const $ = s => document.querySelector(s);

$("#ano").value = new Date().getFullYear();
$("#mes").value = new Date().getMonth();

$("#btnGerar").addEventListener("click", gerarRelatorio);

async function gerarRelatorio() {
  const mes = Number($("#mes").value);
  const ano = Number($("#ano").value);

  if (!ano) return toast("Informe o ano", "bad");

  const inicio = new Date(ano, mes, 1, 0, 0, 0);
  const fim = new Date(ano, mes + 1, 0, 23, 59, 59);

  const q = query(
    collection(db, "cargas"),
    where("createdAt", ">=", Timestamp.fromDate(inicio)),
    where("createdAt", "<=", Timestamp.fromDate(fim))
  );

  const snap = await getDocs(q);
  const cargas = snap.docs.map(d => d.data());

    renderKPIs(cargas);
    renderTabela(cargas);
    renderGraficos(cargas);

}

function renderGraficos(cargas) {
  const ok = cargas.filter(c => c.status === "OK").length;
  const erro = cargas.filter(c => c.status === "ERRO").length;

  const abertas = cargas.filter(c => c.aberta).length;
  const fechadas = cargas.filter(c => !c.aberta).length;

  let totalPedidos = 0;
  let totalVolumes = 0;

  cargas.forEach(c => {
    totalPedidos += Number(c.pedidos || 0);
    totalVolumes += Number(c.volumes || 0);
  });

  // 🔄 Destrói gráficos antigos (importante!)
  chartStatus?.destroy();
  chartAbertura?.destroy();
  chartVolumes?.destroy();

  // 🟢 OK x ERRO
  chartStatus = new Chart(document.getElementById("graficoStatus"), {
    type: "doughnut",
    data: {
      labels: ["OK", "ERRO"],
      datasets: [{
        data: [ok, erro],
        backgroundColor: ["#25d67b", "#ff4d6d"]
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: "Status das Cargas" }
      }
    }
  });

  // 🔴 Abertas x Fechadas
  chartAbertura = new Chart(document.getElementById("graficoAbertura"), {
    type: "pie",
    data: {
      labels: ["Abertas", "Fechadas"],
      datasets: [{
        data: [abertas, fechadas],
        backgroundColor: ["#ff4d6d", "#25d67b"]
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: "Situação das Cargas" }
      }
    }
  });

  // 📦 Pedidos x Volumes
  chartVolumes = new Chart(document.getElementById("graficoVolumes"), {
    type: "bar",
    data: {
      labels: ["Pedidos", "Volumes"],
      datasets: [{
        label: "Totais do mês",
        data: [totalPedidos, totalVolumes],
        backgroundColor: ["#6ea8ff", "#9a7bff"]
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: "Pedidos e Volumes no mês" }
      }
    }
  });
}




function renderKPIs(cargas) {
  let pedidos = 0;
  let volumes = 0;

  const abertas = cargas.filter(c => c.aberta).length;
  const erros = cargas.filter(c => c.status === "ERRO").length;

  cargas.forEach(c => {
    pedidos += Number(c.pedidos || 0);
    volumes += Number(c.volumes || 0);
  });

  $("#kpis").innerHTML = `
    <div class="box"><div class="n">${cargas.length}</div><div class="t">Cargas</div></div>
    <div class="box"><div class="n">${abertas}</div><div class="t">Abertas</div></div>
    <div class="box"><div class="n">${erros}</div><div class="t">Com erro</div></div>
    <div class="box"><div class="n">${pedidos}</div><div class="t">Pedidos</div></div>
    <div class="box"><div class="n">${volumes}</div><div class="t">Volumes</div></div>
  `;
}

function renderTabela(cargas) {
  const tbody = $("#tbody");

  if (!cargas.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="mini">Nenhuma carga no período</td></tr>`;
    return;
  }

  tbody.innerHTML = cargas.map(c => `
    <tr class="tr">
      <td><strong>${c.numero}</strong></td>
      <td>${c.transportadoraLabel}</td>
      <td>${c.pedidos}</td>
      <td>${c.volumes}</td>
      <td>${c.status}</td>
      <td>${c.aberta ? "ABERTA" : "FECHADA"}</td>
      <td>${c.createdAt?.toDate().toLocaleDateString()}</td>
    </tr>
  `).join("");
}
