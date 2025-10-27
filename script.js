// =========================================================
// VARIÁVEIS DE CONFIGURAÇÃO DA API
// =========================================================
const API_KEY = "8a14efd4f5827752c0ce72562a8881bc"; 
const API_BASE_URL = "https://api.themoviedb.org/3";

// =========================================================
// ELEMENTOS DO DOM
// =========================================================
const termoBuscaInput = document.getElementById("termoBusca");
const botaoBusca = document.getElementById("botaoBusca");
const botaoFiltrar = document.getElementById("botaoFiltrar");
const listaResultados = document.getElementById("listaResultados");
const mensagemStatus = document.getElementById("mensagemStatus");
const btnAnterior = document.getElementById("btnAnterior");
const btnProxima = document.getElementById("btnProxima");

// Elementos de Filtro
const filtroAnoInput = document.getElementById("filtroAno");
const filtroGeneroSelect = document.getElementById("filtroGenero");
const filtroIdiomaSelect = document.getElementById("filtroIdioma");

// =========================================================
// VARIÁVEIS DE ESTADO
// =========================================================
let termoBusca = "";
let paginaAtual = 1;
let totalResultados = 0;
let modoBusca = 'DISCOVER'; // Define o modo inicial como 'DISCOVER'

// =========================================================
// 1. FUNÇÕES DE INICIALIZAÇÃO E GÊNEROS
// =========================================================

/**
 * Busca a lista de gêneros na API do TMDb e popula o <select>
 */
