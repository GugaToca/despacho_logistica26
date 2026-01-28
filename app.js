// js/app.js
import { db, auth } from "./firebase.js";
import { toast, pad4 } from "./ui.js";

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  limit,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const $ = (s) => document.querySelector(s);

const form = $("#formCarga");
const selTransp = $("#transportadora");
const tbody = $("#tbody");
const busca = $("#busca");
const filtroAbertura = $("#filtroAbertura");

let transportadorasCache = [];
let cargasCache = [];

async function loadTransportadoras() {
  const snap = await getDocs(query(collection(db, "transportadoras"), orderBy("codigo", "asc")));
  transportadorasCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  selTransp.innerHTML = `<option value="">Selecione...</option>` +
    transportadorasCache
      .filter(t => t.ativo !== false)
      .map(t => `<option value="${t.id}">${t.codigo} - ${escapeHtml(t.nome)}</option>`)
      .join("");

  if (!transportadorasCache.length) {
    selTransp.innerHTML = `<option value="">Cadastre uma transportadora primeiro</option>`;
  }
}

function escapeHtml(str=""){
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

async function getNextNumero() {
  // pega a última carga por número (string) - para garantir, tentamos converter
  const q = query(collection(db, "cargas"), orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);

  let max = 0;
  snap.forEach((d) => {
    const n = parseInt(String(d.data().numero || "").replace(/\D/g,""), 10);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  });

  return pad4(max + 1);
}

function render() {
  const term = (busca.value || "").trim().toLowerCase();
  const filter = filtroAbertura.value;

  let list = [...cargasCache];

  if (filter === "abertas") list = list.filter(c => c.aberta === true);
  if (filter === "fechadas") list = list.filter(c => c.aberta === false);

  if (term) {
    list = list.filter(c => {
      const hay = [
        c.numero,
        c.transportadoraLabel,
        c.createdByName,
        c.status,
        c.observacoes
      ].join(" ").toLowerCase();
      return hay.includes(term);
    });
  }

  // KPIs
  $("#kpiTotal").textContent = cargasCache.length;
  $("#kpiAbertas").textContent = cargasCache.filter(c => c.aberta).length;
  $("#kpiErro").textContent = cargasCache.filter(c => c.status === "ERRO").length;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="mini">Nenhuma carga encontrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => {
  const badgeStatus = c.status === "OK"
  ? `<span class="badge badge--ok">OK</span>`
  : `<span class="badge badge--bad">ERRO</span>`;

const badgeAbertura = c.aberta
  ? `<span class="badge badge--bad">ABERTA</span>`
  : `<span class="badge badge--ok">FECHADA</span>`;


  return `
    <tr class="tr">
      <td data-label="Carga">${c.numero}</td>

      <td data-label="Transportadora">
        ${c.transportadoraLabel}
      </td>

      <td data-label="Pedidos">
        ${Number(c.pedidos ?? 0)}
      </td>

      <td data-label="Volumes">
        ${Number(c.volumes ?? 0)}
      </td>

      <td data-label="Status">
        ${badgeStatus}
      </td>

      <td data-label="Situação">
        ${badgeAbertura}
      </td>

      <td data-label="Criada por">
  ${c.createdByName || "—"}
</td>


      <td data-label="Ações">
        <div class="toolbar">
          <button
            class="btn btn--ok"
            data-action="toggle"
            data-id="${c.id}">
            ${c.aberta ? "Fechar" : "Abrir"}
          </button>

          <button
            class="btn"
            data-action="edit"
            data-id="${c.id}">
            Editar
          </button>
        </div>
      </td>
    </tr>
  `;
}).join("");

}

function fillForm(c) {
  $("#numero").value = c.numero || "";
  $("#transportadora").value = c.transportadoraId || "";
  $("#pedidos").value = c.pedidos ?? 0;
  $("#volumes").value = c.volumes ?? 0;
  $("#status").value = c.status || "OK";
  $("#aberta").value = String(c.aberta ?? true);
  $("#observacoes").value = c.observacoes || "";

  form.dataset.editing = c.id;
  $("#btnSalvar").textContent = "Salvar alterações";
}

function clearForm() {
  form.reset();
  $("#numero").value = "";
  $("#rota").value = "";          // 👈 AQUI (linha que você perguntou)
  $("#pedidos").value = 0;
  $("#volumes").value = 0;
  $("#status").value = "OK";
  $("#aberta").value = "true";
  $("#observacoes").value = "";
  form.dataset.editing = "";
  $("#btnSalvar").textContent = "Salvar carga";
}


async function upsertCarga(payload) {
  const user = auth.currentUser;
  if (!user) {
    toast("Você precisa estar logado.", "bad");
    return;
  }

  const editingId = form.dataset.editing || "";
  if (editingId) {
    await updateDoc(doc(db, "cargas", editingId), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
    toast("Carga atualizada.", "ok");
    clearForm();
  } else {
    await addDoc(collection(db, "cargas"), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdByUid: user.uid,
      createdByName: user.displayName || user.email || "Usuário",
    });
    toast("Carga criada.", "ok");
    clearForm();
  }
}

async function initCargasLive() {
  const qy = query(collection(db, "cargas"), orderBy("createdAt", "desc"));
  onSnapshot(qy, (snap) => {
    cargasCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  });
}

tbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  const found = cargasCache.find(c => c.id === id);
  if (!found) return;

  if (action === "edit") {
    fillForm(found);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "toggle") {
    await updateDoc(doc(db, "cargas", id), {
      aberta: !found.aberta,
      updatedAt: serverTimestamp(),
    });
    toast(found.aberta ? "Carga fechada." : "Carga aberta.", "info");
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!transportadorasCache.length) {
    toast("Cadastre uma transportadora primeiro.", "bad");
    return;
  }

  const transportadoraId = selTransp.value;
  const t = transportadorasCache.find(x => x.id === transportadoraId);

  if (!t) {
    toast("Selecione uma transportadora válida.", "bad");
    return;
  }

  let numero = ($("#numero").value || "").trim();
  if (!numero) numero = await getNextNumero();
  numero = pad4(parseInt(numero.replace(/\D/g,"") || "0", 10) || numero);

  const rota = document.querySelector("#rota").value.trim();

  const payload = {
    numero,
    transportadoraId: t.id,
    transportadoraLabel: `${t.codigo} - ${t.nome}`,
    rota,
    pedidos: Number($("#pedidos").value || 0),
    volumes: Number($("#volumes").value || 0),
    status: $("#status").value === "ERRO" ? "ERRO" : "OK",
    aberta: $("#aberta").value === "true",
    observacoes: ($("#observacoes").value || "").trim(),
  };

  try {
    await upsertCarga(payload);
  } catch (err) {
    toast(err?.message || "Erro ao salvar", "bad");
  }
});

$("#btnLimpar").addEventListener("click", clearForm);
busca.addEventListener("input", render);
filtroAbertura.addEventListener("change", render);

// Boot
(async function start(){
  try {
    await loadTransportadoras();
    await initCargasLive();
  } catch (err) {
    toast(err?.message || "Falha ao carregar dados", "bad");
  }
})();
