console.log("Calculadora Slitter carregada...");

let totalEngate1ComPerfil = 0;
let totalEngate2ComPerfil = 0;
let totalEngate3ComPerfil = 0;

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
      <input class="qtd" type="number" min="1" value="1" />
    </td>
    <td>
      <input class="largura" type="number" min="0" value="0" />
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
  const mapaIds = {
    1: "kpiSucataReal1",
    2: "kpiSucataReal2",
    3: "kpiSucataReal3",
  };

  const el = document.getElementById(mapaIds[engateNumero]);
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

function atualizarVisibilidadeEngates() {
  const qtdEngates = document.getElementById("qtdEngates")?.value || "1";

  const section2 = document.getElementById("engate2Section");
  const section3 = document.getElementById("engate3Section");

  const btnDup2 = document.getElementById("btnDuplicarRolos");
  const btnDup3 = document.getElementById("btnDuplicarRolos3");

  if (section2) {
    if (qtdEngates === "2" || qtdEngates === "3") {
      section2.style.display = "flex";
      if (btnDup2) btnDup2.style.display = "inline-block";
    } else {
      section2.style.display = "none";
      totalEngate2ComPerfil = 0;
      if (btnDup2) btnDup2.style.display = "none";
    }
  }

  if (section3) {
    if (qtdEngates === "3") {
      section3.style.display = "flex";
      if (btnDup3) btnDup3.style.display = "inline-block";
    } else {
      section3.style.display = "none";
      totalEngate3ComPerfil = 0;
      if (btnDup3) btnDup3.style.display = "none";
    }
  }

  atualizarResumoGeral();
}

document.getElementById("qtdEngates")
  ?.addEventListener("change", () => {

    atualizarVisibilidadeEngates();
    atualizarLayoutEngates();
    atualizarResumoGeral();

    // rolar tela para os engates
    setTimeout(irParaEngates, 150);
  });

atualizarVisibilidadeEngates();

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
    <td><input class="qtd" type="number" min="1" value="${qtd}" /></td>
    <td><input class="largura" type="number" min="0" value="${largura}" /></td>
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
  const elPerfil2 = document.getElementById("kpiPesoPerfil2");
  if (elPerfil2) elPerfil2.textContent = pesoPerfil.toFixed(2);

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
const btnDuplicarRolos3 = document.getElementById("btnDuplicarRolos3");

function duplicarRolosEngate1ParaEngate2() {
  if (!tbody1 || !tbody2) return;

  tbody2.innerHTML = "";

  const linhas1 = tbody1.querySelectorAll("tr");
  linhas1.forEach((tr) => {
    const qtd = Number(tr.querySelector(".qtd")?.value || 1);
    const largura = Number(tr.querySelector(".largura")?.value || 0);
    tbody2.appendChild(criarLinhaRolo2(qtd, largura));
  });

  calcularEngate2();
}

function duplicarRolosEngate1ParaEngate3() {
  if (!tbody1 || !tbody3) return;

  // limpa engate 3
  tbody3.innerHTML = "";

  // copia linhas do engate 1
  const linhas1 = tbody1.querySelectorAll("tr");
  linhas1.forEach((tr) => {
    const qtd = Number(tr.querySelector(".qtd")?.value || 1);
    const largura = Number(tr.querySelector(".largura")?.value || 0);
    tbody3.appendChild(criarLinhaRolo3(qtd, largura));
  });

  calcularEngate3();
}

btnDuplicarRolos?.addEventListener("click", duplicarRolosEngate1ParaEngate2);
btnDuplicarRolos3?.addEventListener("click", duplicarRolosEngate1ParaEngate3);

function atualizarResumoGeral() {
  return;
}

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

function atualizarLayoutEngates() {
  const qtdEngates = document.getElementById("qtdEngates")?.value || "1";
  const container = document.getElementById("engatesContainer");
  if (!container) return;

  container.classList.remove("layout-1", "layout-2", "layout-3");

  if (qtdEngates === "1") {
    container.classList.add("layout-1");
  } else if (qtdEngates === "2") {
    container.classList.add("layout-2");
  } else if (qtdEngates === "3") {
    container.classList.add("layout-3");
  }
}

atualizarLayoutEngates();

