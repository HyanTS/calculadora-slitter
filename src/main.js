console.log("Calculadora Slitter carregada...");

let totalEngate1ComPerfil = 0;
let totalEngate2ComPerfil = 0;

/* =========================
   MODO (radios) -> força engates
========================= */
function getModoSelecionado() {
  const modoOp = document.querySelector('input[name="modo"]:checked');
  return modoOp ? modoOp.value : "PADRAO";
}

function atualizarEngatesPorModo() {
  const modo = getModoSelecionado();
  const select = document.getElementById("qtdEngates");
  if (!select) return;

  if (modo === "DOIS_PROCESSOS") {
    select.value = "2";
    select.disabled = true;
  } else if (modo === "SALDO") {
    select.value = "1";
    select.disabled = true;
  } else {
    select.disabled = false;
  }
}

document.querySelectorAll('input[name="modo"]').forEach((radio) => {
  radio.addEventListener("change", atualizarEngatesPorModo);
});
atualizarEngatesPorModo();

/* =========================
   PERFIL SEPARADO (Engate 1)
========================= */
const perfilEngate1 = document.getElementById("perfilEngate1");
const larguraPerfil1 = document.getElementById("larguraPerfil1");
const perfilBloco1 = document.getElementById("perfilBloco1");
const kpiPesoPerfilLocal1 = document.getElementById("kpiPesoPerfilLocal1");

if (perfilEngate1 && larguraPerfil1) {
  perfilEngate1.addEventListener("change", () => {
    const ativo = perfilEngate1.checked;

    // 1) mostra/esconde o bloco (largura + resultado)
    if (perfilBloco1) perfilBloco1.style.display = ativo ? "grid" : "none";

    // 2) habilita/desabilita o input
    larguraPerfil1.disabled = !ativo;

    // 3) se desmarcou, limpa tudo
    if (!ativo) {
      larguraPerfil1.value = "";
      if (kpiPesoPerfilLocal1) kpiPesoPerfilLocal1.textContent = "0";
    }

    // 4) recalcula
    calcularEngate1();
  });

  // recalcula quando muda a largura
  larguraPerfil1.addEventListener("input", calcularEngate1);
}

/* =========================
   TABELA (Engate 1)
========================= */
const btnAddRolo1 = document.getElementById("btnAddRolo1");
const tbody1 = document.querySelector("#tableRolos1 tbody");

