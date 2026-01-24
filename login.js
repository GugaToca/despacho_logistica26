//login.js
import { login, register } from "./auth.js";
import { toast } from "./ui.js";

const $ = (s) => document.querySelector(s);

const tabLogin = $("#tabLogin");
const tabCadastro = $("#tabCadastro");
const formLogin = $("#formLogin");
const formCadastro = $("#formCadastro");

function setTab(which) {
  const isLogin = which === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabCadastro.classList.toggle("active", !isLogin);
  formLogin.hidden = !isLogin;
  formCadastro.hidden = isLogin;
}

tabLogin.addEventListener("click", () => setTab("login"));
tabCadastro.addEventListener("click", () => setTab("cad"));

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await login($("#loginEmail").value.trim(), $("#loginSenha").value);
    window.location.href = "app.html";
  } catch (err) {
    toast(err?.message || "Falha no login", "bad");
  }
});

formCadastro.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await register(
      $("#cadNome").value.trim(),
      $("#cadEmail").value.trim(),
      $("#cadSenha").value
    );
    toast("Conta criada! Indo para o sistema…", "ok");
    window.location.href = "app.html";
  } catch (err) {
    toast(err?.message || "Falha ao criar conta", "bad");
  }
});
