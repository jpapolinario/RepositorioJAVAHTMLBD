const URL_API = "http://localhost:8080/usuarios";

// Algoritmo oficial da Receita Federal (Módulo 11) para validar CPF
function validarCpfReal(cpf) {
    const limpo = (cpf || "").replace(/\D/g, "");
    if (limpo.length !== 11) return false;

    // Bloqueia padrões óbvios com todos os números iguais (ex: 111.111.111-11, 000.000.000-00)
    if (/^(\d)\1{10}$/.test(limpo)) return false;

    // Validação do 1º dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(limpo.charAt(i), 10) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(limpo.charAt(9), 10)) return false;

    // Validação do 2º dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(limpo.charAt(i), 10) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(limpo.charAt(10), 10)) return false;

    return true;
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formCadastro") || document.querySelector("form");
    const botoes = Array.from(document.querySelectorAll("button, input[type='button'], input[type='submit']"));
    const botaoCadastrar = botoes.find(b => (b.textContent || b.value || "").toLowerCase().includes("cadastr") || (b.textContent || b.value || "").toLowerCase().includes("atualiz")) || document.querySelector("button");

    const getEl = (nome) => document.getElementById(nome) || document.querySelector(`[name='${nome}']`);

    const inputNome = getEl("nome");
    const inputDataNasc = getEl("dataNascimento") || getEl("data_nascimento");
    const inputIdade = getEl("idade");
    const inputCpf = getEl("cpf");
    const selectSexo = getEl("sexo");
    const selectEstadoCivil = getEl("estadoCivil") || getEl("estado_civil");
    const inputConjuge = getEl("conjuge");
    const containerConjuge = document.getElementById("containerConjuge");
    const inputCep = getEl("cep");
    const inputCidade = getEl("cidade");
    const inputEstado = getEl("estado");
    const inputEndereco = getEl("endereco");
    const inputComplemento = getEl("complemento");
    const inputEmail = getEl("email");

    function marcarErro(campo, temErro) {
        if (!campo) return;
        if (temErro) {
            campo.classList.add("campo-invalido");
        } else {
            campo.classList.remove("campo-invalido");
        }
    }

    // 1. Controle do campo Cônjuge
    function checarConjuge() {
        if (!selectEstadoCivil || !inputConjuge) return;
        const casado = selectEstadoCivil.value.toLowerCase().includes("casad");

        if (containerConjuge) {
            containerConjuge.style.display = casado ? "" : "none";
        } else {
            inputConjuge.style.display = casado ? "" : "none";
        }

        if (!casado) {
            inputConjuge.value = "";
            marcarErro(inputConjuge, false);
        } else if (inputConjuge.value.trim().length > 0) {
            marcarErro(inputConjuge, false);
        }
    }

    if (selectEstadoCivil) {
        selectEstadoCivil.addEventListener("change", () => {
            checarConjuge();
            marcarErro(selectEstadoCivil, selectEstadoCivil.value.trim() === "");
        });
        checarConjuge();
    }

    // 2. Validações e máscaras em tempo real
    if (inputNome) {
        inputNome.addEventListener("input", () => {
            marcarErro(inputNome, inputNome.value.trim().length < 3);
        });
    }

    if (inputDataNasc) {
        inputDataNasc.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "").slice(0, 8);
            if (v.length >= 5) v = v.replace(/^(\d{2})(\d{2})(\d{0,4})/, "$1/$2/$3");
            else if (v.length >= 3) v = v.replace(/^(\d{2})(\d{0,2})/, "$1/$2");
            e.target.value = v;

            if (v.length === 10) {
                const [d, m, a] = v.split("/").map(Number);
                const valido = d >= 1 && d <= 31 && m >= 1 && m <= 12 && a >= 1900 && a <= 2026;
                marcarErro(inputDataNasc, !valido);

                if (valido && inputIdade) {
                    const nasc = new Date(a, m - 1, d);
                    const hoje = new Date();
                    let idade = hoje.getFullYear() - nasc.getFullYear();
                    const mesAtual = hoje.getMonth() - nasc.getMonth();
                    if (mesAtual < 0 || (mesAtual === 0 && hoje.getDate() < nasc.getDate())) idade--;
                    inputIdade.value = (idade >= 0) ? idade : "";
                    marcarErro(inputIdade, idade < 0);
                }
            } else {
                marcarErro(inputDataNasc, true);
                if (inputIdade) inputIdade.value = "";
            }
        });
    }

    if (inputCpf) {
        inputCpf.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "").slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            e.target.value = v;

            // Valida o CPF matematicamente assim que atingir os 11 dígitos
            if (v.length === 14) {
                marcarErro(inputCpf, !validarCpfReal(v));
            } else {
                marcarErro(inputCpf, true);
            }
        });
    }

    if (selectSexo) {
        selectSexo.addEventListener("change", () => {
            marcarErro(selectSexo, selectSexo.value.trim() === "");
        });
    }

    if (inputConjuge) {
        inputConjuge.addEventListener("input", () => {
            const casado = selectEstadoCivil && selectEstadoCivil.value.toLowerCase().includes("casad");
            if (casado) marcarErro(inputConjuge, inputConjuge.value.trim().length === 0);
        });
    }

    if (inputCep) {
        inputCep.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\D/g, "").slice(0, 8);
            v = v.replace(/^(\d{5})(\d)/, "$1-$2");
            e.target.value = v;
            marcarErro(inputCep, v.length !== 9);
        });
    }

    const camposTextoSimples = [inputCidade, inputEstado, inputEndereco, inputComplemento];
    camposTextoSimples.forEach(campo => {
        if (campo) {
            campo.addEventListener("input", () => {
                marcarErro(campo, campo.value.trim().length === 0);
            });
        }
    });

    if (inputEmail) {
        inputEmail.addEventListener("input", () => {
            const email = inputEmail.value.trim();
            const valido = email.includes("@") && email.includes(".") && email.length >= 5;
            marcarErro(inputEmail, !valido);
        });
    }

    // 3. Suporte a Edição (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const idEdicao = urlParams.get("id");
    if (idEdicao) carregarDadosEdicao(idEdicao);

    // 4. Submissão e Validação Estrita de Todos os Campos
    async function executarEnvio(e) {
        if (e) e.preventDefault();

        const nome = inputNome ? inputNome.value.trim() : "";
        const dataNasc = inputDataNasc ? inputDataNasc.value.trim() : "";
        const idade = inputIdade ? inputIdade.value.trim() : "";
        const cpf = inputCpf ? inputCpf.value.trim() : "";
        const sexo = selectSexo ? selectSexo.value.trim() : "";
        const estadoCivil = selectEstadoCivil ? selectEstadoCivil.value.trim() : "";
        const conjuge = inputConjuge ? inputConjuge.value.trim() : "";
        const cep = inputCep ? inputCep.value.trim() : "";
        const cidade = inputCidade ? inputCidade.value.trim() : "";
        const estado = inputEstado ? inputEstado.value.trim() : "";
        const endereco = inputEndereco ? inputEndereco.value.trim() : "";
        const complemento = inputComplemento ? inputComplemento.value.trim() : "";
        const email = inputEmail ? inputEmail.value.trim() : "";

        const erros = [];

        if (nome.length < 3) { marcarErro(inputNome, true); erros.push("• Nome Completo é obrigatório."); }
        if (dataNasc.length < 10) { marcarErro(inputDataNasc, true); erros.push("• Data de Nascimento deve estar completa (DD/MM/AAAA)."); }
        if (!idade) { marcarErro(inputIdade, true); erros.push("• Idade não calculada (verifique a data de nascimento)."); }

        if (!validarCpfReal(cpf)) {
            marcarErro(inputCpf, true);
            erros.push("• CPF inválido pela Receita Federal (números repetidos ou dígitos verificadores incorretos).");
        }

        if (!sexo) { marcarErro(selectSexo, true); erros.push("• Selecione o Sexo."); }
        if (!estadoCivil) { marcarErro(selectEstadoCivil, true); erros.push("• Selecione o Estado Civil."); }

        const casado = estadoCivil.toLowerCase().includes("casad");
        if (casado && conjuge.length === 0) {
            marcarErro(inputConjuge, true);
            erros.push("• Nome do Cônjuge é obrigatório para casados.");
        }

        if (cep.length !== 9) { marcarErro(inputCep, true); erros.push("• CEP obrigatório com 8 números."); }
        if (!cidade) { marcarErro(inputCidade, true); erros.push("• Cidade é obrigatória."); }
        if (!estado) { marcarErro(inputEstado, true); erros.push("• Estado é obrigatório."); }
        if (!endereco) { marcarErro(inputEndereco, true); erros.push("• Endereço é obrigatório."); }
        if (!complemento) { marcarErro(inputComplemento, true); erros.push("• Complemento é obrigatório (coloque 'Nenhum' se não houver)."); }
        if (!email.includes("@") || !email.includes(".")) { marcarErro(inputEmail, true); erros.push("• E-mail válido é obrigatório."); }

        if (erros.length > 0) {
            alert("Atenção! Todos os campos são obrigatórios. Corrija os itens abaixo:\n\n" + erros.join("\n"));
            return;
        }

        const usuario = {
            nome,
            dataNascimento: dataNasc,
            idade: parseInt(idade, 10),
            cpf,
            sexo,
            estadoCivil,
            conjuge: casado ? conjuge : "",
            endereco,
            cep,
            cidade,
            estado,
            complemento,
            email
        };

        try {
            const url = idEdicao ? `${URL_API}/${idEdicao}` : URL_API;
            const metodo = idEdicao ? "PUT" : "POST";

            const resposta = await fetch(url, {
                method: metodo,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(usuario)
            });

            if (resposta.ok) {
                alert(idEdicao ? "Usuário atualizado com sucesso!" : "Usuário cadastrado com sucesso no banco de dados!");
                window.location.href = "listagem.html";
            } else {
                const erroServidor = await resposta.json().catch(() => ({}));
                const msg = erroServidor.erro || "Falha ao gravar no banco.";
                if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
                    alert("Não foi possível salvar: Este CPF já se encontra cadastrado no banco de dados.");
                    marcarErro(inputCpf, true);
                } else {
                    alert("Erro do servidor:\n" + msg);
                }
            }
        } catch (erro) {
            console.error("Erro na requisição:", erro);
            alert("Não foi possível alcançar o servidor Java na porta 8080.\nVerifique se o Servidor.java está rodando no VS Code!");
        }
    }

    if (form) form.addEventListener("submit", executarEnvio);
    if (botaoCadastrar) botaoCadastrar.addEventListener("click", executarEnvio);
});