function criarLinhaRolo1() {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>
      <input class="qtd" type="number" min="1" step="1" value="1" />
    </td>
    <td>
      <input class="largura" type="number" min="0" step="0.01" value="0" />
    </td>
    <td>
      <span class="pesoUnitario">0</span>
    </td>
    <td>
      <span class="totalLinha">0</span>
    </td>
    <td>
      <button type="button" class="remover">Remover</button>
    </td>
  `;

  tr.querySelector(".remover").addEventListener("click", () => {
    tr.remove();
    calcularEngate1();
  });

  tr.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", calcularEngate1);
  });

  return tr;
}

if (btnAddRolo1 && tbody1) {
  btnAddRolo1.addEventListener("click", () => {
    tbody1.appendChild(criarLinhaRolo1());
    calcularEngate1();
  });

  // começa com 1 linha
  tbody1.appendChild(criarLinhaRolo1());
}

/* =========================
   KPIs + ALERTA LARGURA
========================= */
function atualizarKPIs({
  larguraTotal,
  pesoPorMm,
  totalComPerfil,
  pesoPerfil,
}) {
  const elLarg = document.getElementById("kpiLarguraTotal");
  const elPorMm = document.getElementById("kpiPesoPorMm");
  const elTotal = document.getElementById("kpiTotalEngate");
  const elPerfil = document.getElementById("kpiPesoPerfil");
  const elAlerta = document.getElementById("alertaEngate1");

  if (elLarg) elLarg.textContent = larguraTotal.toFixed(2);
  if (elPorMm) elPorMm.textContent = pesoPorMm.toFixed(4);
  if (elTotal) elTotal.textContent = totalComPerfil.toFixed(2);
  if (elPerfil) elPerfil.textContent = pesoPerfil.toFixed(2);
  if (kpiPesoPerfilLocal1) {
    kpiPesoPerfilLocal1.textContent = pesoPerfil.toFixed(2);
  }
  const localPerfil = document.getElementById("kpiPesoPerfilLocal1");
  if (localPerfil) {
    localPerfil.textContent = pesoPerfil.toFixed(2);
  }

  // alerta de largura
  const larguraReal = Number(
    document.getElementById("larguraReal")?.value || 0,
  );

  if (elLarg) elLarg.style.color = "inherit";
  if (elAlerta) {
    elAlerta.textContent = "";
    elAlerta.style.display = "none";
  }

  if (larguraReal > 0 && larguraTotal > larguraReal) {
    if (elLarg) elLarg.style.color = "red";
    if (elAlerta) {
      elAlerta.textContent = `ERRO: Largura total (${larguraTotal.toFixed(
        2,
      )} mm) maior que a largura real (${larguraReal.toFixed(2)} mm).`;
      elAlerta.style.display = "block";
    }
  }
}

function atualizarSucataReal(engateNumero, larguraTotalCortes, larguraPerfil, totalComPerfil) {
  const el = document.getElementById(engateNumero === 1 ? "kpiSucataReal1" : "kpiSucataReal2");
  if (!el) return;

  const larguraReal = Number(document.getElementById("larguraReal")?.value || 0);

  const larguraCortada = Number(larguraTotalCortes || 0) + Number(larguraPerfil || 0);

  // sem base -> zera
  if (larguraReal <= 0 || larguraCortada <= 0 || totalComPerfil <= 0) {
    el.textContent = "0.00";
    return;
  }

  const kgPorMm = totalComPerfil / larguraCortada;
  const larguraSucata = larguraReal - larguraCortada;

  const sucataKg = larguraSucata > 0 ? (larguraSucata * kgPorMm) : 0;
  el.textContent = sucataKg.toFixed(2);
}

/* =========================
   CÁLCULO (Engate 1)
========================= */
function calcularEngate1() {
  try {
    const pesoReal = Number(document.getElementById("pesoEngate1")?.value || 0);
    const linhas = tbody1 ? tbody1.querySelectorAll("tr") : [];

    let larguraTotal = 0;

    linhas.forEach((tr) => {
      const qtd = Number(tr.querySelector(".qtd")?.value || 0);
      const largura = Number(tr.querySelector(".largura")?.value || 0);
      larguraTotal += qtd * largura;
    });

    // sem base de cálculo
    if (pesoReal <= 0 || larguraTotal <= 0) {
      linhas.forEach((tr) => {
        tr.querySelector(".pesoUnitario").textContent = "0";
        tr.querySelector(".totalLinha").textContent = "0";
      });

      totalEngate1ComPerfil = 0;
      atualizarResumoGeral();

      atualizarSucataReal(1, larguraTotal, 0, 0);

      atualizarKPIs({
        larguraTotal,
        pesoPorMm: 0,
        totalComPerfil: 0,
        pesoPerfil: 0,
      });
      return;
    }

    const pesoPorMm = pesoReal / larguraTotal;

    let totalSemPerfil = 0;

    linhas.forEach((tr) => {
      const qtd = Number(tr.querySelector(".qtd")?.value || 0);
      const largura = Number(tr.querySelector(".largura")?.value || 0);

      const pesoUnitario = largura * pesoPorMm;
      const totalLinha = qtd * pesoUnitario;

      totalSemPerfil += totalLinha;

      tr.querySelector(".pesoUnitario").textContent = pesoUnitario.toFixed(2);
      tr.querySelector(".totalLinha").textContent = totalLinha.toFixed(2);
    });

    // perfil (calculado à parte)
    const perfilMarcado = Boolean(
      document.getElementById("perfilEngate1")?.checked,
    );
    const larguraPerfil = Number(
      document.getElementById("larguraPerfil1")?.value || 0,
    );

    let pesoPerfil = 0;
    if (perfilMarcado && larguraPerfil > 0) {
      pesoPerfil = larguraPerfil * pesoPorMm;
    }

    const totalComPerfil = totalSemPerfil + pesoPerfil;

    
    totalEngate1ComPerfil = totalComPerfil;
    atualizarResumoGeral();

    const larguraPerfilCalc1 = perfilMarcado ? larguraPerfil : 0;
    atualizarSucataReal(1, larguraTotal, larguraPerfilCalc1, totalComPerfil);

    atualizarKPIs({ larguraTotal, pesoPorMm, totalComPerfil, pesoPerfil });
  } catch (err) {
    console.error("Erro em calcularEngate1:", err);
  }
}

// recalcular quando muda peso real ou largura real
document
  .getElementById("pesoEngate1")
  ?.addEventListener("input", calcularEngate1);
document
  .getElementById("larguraReal")
  ?.addEventListener("input", calcularEngate1);

// primeira execução
calcularEngate1();

function atualizarVisibilidadeEngate2() {
  const qtdEngates = document.getElementById("qtdEngates")?.value || "1";
  const section2 = document.getElementById("engate2Section");
  if (!section2) return;

  if (qtdEngates === "2") {
    section2.style.display = "block";
  } else {
    section2.style.display = "none";

    totalEngate2ComPerfil = 0;
    atualizarResumoGeral();
  }

  // botão duplicar só quando 2 engates E modo não é 2 processos
  const modo = getModoSelecionado();
  const btnDup = document.getElementById("btnDuplicarRolos");
  if (btnDup) {
    btnDup.style.display =
      qtdEngates === "2" && modo !== "DOIS_PROCESSOS" ? "inline-block" : "none";
  }

  const aviso = document.getElementById("avisoDoisProcessos");
  if (aviso) {
    aviso.style.display =
      getModoSelecionado() === "DOIS_PROCESSOS" ? "block" : "none";
  }
}

document
  .getElementById("qtdEngates")
  ?.addEventListener("change", atualizarVisibilidadeEngate2);
document.querySelectorAll('input[name="modo"]').forEach((radio) => {
  radio.addEventListener("change", atualizarVisibilidadeEngate2);
});

atualizarVisibilidadeEngate2();

const perfilEngate2 = document.getElementById("perfilEngate2");
const larguraPerfil2 = document.getElementById("larguraPerfil2");
const perfilBloco2 = document.getElementById("perfilBloco2");
const kpiPesoPerfilLocal2 = document.getElementById("kpiPesoPerfilLocal2");

if (perfilEngate2 && larguraPerfil2) {
  perfilEngate2.addEventListener("change", () => {
    const ativo = perfilEngate2.checked;

    // 1) mostra/esconde o bloco (largura + resultado)
    if (perfilBloco2) perfilBloco2.style.display = ativo ? "grid" : "none";

    // 2) habilita/desabilita o input
    larguraPerfil2.disabled = !ativo;

    // 3) se desmarcou, limpa tudo
    if (!ativo) {
      larguraPerfil2.value = "";
      if (kpiPesoPerfilLocal2) kpiPesoPerfilLocal2.textContent = "0";
    }

    // 4) recalcula
    calcularEngate2();
  });

  // recalcula quando muda a largura
  larguraPerfil2.addEventListener("input", calcularEngate2);
}

const btnAddRolo2 = document.getElementById("btnAddRolo2");
const tbody2 = document.querySelector("#tableRolos2 tbody");

function criarLinhaRolo2(qtd = 1, largura = 0) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input class="qtd" type="number" min="1" step="1" value="${qtd}" /></td>
    <td><input class="largura" type="number" min="0" step="0.01" value="${largura}" /></td>
    <td><span class="pesoUnitario">0</span></td>
    <td><span class="totalLinha">0</span></td>
    <td><button type="button" class="remover">Remover</button></td>
  `;

  tr.querySelector(".remover").addEventListener("click", () => {
    tr.remove();
    calcularEngate2();
  });

  tr.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", calcularEngate2);
  });

  return tr;
}

