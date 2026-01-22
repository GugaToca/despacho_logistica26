// js/transportadoras.js
import { db, auth } from "./firebase.js";
import { toast } from "./ui.js";

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const $ = (s) => document.querySelector(s);

const form = $("#formT");
const tbody = $("#tbodyT");
const busca = $("#buscaT");

let cache = [];

function escapeHtml(str=""){
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function render(){
  const term = (busca.value||"").trim().toLowerCase();
  let list = [...cache];

  if (term) {
    list = list.filter(t => {
      const hay = `${t.codigo} ${t.nome} ${t.createdByName}`.toLowerCase();
      return hay.includes(term);
    });
  }

  if (!list.length){
    tbody.innerHTML = `<tr><td colspan="5" class="mini">Nenhuma transportadora.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(t => `
    <tr class="tr">
      <td><strong>${Number(t.codigo)}</strong></td>
      <td>${escapeHtml(t.nome)}</td>
      <td>${t.ativo ? `<span class="badge"><span class="dot dot--ok"></span>Sim</span>`
                    : `<span class="badge"><span class="dot dot--bad"></span>Não</span>`}</td>
      <td>${escapeHtml(t.createdByName || "—")}</td>
      <td>
        <div class="toolbar">
          <button class="btn" data-action="edit" data-id="${t.id}">Editar</button>
          <button class="btn ${t.ativo ? "btn--bad" : "btn--ok"}" data-action="toggle" data-id="${t.id}">
            ${t.ativo ? "Desativar" : "Ativar"}
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

function fillForm(t){
  $("#codigo").value = t.codigo ?? "";
  $("#nome").value = t.nome ?? "";
  $("#ativo").value = String(!!t.ativo);
  form.dataset.editing = t.id;
  $("#btnSalvarT").textContent = "Salvar alterações";
}

function clearForm(){
  form.reset();
  $("#ativo").value = "true";
  form.dataset.editing = "";
  $("#btnSalvarT").textContent = "Salvar";
}

tbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  const found = cache.find(t => t.id === id);
  if (!found) return;

  if (action === "edit") fillForm(found);

  if (action === "toggle") {
    await updateDoc(doc(db, "transportadoras", id), {
      ativo: !found.ativo,
      updatedAt: serverTimestamp(),
    });
    toast(!found.ativo ? "Transportadora ativada." : "Transportadora desativada.", "info");
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return toast("Faça login.", "bad");

  const payload = {
    codigo: Number($("#codigo").value),
    nome: ($("#nome").value || "").trim(),
    ativo: $("#ativo").value === "true",
    updatedAt: serverTimestamp(),
  };

  try{
    const editingId = form.dataset.editing || "";
    if (editingId){
      await updateDoc(doc(db, "transportadoras", editingId), payload);
      toast("Atualizado.", "ok");
      clearForm();
    } else {
      await addDoc(collection(db, "transportadoras"), {
        ...payload,
        createdAt: serverTimestamp(),
        createdByUid: user.uid,
        createdByName: user.displayName || user.email || "Usuário",
      });
      toast("Cadastrado.", "ok");
      clearForm();
    }
  }catch(err){
    toast(err?.message || "Erro ao salvar", "bad");
  }
});

$("#btnLimparT").addEventListener("click", clearForm);
busca.addEventListener("input", render);

// Live
const qy = query(collection(db, "transportadoras"), orderBy("codigo", "asc"));
onSnapshot(qy, (snap) => {
  cache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render();
});