async function carregarDadosEdicao(id) {
    try {
        const resposta = await fetch(URL_API);
        const usuarios = await resposta.json();
        const u = usuarios.find(item => item.id == id);

        if (u) {
            const setVal = (idEl, val) => {
                const el = document.getElementById(idEl) || document.querySelector(`[name='${idEl}']`);
                if (el) el.value = val || "";
            };

            setVal("nome", u.nome);
            setVal("dataNascimento", u.dataNascimento);
            setVal("data_nascimento", u.dataNascimento);
            setVal("idade", u.idade);
            setVal("cpf", u.cpf);
            setVal("sexo", u.sexo);
            setVal("estadoCivil", u.estadoCivil);
            setVal("estado_civil", u.estadoCivil);
            setVal("conjuge", u.conjuge);
            setVal("endereco", u.endereco);
            setVal("cep", u.cep);
            setVal("cidade", u.cidade);
            setVal("estado", u.estado);
            setVal("complemento", u.complemento);
            setVal("email", u.email);

            const selectCivil = document.getElementById("estadoCivil") || document.querySelector("[name='estadoCivil']");
            if (selectCivil) selectCivil.dispatchEvent(new Event("change"));

            const btn = document.querySelector("button, input[type='button'], input[type='submit']");
            if (btn) {
                if (btn.tagName === "INPUT") btn.value = "Atualizar Usuário";
                else btn.textContent = "Atualizar Usuário";
            }
        }
    } catch (err) {
        console.error("Erro ao carregar dados:", err);
    }
}