if (btnAddRolo2 && tbody2) {
  btnAddRolo2.addEventListener("click", () => {
    tbody2.appendChild(criarLinhaRolo2());
    calcularEngate2();
  });

  // começa com 1 linha
  if (tbody2.children.length === 0) {
    tbody2.appendChild(criarLinhaRolo2());
  }
}

function atualizarKPIs2({
  larguraTotal,
  pesoPorMm,
  totalComPerfil,
  pesoPerfil,
}) {
  document.getElementById("kpiLarguraTotal2").textContent =
    larguraTotal.toFixed(2);
  document.getElementById("kpiPesoPorMm2").textContent = pesoPorMm.toFixed(4);
  document.getElementById("kpiTotalEngate2").textContent =
    totalComPerfil.toFixed(2);
  document.getElementById("kpiPesoPerfil2").textContent = pesoPerfil.toFixed(2);

  if (kpiPesoPerfilLocal2) {
  kpiPesoPerfilLocal2.textContent = pesoPerfil.toFixed(2);
}

  const larguraReal = Number(
    document.getElementById("larguraReal")?.value || 0,
  );
  const elKpiLargura = document.getElementById("kpiLarguraTotal2");
  const elAlerta = document.getElementById("alertaEngate2");

  if (elKpiLargura) elKpiLargura.style.color = "inherit";
  if (elAlerta) {
    elAlerta.textContent = "";
    elAlerta.style.display = "none";
  }

  if (larguraReal > 0 && larguraTotal > larguraReal) {
    if (elKpiLargura) elKpiLargura.style.color = "red";
    if (elAlerta) {
      elAlerta.textContent = `ERRO: Largura total (${larguraTotal.toFixed(2)} mm) maior que a largura real (${larguraReal.toFixed(2)} mm).`;
      elAlerta.style.display = "block"; //
    }
  }
}

