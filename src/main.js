console.log("Calculadora Slitter carregada...")

// SELECIONANDO MODO DE ENGATE
// Selecionando o input com nome MODO que está checked, caso exista, retorna o valor, caso não, retorna PADRAO
function getModoSelecionado() { 
    const modoOp = document.querySelector('input[name="modo"]:checked');
    return modoOp ? modoOp.value : "PADRAO";
}

function atualizarEngatesPorModo() {
    const modo = getModoSelecionado(); // Modo recebe o valor selecionado
    const select = document.getElementById("qtdEngates"); // Instanciando o select de engates para usarmos

    if (!select) return; // Se select não existir, finaliza

    if (modo === "DOIS_PROCESSOS") {
        select.value = "2"; // Caso DOIS PROCESSOS, valor passa a ser 2
        select.disabled = true; // E é disabilitado
    } else if (modo === "SALDO") {
        select.value = "1"; // Caso SALDO, valor passa a ser 1
        select.disabled = true; // E é disabilitado
    } else {
        select.disabled = false; // Caso outros segue livre.
    }
}

document.querySelectorAll('input[name="modo"]').forEach((radio) =>{ // Função onde, para cada radio, adiciona um listener que ao mudar, dispara a função
    radio.addEventListener("change", atualizarEngatesPorModo);
}); 

atualizarEngatesPorModo(); // inicializando a função

// PERFIL SEPARADO
const perfilEngate1 = document.getElementById("perfilEngate1"); // Instanciando o checkbox de perfil para usarmos
const larguraPerfil1 = document.getElementById("larguraPerfil1"); // Instanciando o input text de perfil para usarmos

perfilEngate1.addEventListener("change", () => { // Função onde, checkbox de perfil, adiciona um listener que ao mudar, efetua os codigos
    larguraPerfil1.disabled = !perfilEngate1.checked; // Onde input de largura muda de estado conforme o checkbox
    if (!perfilEngate1.checked) larguraPerfil1.value = ""; // Valor começa zerado
});

// TABELA ENGATES
const btnAddRolo1 = document.getElementById("btnAddRolo1"); // Instanciando o botão add rolo para usarmos
const tbody1 = document.querySelector("#tableRolos1 tbody"); // Instanciando a tabela e o corpo para usarmos

function criarLinhaRolo1() { // Função para criar uma linha de rolo
    const tr = document.createElement("tr"); // Usando tr para criar um elemento no html

    // Colocando conteudo no elemento html
    tr.innerHTML = `
        <td>
            <input class="qtd" type="number" min="1" step="1" value="1" />
        </td>
        <td">
            <input class="largura" type="number" min="0" step="0.01" value="0" />
        </td>
        <td">
            <button type="button" class="remover">Remover</button>
        </td>
    `;

    tr.querySelector(".remover").addEventListener("click", () => { // Pegando o botão com a Classe "remover" e add a função de remover ao clicar
        tr.remove();
    });

    return tr;
}

btnAddRolo1.addEventListener("click", () => { // Ao clicar em add rolo ele adiciona o codigo no tbody
  tbody1.appendChild(criarLinhaRolo1());
});

// Começar com 1 linha (para facilitar)
tbody1.appendChild(criarLinhaRolo1());