const form = document.querySelector('#form-livro');
const listaEl = document.querySelector('#lista-livros');
const mensagemErro = document.querySelector('#mensagem-erro');
const campoTitulo = document.querySelector('#input-titulo');
const campoAutor = document.querySelector('#input-autor');
const campoAno = document.querySelector('#input-ano');

async function carregarLivros() {
  try {
    const response = await fetch("/livros");

    if (!response.ok) {
      mostrarErro('Erro ao buscar livros');
      return;
    }

    const livros = await response.json();

    renderizarLivros(livros);
    return;
  } catch (error) {
    mostrarErro(error.message);
  }
}

function mostrarErro(msg) {
  mensagemErro.textContent = msg;
  mensagemErro.classList.remove('oculto');
}

// ----- TAREFA 1: renderizar os livros na tela -----
function renderizarLivros(livros) {
  listaEl.innerHTML = "";

  for (const livro of livros) {
    const status = livro.disponivel === 1 ? "Disponível" : "Emprestado";
    const textoBotao = livro.disponivel === 1 ? "Emprestar" : "Devolver";

    const li = document.createElement("li");
    li.classList.add(livro.disponivel === 1 ? "disponivel" : "indisponivel");

    li.innerHTML = `
      <strong>${livro.titulo}</strong> - ${livro.autor} (${livro.ano}) - ${status}
    `;

    const botaoStatus = document.createElement("button");
    botaoStatus.innerHTML = textoBotao;
    botaoStatus.addEventListener("click", async () => {
      alternarStatus(livro);
    });

    const botaoRemover = document.createElement("button");
    botaoRemover.innerHTML = "Remover";
    botaoRemover.addEventListener("click", async () => {
      removerLivro(livro.id);
    });

    li.appendChild(botaoStatus);
    li.appendChild(botaoRemover);
    listaEl.appendChild(li);
  }
}

// ----- TAREFA 2: cadastrar um novo livro (POST) -----
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    titulo: campoTitulo.value,
    autor: campoAutor.value,
    ano: campoAno.value
  }

  const response = await fetch("/livros", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (response.ok) {
    const livroCriado = await response.json();
    console.log(livroCriado)
    alert("Livro cadastrado!");
    form.reset();
    carregarLivros();
  }
});

// ----- TAREFA 3: remover um livro (DELETE) -----
async function removerLivro(id) {
  const response = await fetch(`/livros/${id}`, {
    method: "DELETE"
  })

  if (response.ok) {
    const { mensagem } = await response.json();
    alert(mensagem);
  }

  carregarLivros();
}

// ----- TAREFA 4: emprestar / devolver um livro (PUT) -----
async function alternarStatus(livro) {
  const novoValor = livro.disponivel === 1 ? 0 : 1;

  const response = await fetch(`/livros/${livro.id}`, {
    method: "PUT",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ disponivel: novoValor })
  })

  if (response.ok) {
    carregarLivros();
  }
}

carregarLivros();