function calcularEngate2() {
  // se engate 2 estiver oculto, não precisa ficar calculando
  const section2 = document.getElementById("engate2Section");
  if (section2 && section2.style.display === "none") return;

  const pesoReal = Number(document.getElementById("pesoEngate2")?.value || 0);
  const linhas = tbody2 ? tbody2.querySelectorAll("tr") : [];

  let larguraTotal = 0;

  linhas.forEach((tr) => {
    const qtd = Number(tr.querySelector(".qtd")?.value || 0);
    const largura = Number(tr.querySelector(".largura")?.value || 0);
    larguraTotal += qtd * largura;
  });

  if (pesoReal <= 0 || larguraTotal <= 0) {
    linhas.forEach((tr) => {
      tr.querySelector(".pesoUnitario").textContent = "0";
      tr.querySelector(".totalLinha").textContent = "0";
    });

    totalEngate2ComPerfil = 0;
    atualizarResumoGeral();

    atualizarSucataReal(2, larguraTotal, 0, 0);

    atualizarKPIs2({
      larguraTotal,
      pesoPorMm: 0,
      totalComPerfil: 0,
      pesoPerfil: 0,
    });
    return;
  }

  const pesoPorMm = pesoReal / larguraTotal;

  let totalSemPerfil = 0;
  linhas.forEach((tr) => {
    const qtd = Number(tr.querySelector(".qtd")?.value || 0);
    const largura = Number(tr.querySelector(".largura")?.value || 0);

    const pesoUnitario = largura * pesoPorMm;
    const totalLinha = qtd * pesoUnitario;
    totalSemPerfil += totalLinha;

    tr.querySelector(".pesoUnitario").textContent = pesoUnitario.toFixed(2);
    tr.querySelector(".totalLinha").textContent = totalLinha.toFixed(2);
  });

  const perfilMarcado = Boolean(
    document.getElementById("perfilEngate2")?.checked,
  );
  const larguraPerfil = Number(
    document.getElementById("larguraPerfil2")?.value || 0,
  );

  let pesoPerfil = 0;
  if (perfilMarcado && larguraPerfil > 0) {
    pesoPerfil = larguraPerfil * pesoPorMm;
  }

  const totalComPerfil = totalSemPerfil + pesoPerfil;

  totalEngate2ComPerfil = totalComPerfil;
  atualizarResumoGeral();

  const larguraPerfilCalc2 = perfilMarcado ? larguraPerfil : 0;
    atualizarSucataReal(2, larguraTotal, larguraPerfilCalc2, totalComPerfil);

  atualizarKPIs2({ larguraTotal, pesoPorMm, totalComPerfil, pesoPerfil });
}

document
  .getElementById("pesoEngate2")
  ?.addEventListener("input", calcularEngate2);
document
  .getElementById("larguraReal")
  ?.addEventListener("input", calcularEngate2);

const btnDuplicarRolos = document.getElementById("btnDuplicarRolos");

function duplicarRolosEngate1ParaEngate2() {
  if (getModoSelecionado() === "DOIS_PROCESSOS") return;
  if (!tbody1 || !tbody2) return;

  // limpa engate 2
  tbody2.innerHTML = "";

  // copia linhas do engate 1
  const linhas1 = tbody1.querySelectorAll("tr");
  linhas1.forEach((tr) => {
    const qtd = Number(tr.querySelector(".qtd")?.value || 1);
    const largura = Number(tr.querySelector(".largura")?.value || 0);
    tbody2.appendChild(criarLinhaRolo2(qtd, largura));
  });

  calcularEngate2();
}

