// A CHAVE DA TMDb API (V3)
const API_KEY = "8a14efd4f5827752c0ce72562a8881bc"; 
// URL BASE do TMDb para busca: usa 'search/movie' e o parâmetro 'query'
const URL_BASE = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=pt-BR&query=`;

// Elementos do DOM
const termoBuscaInput = document.getElementById("termoBusca");
const botaoBusca = document.getElementById("botaoBusca");
const listaResultados = document.getElementById("listaResultados");
const mensagemStatus = document.getElementById("mensagemStatus");
const btnAnterior = document.getElementById("btnAnterior");
const btnProxima = document.getElementById("btnProxima");

// Variáveis de estado
let termoBusca = "";
let paginaAtual = 1;
let totalResultados = 0;

// ===== EVENT LISTENERS =====

// 1. Ação do botão de busca
botaoBusca.addEventListener("click", () => {
    // Pega o termo de busca do input
    termoBusca = termoBuscaInput.value.trim();
    if (termoBusca.length === 0) {
        mensagemStatus.textContent = "⚠️ Por favor, digite um filme para pesquisar.";
        listaResultados.innerHTML = "";
        desabilitarBotoesPaginacao(true, true);
        return;
    }
    paginaAtual = 1; // Sempre começa na página 1 em uma nova busca
    buscarFilmes(termoBusca, paginaAtual);
});

// 2. Ação dos botões de paginação
btnAnterior.addEventListener("click", () => {
    if (paginaAtual > 1) {
        paginaAtual--;
        buscarFilmes(termoBusca, paginaAtual);
    }
});

btnProxima.addEventListener("click", () => {
    const totalPaginas = Math.ceil(totalResultados / 20); // TMDb mostra 20 resultados por página
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        buscarFilmes(termoBusca, paginaAtual);
    }
});


// ===== FUNÇÃO PRINCIPAL DE BUSCA =====
async function buscarFilmes(termo, pagina) {
    // Desabilita botões e mostra status de carregamento
    desabilitarBotoesPaginacao(true, true);
    listaResultados.innerHTML = "";
    mensagemStatus.textContent = "⏳ Buscando filmes no TMDb...";

    try {
        // Constrói a URL com o termo de busca e a página
        const url = `${URL_BASE}${encodeURIComponent(termo)}&page=${pagina}`;
        
        const resposta = await fetch(url);
        const dados = await resposta.json();

        // O TMDb retorna 'results' em vez de 'Search'
        if (dados.results && dados.results.length > 0) {
            totalResultados = dados.total_results;
            
            // Mostra os filmes na tela
            exibirFilmes(dados.results);

            mensagemStatus.textContent = `✅ Página ${paginaAtual} — ${dados.results.length} resultados de ${totalResultados} para "${termo}"`;
            
            // Atualiza o estado dos botões de paginação
            atualizarPaginacao(totalResultados, paginaAtual);

        } else {
            // Se não houver resultados
            listaResultados.innerHTML = "";
            mensagemStatus.textContent = `🚫 Nenhum resultado encontrado para "${termo}". Tente novamente.`;
        }
    } catch (erro) {
        console.error("Erro na busca da API:", erro);
        mensagemStatus.textContent = "❌ Erro ao buscar dados. Verifique sua chave de API e conexão.";
    }
}


// ===== FUNÇÃO PARA MOSTRAR FILMES (Adaptado para TMDb) =====
function exibirFilmes(filmes) {
    listaResultados.innerHTML = ""; // limpa os resultados anteriores

    if (!filmes || filmes.length === 0) return;

    filmes.forEach(filme => {
        // Cria o container do card
        const div = document.createElement("div");
        div.classList.add("card");

        // URL base para pôsteres do TMDb
        const base_poster_url = "https://image.tmdb.org/t/p/w300";

        // Verifica se há um caminho de pôster e monta a URL completa
        const poster = filme.poster_path
            ? `${base_poster_url}${filme.poster_path}`
            : "https://via.placeholder.com/300x450?text=Sem+Poster";

        // Monta o HTML do card (TMDb usa 'title' e 'release_date')
        const ano = filme.release_date ? filme.release_date.substring(0, 4) : 'N/A';
        
        div.innerHTML = `
            <img src="${poster}" alt="Pôster do filme ${filme.title}">
            <h3>${filme.title}</h3>
            <p>Ano: ${ano}</p>
        `;

        // Adiciona o card dentro da lista
        listaResultados.appendChild(div);
    });
}

// ===== FUNÇÕES DE CONTROLE DE PAGINAÇÃO =====
function atualizarPaginacao(total, atual) {
    const totalPaginas = Math.ceil(total / 20); // 20 resultados por página no TMDb

    // Habilita/Desabilita botão Anterior
    const anteriorDisabled = atual <= 1;
    
    // Habilita/Desabilita botão Próxima
    const proximaDisabled = atual >= totalPaginas || total === 0;

    desabilitarBotoesPaginacao(anteriorDisabled, proximaDisabled);
}

function desabilitarBotoesPaginacao(anterior, proxima) {
    btnAnterior.disabled = anterior;
    btnProxima.disabled = proxima;
}