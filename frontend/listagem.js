const URL_API = "http://localhost:8080/usuarios";
let listaUsuariosGlobal = [];

document.addEventListener("DOMContentLoaded", () => {
    carregarUsuarios();

    const inputBusca = document.getElementById("pesquisa");
    const btnBuscar = document.getElementById("btnBuscar");

    if (btnBuscar && inputBusca) {
        btnBuscar.addEventListener("click", () => filtrarUsuarios(inputBusca.value));
    }

    if (inputBusca) {
        inputBusca.addEventListener("input", (e) => filtrarUsuarios(e.target.value));
        inputBusca.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                filtrarUsuarios(inputBusca.value);
            }
        });
    }
});

async function carregarUsuarios() {
    const tabelaCorpo = document.getElementById("tabelaUsuarios") || document.querySelector("tbody");
    if (!tabelaCorpo) return;

    tabelaCorpo.innerHTML = "<tr><td colspan='4' style='text-align: center;'>Carregando dados do servidor...</td></tr>";

    try {
        const resposta = await fetch(URL_API);
        if (!resposta.ok) throw new Error("Erro na requisição");

        listaUsuariosGlobal = await resposta.json();
        renderizarTabela(listaUsuariosGlobal);
    } catch (error) {
        console.error("Erro ao carregar lista:", error);
        tabelaCorpo.innerHTML = "<tr><td colspan='4' style='text-align: center; color: red;'>Erro ao carregar usuários. O Servidor.java está rodando no VS Code?</td></tr>";
    }
}

function renderizarTabela(lista) {
    const tabelaCorpo = document.getElementById("tabelaUsuarios") || document.querySelector("tbody");
    const contador = document.getElementById("contadorUsuarios");
    if (!tabelaCorpo) return;

    if (contador) {
        contador.textContent = `Total listado: ${lista ? lista.length : 0} usuário(s)`;
    }

    tabelaCorpo.innerHTML = "";

    if (!lista || lista.length === 0) {
        tabelaCorpo.innerHTML = "<tr><td colspan='4' style='text-align: center; color: #666; padding: 15px;'>Nenhum cadastro encontrado.</td></tr>";
        return;
    }

    lista.forEach(user => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-id">${user.id}</td>
            <td class="col-nome">${user.nome}</td>
            <td class="col-cpf">${user.cpf}</td>
            <td class="col-acoes">
                <button type="button" class="btn-acao btn-editar" onclick="editarUsuario(${user.id})">Editar</button>
                <button type="button" class="btn-acao btn-excluir" onclick="excluirUsuario(${user.id})">Excluir</button>
            </td>
        `;
        tabelaCorpo.appendChild(tr);
    });
}

function filtrarUsuarios(termo) {
    const busca = (termo || "").trim().toLowerCase();
    const buscaNumeros = busca.replace(/\D/g, "");

    const filtrados = listaUsuariosGlobal.filter(user => {
        const id = String(user.id || "");
        const nome = (user.nome || "").toLowerCase();
        const cpf = (user.cpf || "").toLowerCase();
        const cpfNumeros = cpf.replace(/\D/g, "");

        return id === busca || nome.includes(busca) || cpf.includes(busca) || (buscaNumeros.length > 0 && cpfNumeros.includes(buscaNumeros));
    });

    renderizarTabela(filtrados);
}

function editarUsuario(id) {
    window.location.href = `cadastro.html?id=${id}`;
}

async function excluirUsuario(id) {
    if (!confirm(`Tem certeza que deseja excluir o usuário #${id}?`)) {
        return;
    }

    try {
        const resposta = await fetch(`${URL_API}/${id}`, { method: "DELETE" });
        if (resposta.ok) {
            alert("Usuário excluído com sucesso do banco de dados!");
            carregarUsuarios();
        } else {
            const erro = await resposta.json().catch(() => ({}));
            alert("Erro ao excluir: " + (erro.erro || "Falha ao processar"));
        }
    } catch (error) {
        console.error("Erro na exclusão:", error);
        alert("Erro de comunicação com o servidor.");
    }
}