btnDuplicarRolos?.addEventListener("click", duplicarRolosEngate1ParaEngate2);

function atualizarResumoGeral() {
  const qtdEngates = document.getElementById("qtdEngates")?.value || "1";

  // mostrar/ocultar linha do engate 2
  const card2 = document.getElementById("cardResumoEngate2");
  if (card2) card2.style.display = qtdEngates === "2" ? "block" : "none";

  // atualizar valores
  document.getElementById("resumoEngate1").textContent =
    totalEngate1ComPerfil.toFixed(2);
  document.getElementById("resumoEngate2").textContent =
    totalEngate2ComPerfil.toFixed(2);

  const totalBobina =
    qtdEngates === "2"
      ? totalEngate1ComPerfil + totalEngate2ComPerfil
      : totalEngate1ComPerfil;

  document.getElementById("resumoTotalBobina").textContent =
    totalBobina.toFixed(2);

  // status simples baseado no alerta de largura:
  // se qualquer engate estourar largura real, status vira ERRO
  const larguraReal = Number(
    document.getElementById("larguraReal")?.value || 0,
  );
  const larguraTotal1 = Number(
    document.getElementById("kpiLarguraTotal")?.textContent.replace(",", ".") ||
      0,
  );
  const larguraTotal2 = Number(
    document
      .getElementById("kpiLarguraTotal2")
      ?.textContent.replace(",", ".") || 0,
  );

  const erroLargura1 = larguraReal > 0 && larguraTotal1 > larguraReal;
  const erroLargura2 =
    qtdEngates === "2" && larguraReal > 0 && larguraTotal2 > larguraReal;

  const status = document.getElementById("statusGeral");
  if (!status) return;

  if (erroLargura1 || erroLargura2) {
    status.textContent = "ERRO: largura total maior que a largura real.";
    status.style.display = "block";
    status.classList.add("erro");
  } else {
    status.textContent = "OK: dentro da largura real.";
    status.style.display = "block";
    status.classList.remove("erro");
  }
}

document
  .getElementById("qtdEngates")
  .addEventListener("change", atualizarResumoGeral);

  function atualizarBadgeModo() {
  const badge = document.getElementById("badgeModo");
  if (!badge) return;

  const modo = getModoSelecionado();
  const mapa = {
    PADRAO: "Corte Padrão",
    PERFIL: "Rolo p/ Perfil",
    DOIS_PROCESSOS: "2 Processos",
    SALDO: "Volta p/ Saldo",
  };

  badge.textContent = mapa[modo] || "Corte Padrão";
}

document.querySelectorAll('input[name="modo"]').forEach((radio) => {
  radio.addEventListener("change", atualizarBadgeModo);
});

atualizarBadgeModo();

function limparTabela(tbody, criarLinhaFn, calcularFn) {
  if (!tbody) return;
  tbody.innerHTML = "";
  tbody.appendChild(criarLinhaFn());
  calcularFn();
}

function limparEngate1() {
  // peso
  const peso = document.getElementById("pesoEngate1");
  if (peso) peso.value = "";

  // perfil (usa seu listener para esconder bloco e limpar input)
  if (perfilEngate1) {
    perfilEngate1.checked = false;
    perfilEngate1.dispatchEvent(new Event("change"));
  }

  // tabela (volta para 1 linha)
  limparTabela(tbody1, criarLinhaRolo1, calcularEngate1);

  // estado do resumo
  totalEngate1ComPerfil = 0;
  atualizarResumoGeral();

  // sucata
  atualizarSucataReal(1, 0, 0, 0);
}

function limparEngate2() {
  // peso
  const peso = document.getElementById("pesoEngate2");
  if (peso) peso.value = "";

  // perfil
  if (perfilEngate2) {
    perfilEngate2.checked = false;
    perfilEngate2.dispatchEvent(new Event("change"));
  }

  // tabela (volta para 1 linha)
  limparTabela(tbody2, () => criarLinhaRolo2(1, 0), calcularEngate2);

  // estado do resumo
  totalEngate2ComPerfil = 0;
  atualizarResumoGeral();

  // sucata
  atualizarSucataReal(2, 0, 0, 0);
}

// listeners
document.getElementById("btnLimparEngate1")?.addEventListener("click", limparEngate1);
document.getElementById("btnLimparEngate2")?.addEventListener("click", limparEngate2);