async function carregarGeneros() {
    const url = `${API_BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=pt-BR`;
    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (dados.genres) {
            dados.genres.forEach(genero => {
                const option = document.createElement("option");
                option.value = genero.id;
                option.textContent = genero.name;
                filtroGeneroSelect.appendChild(option);
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar gêneros:", erro);
    }
}

// =========================================================
// 2. LÓGICA DE EXECUÇÃO DA BUSCA
// =========================================================

/**
 * Função para iniciar a busca no modo "SEARCH" (por texto)
 */
function executarBuscaPorTermo() {
    termoBusca = termoBuscaInput.value.trim();
    if (termoBusca.length === 0) {
        // Se a busca está vazia, usa o modo filtro
        executarBuscaComFiltros();
        return;
    }
    modoBusca = 'SEARCH';
    paginaAtual = 1;
    buscarFilmes();
}

/**
 * Função para iniciar a busca no modo "DISCOVER" (por filtros ou popularidade)
 */
function executarBuscaComFiltros() {
    // Limpa a busca textual para garantir que o modo filtro funcione
    termoBuscaInput.value = ""; 
    termoBusca = ""; 
    
    modoBusca = 'DISCOVER';
    paginaAtual = 1;
    buscarFilmes();}

// =========================================================
// 3. FUNÇÃO PRINCIPAL DE BUSCA COM LÓGICA DE FILTRO
// =========================================================

async function buscarFilmes() {
    desabilitarBotoesPaginacao(true, true);
    listaResultados.innerHTML = "";
    mensagemStatus.textContent = `⏳ Buscando filmes no TMDb... (Página ${paginaAtual})`;

    let url_endpoint;
    let url_params;
    
    // Define se o endpoint será de Busca (Search) ou Descoberta (Discover)
    if (modoBusca === 'SEARCH' && termoBusca) {
        // MODO BUSCA (por nome)
        url_endpoint = `${API_BASE_URL}/search/movie`;
        url_params = `&query=${encodeURIComponent(termoBusca)}`;
    } else {
        // MODO FILTRO/DISCOVER (por filtros ou popularidade)
        url_endpoint = `${API_BASE_URL}/discover/movie`;
        
        // Constrói os parâmetros dos filtros
        const ano = filtroAnoInput.value;
        const genero = filtroGeneroSelect.value;
        const idioma = filtroIdiomaSelect.value;
        
        let filtro_string = "";
        if (ano) filtro_string += `&primary_release_year=${ano}`;
        if (genero) filtro_string += `&with_genres=${genero}`;
        if (idioma) filtro_string += `&with_original_language=${idioma}`;
        
        url_params = filtro_string;

        // Parâmetro padrão para popularidade se nenhum filtro específico foi aplicado
        if (modoBusca === 'DISCOVER' || (!ano && !genero && !idioma)) {
             // Sempre ordena por popularidade no modo DISCOVER
            url_params += "&sort_by=popularity.desc";
        }
    }

    // Monta a URL final
    const url = `${url_endpoint}?api_key=${API_KEY}&language=pt-BR${url_params}&page=${paginaAtual}`;

    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (dados.results && dados.results.length > 0) {
            totalResultados = dados.total_results;
            
            exibirFilmes(dados.results);

            // Mensagem de status customizada
            let textoBusca;
            if (modoBusca === 'SEARCH') {
                textoBusca = `para "${termoBusca}"`;
            } else {
                 textoBusca = `com filtros aplicados (Populares)`;
                 // Caso o usuário queira saber o filtro aplicado
                 if (filtroAnoInput.value || filtroGeneroSelect.value || filtroIdiomaSelect.value) {
                     textoBusca = `com filtros: Ano=${filtroAnoInput.value || 'Todos'}, Gênero=${filtroGeneroSelect.options[filtroGeneroSelect.selectedIndex].text}, Idioma=${filtroIdiomaSelect.value || 'Todos'}`;
                 }
            }
            
            mensagemStatus.textContent = `✅ Página ${paginaAtual} — ${dados.results.length} resultados de ${totalResultados} ${textoBusca}`;
            
            atualizarPaginacao(totalResultados, paginaAtual);

        } else {
            listaResultados.innerHTML = "";
            const erroBusca = termoBusca ? `para "${termoBusca}"` : `com os filtros selecionados`;
            mensagemStatus.textContent = `🚫 Nenhum resultado encontrado ${erroBusca}.`;
        }
    } catch (erro) {
        console.error("Erro na busca da API:", erro);
        mensagemStatus.textContent = "❌ Erro ao buscar dados. Verifique a chave de API ou a URL.";
    }
}


// =========================================================
// 4. FUNÇÕES DE EXIBIÇÃO E PAGINAÇÃO
// =========================================================

function exibirFilmes(filmes) {
    listaResultados.innerHTML = ""; 
    if (!filmes || filmes.length === 0) return;

    filmes.forEach(filme => {
        const div = document.createElement("div");
        div.classList.add("card");

        const base_poster_url = "https://image.tmdb.org/t/p/w300";

        const poster = filme.poster_path
            ? `${base_poster_url}${filme.poster_path}`
            : "https://via.placeholder.com/300x450?text=Sem+Poster";

        const ano = filme.release_date ? filme.release_date.substring(0, 4) : 'N/A';
        
        div.innerHTML = `
            <img src="${poster}" alt="Pôster do filme ${filme.title}">
            <h3>${filme.title}</h3>
            <p>Ano: ${ano}</p>
        `;

        listaResultados.appendChild(div);
    });
}

function atualizarPaginacao(total, atual) {
    const totalPaginas = Math.ceil(total / 20); 

    const anteriorDisabled = atual <= 1;
    const proximaDisabled = atual >= totalPaginas || total === 0;

    desabilitarBotoesPaginacao(anteriorDisabled, proximaDisabled);
}

function desabilitarBotoesPaginacao(anterior, proxima) {
    btnAnterior.disabled = anterior;
    btnProxima.disabled = proxima;
}


// =========================================================
// 5. EVENT LISTENERS GERAIS E INICIALIZAÇÃO
// =========================================================

// Botão Busca (por termo)
botaoBusca.addEventListener("click", executarBuscaPorTermo);

// Botão Filtrar
botaoFiltrar.addEventListener("click", executarBuscaComFiltros);

// Paginação
btnAnterior.addEventListener("click", buscarFilmes);
btnProxima.addEventListener("click", buscarFilmes);


// Adiciona a funcionalidade de buscar quando a tecla ENTER é pressionada
termoBuscaInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        executarBuscaPorTermo();
    }
});

filtroAnoInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        executarBuscaComFiltros();
    }
});


// Função principal que roda ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    carregarGeneros();
    // Inicia a busca (modo DISCOVER/Populares) para mostrar algo na tela
    buscarFilmes(); 
});