const perfilEngate3 = document.getElementById("perfilEngate3");
const larguraPerfil3 = document.getElementById("larguraPerfil3");
const perfilBloco3 = document.getElementById("perfilBloco3");
const kpiPesoPerfilLocal3 = document.getElementById("kpiPesoPerfilLocal3");

if (perfilEngate3 && larguraPerfil3) {
  perfilEngate3.addEventListener("change", () => {
    const ativo = perfilEngate3.checked;

    if (perfilBloco3) perfilBloco3.style.display = ativo ? "grid" : "none";

    larguraPerfil3.disabled = !ativo;

    if (!ativo) {
      larguraPerfil3.value = "";
      if (kpiPesoPerfilLocal3) kpiPesoPerfilLocal3.textContent = "0";
    }

    calcularEngate3();
  });

  larguraPerfil3.addEventListener("input", calcularEngate3);
}

const btnAddRolo3 = document.getElementById("btnAddRolo3");
const tbody3 = document.querySelector("#tableRolos3 tbody");

function criarLinhaRolo3(qtd = 1, largura = 0) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input class="qtd" type="number" min="1" value="${qtd}" /></td>
    <td><input class="largura" type="number" min="0" value="${largura}" /></td>
    <td><span class="pesoUnitario">0</span></td>
    <td><span class="totalLinha">0</span></td>
    <td><button type="button" class="remover">Remover</button></td>
  `;

  tr.querySelector(".remover").addEventListener("click", () => {
    tr.remove();
    calcularEngate3();
  });

  tr.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", calcularEngate3);
  });

  return tr;
}

if (btnAddRolo3 && tbody3) {
  btnAddRolo3.addEventListener("click", () => {
    tbody3.appendChild(criarLinhaRolo3());
    calcularEngate3();
  });

  if (tbody3.children.length === 0) {
    tbody3.appendChild(criarLinhaRolo3());
  }
}

function atualizarKPIs3({
  larguraTotal,
  pesoPorMm,
  totalComPerfil,
  pesoPerfil,
}) {
  document.getElementById("kpiLarguraTotal3").textContent = larguraTotal.toFixed(2);
  document.getElementById("kpiPesoPorMm3").textContent = pesoPorMm.toFixed(4);
  document.getElementById("kpiTotalEngate3").textContent = totalComPerfil.toFixed(2);

  if (kpiPesoPerfilLocal3) {
    kpiPesoPerfilLocal3.textContent = pesoPerfil.toFixed(2);
  }

  const larguraReal = Number(document.getElementById("larguraReal")?.value || 0);
  const elKpiLargura = document.getElementById("kpiLarguraTotal3");
  const elAlerta = document.getElementById("alertaEngate3");

  if (elKpiLargura) elKpiLargura.style.color = "inherit";

  if (elAlerta) {
    elAlerta.textContent = "";
    elAlerta.style.display = "none";
  }

  if (larguraReal > 0 && larguraTotal > larguraReal) {
    if (elKpiLargura) elKpiLargura.style.color = "red";

    if (elAlerta) {
      elAlerta.textContent = "ERRO: Largura total maior que a largura real.";
      elAlerta.style.display = "block";
    }
  }
}

function calcularEngate3() {
  const section3 = document.getElementById("engate3Section");
  if (section3 && section3.style.display === "none") return;

  const pesoReal = Number(document.getElementById("pesoEngate3")?.value || 0);
  const linhas = tbody3 ? tbody3.querySelectorAll("tr") : [];

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

    totalEngate3ComPerfil = 0;
    atualizarResumoGeral();
    atualizarSucataReal(3, larguraTotal, 0, 0);

    atualizarKPIs3({
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

  const perfilMarcado = Boolean(document.getElementById("perfilEngate3")?.checked);
  const larguraPerfil = Number(document.getElementById("larguraPerfil3")?.value || 0);

  let pesoPerfil = 0;
  if (perfilMarcado && larguraPerfil > 0) {
    pesoPerfil = larguraPerfil * pesoPorMm;
  }

  const totalComPerfil = totalSemPerfil + pesoPerfil;

  totalEngate3ComPerfil = totalComPerfil;
  atualizarResumoGeral();

  const larguraPerfilCalc3 = perfilMarcado ? larguraPerfil : 0;
  atualizarSucataReal(3, larguraTotal, larguraPerfilCalc3, totalComPerfil);

  atualizarKPIs3({ larguraTotal, pesoPorMm, totalComPerfil, pesoPerfil });
}

document.getElementById("pesoEngate3")?.addEventListener("input", calcularEngate3);
document.getElementById("larguraReal")?.addEventListener("input", calcularEngate3);

function limparEngate3() {
  const peso = document.getElementById("pesoEngate3");
  if (peso) peso.value = "";

  if (perfilEngate3) {
    perfilEngate3.checked = false;
    perfilEngate3.dispatchEvent(new Event("change"));
  }

  limparTabela(tbody3, () => criarLinhaRolo3(1, 0), calcularEngate3);

  totalEngate3ComPerfil = 0;
  atualizarResumoGeral();
  atualizarSucataReal(3, 0, 0, 0);
}

document.getElementById("btnLimparEngate3")?.addEventListener("click", limparEngate3);

function limparTudo() {
  limparEngate1();
  limparEngate2();
  limparEngate3();

  const cliente = document.getElementById("cliente");
  const etiqueta = document.getElementById("etiqueta");
  const larguraReal = document.getElementById("larguraReal");
  const qtdEngates = document.getElementById("qtdEngates");

  if (cliente) cliente.value = "";
  if (etiqueta) etiqueta.value = "";
  if (larguraReal) larguraReal.value = "";
  if (qtdEngates) qtdEngates.value = "1";

  atualizarVisibilidadeEngates();
  atualizarLayoutEngates();
}

function irParaEngates() {
  const secao = document.getElementById("engatesContainer");
  if (!secao) return;

  secao.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

document.getElementById("btnLimparTudo")?.addEventListener("click", limparTudo);

function abrirPainelFinalizacao() {
  const painel = document.getElementById("painelFinalizacao");
  if (!painel) return;

  // infos básicas
  const cliente = document.getElementById("cliente")?.value || "-";
  const etiqueta = document.getElementById("etiqueta")?.value || "-";
  const larguraReal = document.getElementById("larguraReal")?.value || "-";
  const qtdEngates = document.getElementById("qtdEngates")?.value || "-";

  atualizarLayoutPainelFinal(qtdEngates);
  atualizarVisibilidadePainelFinal(qtdEngates);

  document.getElementById("finalCliente").textContent = cliente;
  document.getElementById("finalEtiqueta").textContent = etiqueta;
  document.getElementById("finalLarguraReal").textContent = larguraReal;
  document.getElementById("finalQtdEngates").textContent = qtdEngates;

  // rolos por engate
  const rolos1 = extrairRolosDoEngate("#tableRolos1 tbody");
  const rolos2 = extrairRolosDoEngate("#tableRolos2 tbody");
  const rolos3 = extrairRolosDoEngate("#tableRolos3 tbody");

  renderizarListaFinal("listaFinalEngate1", rolos1);
  renderizarListaFinal("listaFinalEngate2", qtdEngates === "2" || qtdEngates === "3" ? rolos2 : []);
  renderizarListaFinal("listaFinalEngate3", qtdEngates === "3" ? rolos3 : []);

  // perfis
  const perfil1Ativo = Boolean(document.getElementById("perfilEngate1")?.checked);
  const larguraPerfil1 = Number(document.getElementById("larguraPerfil1")?.value || 0);
  const pesoPerfil1 = Number(document.getElementById("kpiPesoPerfilLocal1")?.textContent || 0);

  const perfil2Ativo = Boolean(document.getElementById("perfilEngate2")?.checked);
  const larguraPerfil2 = Number(document.getElementById("larguraPerfil2")?.value || 0);
  const pesoPerfil2 = Number(document.getElementById("kpiPesoPerfilLocal2")?.textContent || 0);

  const perfil3Ativo = Boolean(document.getElementById("perfilEngate3")?.checked);
  const larguraPerfil3 = Number(document.getElementById("larguraPerfil3")?.value || 0);
  const pesoPerfil3 = Number(document.getElementById("kpiPesoPerfilLocal3")?.textContent || 0);

  renderizarPerfilFinal("listaPerfilEngate1", perfil1Ativo, larguraPerfil1, pesoPerfil1);
  renderizarPerfilFinal("listaPerfilEngate2", perfil2Ativo, larguraPerfil2, pesoPerfil2);
  renderizarPerfilFinal("listaPerfilEngate3", perfil3Ativo, larguraPerfil3, pesoPerfil3);

  painel.style.display = "flex";
  painel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function fecharPainelFinalizacao() {
  const painel = document.getElementById("painelFinalizacao");
  if (!painel) return;
  painel.style.display = "none";
}

document.getElementById("btnFinalizarCalculo")?.addEventListener("click", abrirPainelFinalizacao);
document.getElementById("btnFecharFinalizacao")?.addEventListener("click", fecharPainelFinalizacao);

function extrairRolosDoEngate(tbodySelector) {
  const tbody = document.querySelector(tbodySelector);
  if (!tbody) return [];

  const linhas = tbody.querySelectorAll("tr");
  const rolos = [];

  linhas.forEach((tr) => {
    const qtd = Number(tr.querySelector(".qtd")?.value || 0);
    const largura = Number(tr.querySelector(".largura")?.value || 0);
    const pesoUnitario = Number(tr.querySelector(".pesoUnitario")?.textContent || 0);

    for (let i = 0; i < qtd; i++) {
      rolos.push({
        largura,
        peso: pesoUnitario,
      });
    }
  });

  return rolos;
}

function renderizarListaFinal(containerId, rolos) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!rolos.length) {
    container.innerHTML = `<p class="muted">Nenhum rolo neste engate.</p>`;
    return;
  }

  container.innerHTML = `
    <p class="muted" style="margin-bottom:8px;">
      Total de rolos: <strong>${rolos.length}</strong>
    </p>

    <div class="lista-rolos-final">
      ${rolos.map((rolo, index) => `
        <div class="item-rolo-final">
          <div class="rolo-indice">#${index + 1}</div>

          <div class="campo-id">
            <label>Identificação</label>
            <input type="text" placeholder="001">
          </div>

          <div class="campo-info">
            <label>Largura (mm)</label>
            <div class="valor-fixo">${rolo.largura.toFixed(2)}</div>
          </div>

          <div class="campo-info">
            <label>Peso (kg)</label>
            <div class="valor-fixo">${rolo.peso.toFixed(2)}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderizarPerfilFinal(containerId, perfilAtivo, larguraPerfil, pesoPerfil) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!perfilAtivo || larguraPerfil <= 0 || pesoPerfil <= 0) {
    container.innerHTML = `<p class="muted">Sem perfil separado.</p>`;
    return;
  }

  container.innerHTML = `
    <p class="muted" style="margin-bottom:8px;">
      Perfil separado para cadastro
    </p>

    <div class="perfil-final">
      <div class="item-perfil-final">
        <div class="campo-id">
          <label>Identificação</label>
          <input type="text" value="UDC" readonly>
        </div>

        <div class="campo-info">
          <label>Largura (mm)</label>
          <div class="valor-fixo">${larguraPerfil.toFixed(2)}</div>
        </div>

        <div class="campo-info">
          <label>Peso (kg)</label>
          <div class="valor-fixo">${pesoPerfil.toFixed(2)}</div>
        </div>
      </div>
    </div>
  `;
}

function atualizarVisibilidadePainelFinal(qtdEngates) {
  const col1 = document.getElementById("colunaFinalEngate1");
  const col2 = document.getElementById("colunaFinalEngate2");
  const col3 = document.getElementById("colunaFinalEngate3");

  if (col1) col1.style.display = "flex";

  if (col2) {
    col2.style.display =
      qtdEngates === "2" || qtdEngates === "3" ? "flex" : "none";
  }

  if (col3) {
    col3.style.display =
      qtdEngates === "3" ? "flex" : "none";
  }
}

function atualizarLayoutPainelFinal(qtdEngates) {
  const grid = document.querySelector(".finalizacao-grid");
  if (!grid) return;

  grid.classList.remove("layout-final-1", "layout-final-2", "layout-final-3");

  if (qtdEngates === "1") {
    grid.classList.add("layout-final-1");
  } else if (qtdEngates === "2") {
    grid.classList.add("layout-final-2");
  } else if (qtdEngates === "3") {
    grid.classList.add("layout-final-3");
  }
}