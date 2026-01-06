$(function () {
    const STORAGE_KEY = 'megaSenaHistorico';
    let ultimoSorteio = [];

    const premioSalvo = JSON.parse(localStorage.getItem('megaSenaUltimoPremio'));

    if (Array.isArray(premioSalvo)) {
        ultimoSorteio = premioSalvo;
    }

    const tabelaPrecosMegaSena = {
        6: 6.00, 7: 42.00, 8: 168.00, 9: 504.00, 10: 1260.00,
        11: 2772.00, 12: 5544.00, 13: 10296.00, 14: 18018.00,
        15: 30030.00, 16: 48048.00, 17: 74256.00, 18: 111384.00,
        19: 162792.00, 20: 232560.00
    };

    // ================================
    // ESTADO INICIAL
    // ================================
    $('#meus-numeros').html('<em>—</em>');
    $('#numeros-sorteados').html('<em>—</em>');

    // ================================
    // LIMITES (MIN / MAX)
    // ================================
    function obterLimites() {
        let min = parseInt($('#min-numeros').val());
        let max = parseInt($('#max-numeros').val());

        if (isNaN(min)) min = 1;
        if (isNaN(max)) max = 60;

        return { min, max };
    }

    function validarQuantidadePorIntervalo() {
        let limites = obterLimites();
        if (!limites) return;

        let { min, max } = limites;

        let qtdInput = $('#qtd-numeros');
        let qtdAtual = parseInt(qtdInput.val()) || 6;

        // 🔴 NOVA REGRA: min == max e qtd > 1
        if (min === max && qtdAtual > 1) {
            $('#min-numeros').val(1);
            $('#max-numeros').val(60);

            UIkit.notification({
                message: 'Quando o mínimo e máximo são iguais, a quantidade deve ser 1. O intervalo foi redefinido para 1–60.',
                status: 'warning'
            });

            aplicarBloqueioMinMax();
            return;
        }

        let maxDisponivel = (max - min + 1);

        if (qtdAtual > maxDisponivel) {
            qtdInput.val(maxDisponivel);

            UIkit.notification({
                message: `A quantidade máxima de números para esse intervalo é ${maxDisponivel}.`,
                status: 'warning'
            });

            atualizarTextoQuantidade();
            atualizarPrecoAposta();
        }
    }


    function validarQuantidadeMegaSena() {
        let input = $('#qtd-numeros');
        let valor = parseInt(input.val());

        if (isNaN(valor) || valor < 6 || valor > 20) {
            input.val(6);

            UIkit.notification({
                message: 'A quantidade de números deve estar entre 6 e 20. O valor foi redefinido para 6.',
                status: 'warning'
            });

            atualizarTextoQuantidade();
            atualizarPrecoAposta();
        }
    }

    $('#min-numeros, #max-numeros').on('input', function () {
        aplicarBloqueioMinMax();
    });

    $('#min-numeros, #max-numeros').on('change', function () {
        let minInput = $('#min-numeros');
        let maxInput = $('#max-numeros');

        let min = parseInt(minInput.val()) || 1;
        let max = parseInt(maxInput.val()) || 60;

        if (min > max) {
            minInput.val(1);

            UIkit.notification({
                message: 'O valor mínimo não pode ser maior que o máximo. O mínimo foi redefinido para 1.',
                status: 'warning'
            });
        }

        if (max < min) {
            maxInput.val(60);

            UIkit.notification({
                message: 'O valor máximo não pode ser menor que o mínimo. O máximo foi redefinido para 60.',
                status: 'warning'
            });
        }

        aplicarBloqueioMinMax();
        validarQuantidadePorIntervalo()
    });

    function aplicarBloqueioMinMax() {
        let limites = obterLimites();
        if (!limites) return;

        let { min, max } = limites;

        $('.numero').each(function () {
            let valor = parseInt(this.value);
            let fora = valor < min || valor > max;

            this.disabled = fora;

            let item = $(this).closest('.numero-item');

            if (fora) {
                this.checked = false;
                item.removeClass('selecionado')
                    .addClass('numero-bloqueado');
            } else {
                item.removeClass('numero-bloqueado');
            }
        });
    }

    function resetarNumerosSelecionados() {
        $('.numero').prop('checked', false);
        $('.numero-item').removeClass('selecionado');

        UIkit.notification({
            message: 'Números limpos.',
            status: 'primary'
        });
    }



    // ================================
    // PREÇO DA APOSTA
    // ================================
    function atualizarPrecoAposta() {
        let qtdNumeros = parseInt($('#qtd-numeros').val()) || 6;
        let qtdApostas = parseInt($('#qtd-apostas').val()) || 0;

        if (!tabelaPrecosMegaSena[qtdNumeros]) {
            $('#precoAposta').html('');
            return;
        }

        // preço da aposta do usuário
        let precoUsuario = tabelaPrecosMegaSena[qtdNumeros];

        // preço das apostas simuladas (sempre 6 números)
        let precoSimulada = tabelaPrecosMegaSena[6];

        let totalSimuladas = precoSimulada * qtdApostas;
        let total = precoUsuario + totalSimuladas;

        $('#precoAposta').html(`
            <div class="uk-flex uk-flex-wrap uk-text-left">
                <div class="uk-width-1-2@m">
                    <h3 class="uk-heading-xsmall uk-margin-small-top uk-margin-remove-bottom">
                        Aposta principal:
                    </h3>
                    <p class="uk-margin-small-top">R$ ${precoUsuario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (<strong>${qtdNumeros} números</strong>)</p>

                    <h3 class="uk-heading-xsmall uk-margin-small-top uk-margin-remove-bottom">
                        Apostas simuladas:
                    </h3>
                    <p class="uk-margin-small-top">R$ ${totalSimuladas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (<strong>${qtdApostas} × 6 números</strong>)</p>
                </div>
                <hr class="uk-width-1-1 uk-hidden@m">
                <div class="uk-width-1-2@m uk-flex uk-flex-right@m uk-margin-top">
                    <div>
                        <h3 class="uk-heading-xsmall uk-margin-remove-bottom">Total:</h3>
                        <h4 class="uk-heading-small heading-price uk-margin-remove">
                            <span class="heading-price-symbol">R$</span>
                            ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h4>
                    </div>
                </div>
            </div>
        `);
    }


    // ================================
    // CRIAR NÚMEROS (1–60)
    // ================================
    for (let i = 1; i <= 60; i++) {
        $('#numeros').append(`
            <label class="numero-item">
                <input type="checkbox" class="numero" value="${i}">
                ${String(i).padStart(2, '0')}
            </label>
        `);
    }

    function limiteSelecao() {
        return parseInt($('#qtd-numeros').val()) || 6;
    }

    function atualizarTextoQuantidade() {
        let qtd = parseInt($('#qtd-numeros').val()) || 6;
        $('#texto-qtd-numeros').html(`Marque <strong>${qtd} números</strong>`);
    }

    $('#qtd-numeros').on('input change', function () {
        validarQuantidadePorIntervalo();
        atualizarTextoQuantidade();
        atualizarPrecoAposta();
    });

    $('#qtd-numeros').on('change', function () {
        validarQuantidadeMegaSena();
    });

    $('#qtd-numeros').on('input', function () {
        if ($('.numero:checked').length) {
            resetarNumerosSelecionados();
        }
    });

    atualizarTextoQuantidade();

    // ================================
    // SELEÇÃO DE NÚMEROS (MIN / MAX)
    // ================================
    $(document).on('change', '.numero', function () {

        let limite = limiteSelecao();
        let limites = obterLimites();
        if (!limites) {
            this.checked = false;
            return;
        }

        let valor = parseInt(this.value);

        if (valor < limites.min || valor > limites.max) {
            this.checked = false;
            UIkit.notification({
                message: `Escolha números entre ${limites.min} e ${limites.max}.`,
                status: 'warning'
            });
            return;
        }

        if ($('.numero:checked').length > limite) {
            this.checked = false;
            UIkit.notification({
                message: `Você só pode escolher ${limite} números.`,
                status: 'warning'
            });
            return;
        }

        $(this).closest('.numero-item')
            .toggleClass('selecionado', this.checked);
    });

    // ================================
    // CAMPOS MANUAIS DO PRÊMIO
    // ================================
    $('#usar-premio-manual').on('change', function () {
        if (this.checked) {
            criarCamposPremioManual();
            $('#campo-premio-manual').slideDown();
        } else {
            $('#campo-premio-manual').slideUp();
            $('#inputs-premio-manual').empty();
        }
    });

    $('#qtd-numeros, #qtd-apostas, #min-numeros, #max-numeros').on('input change', function () {
        if ($('#usar-premio-manual').is(':checked')) criarCamposPremioManual();
        atualizarPrecoAposta();
        aplicarBloqueioMinMax();
    });

    function criarCamposPremioManual() {
        let qtd = parseInt($('#qtd-numeros').val()) || 6;
        let limites = obterLimites();
        if (!limites) return;

        let box = $('#inputs-premio-manual').empty();

        for (let i = 1; i <= qtd; i++) {
            box.append(`
                <input type="number"
                    class="uk-input uk-form-width-small premio-manual"
                    min="${limites.min}"
                    max="${limites.max}"
                    placeholder="Nº ${i}">
            `);
        }
    }

    // ================================
    // SORTEIO
    // ================================
    function sortearNumeros(qtd) {
        let limites = obterLimites();
        if (!limites) return [];

        let { min, max } = limites;

        let intervalo = [];
        for (let i = min; i <= max; i++) {
            intervalo.push(i);
        }

        if (intervalo.length < qtd) {
            UIkit.notification({
                message: 'Intervalo insuficiente para a quantidade de números.',
                status: 'danger'
            });
            return [];
        }

        // embaralha o intervalo
        for (let i = intervalo.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [intervalo[i], intervalo[j]] = [intervalo[j], intervalo[i]];
        }

        return intervalo.slice(0, qtd).sort((a, b) => a - b);
    }



    function obterNumerosPremio() {
        if (!$('#usar-premio-manual').is(':checked')) {
            return sortearNumeros(6);
        }

        let limites = obterLimites();
        if (!limites) return null;

        let qtd = parseInt($('#qtd-numeros').val()) || 6;

        let nums = $('.premio-manual').map(function () {
            return parseInt($(this).val());
        }).get().filter(n => !isNaN(n));

        let unicos = [...new Set(nums)];

        if (
            nums.length !== qtd ||
            unicos.length !== qtd ||
            unicos.some(n => n < limites.min || n > limites.max)
        ) {
            UIkit.notification({
                message: `Informe ${qtd} números válidos.`,
                status: 'danger'
            });
            return null;
        }

        return unicos.sort((a, b) => a - b);
    }

    function gerarApostas(total, qtd) {
        let apostas = [];
        let tentativas = 0;

        while (apostas.length < total && tentativas < 1000) {
            let numeros = sortearNumeros(qtd);
            let chave = numeros.join('-');

            if (!apostas.some(a => a.join('-') === chave)) {
                apostas.push(numeros);
            }

            tentativas++;
        }

        return apostas;
    }


    // ================================
    // EXECUTAR SORTEIO
    // ================================
    function formatarNumerosComAcertos(numeros, premio) {
        return numeros.map(n =>
            premio.includes(n)
                ? `<strong>${n}</strong>`
                : n
        ).join(', ');
    }

    $('#analisar').on('click', function () {
        const historico = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

        if (!historico.length) {
            UIkit.notification('Nenhum dado para análise', { status: 'warning' });
            return;
        }

        const ultimoRegistro = historico[historico.length - 1];
        const tabela = gerarTabelaAnalise(ultimoRegistro, ultimoSorteio);

        const resumo = gerarResumoAnalise(ultimoRegistro, ultimoSorteio);

        $('#estatisticas-conteudo').html(
            resumo + tabela
        );
        UIkit.modal('#estatisticas-modal').show();
    });




    function gerarEstatisticas(historico) {
        let contador = {};
        let dezenas = { '1-10': 0, '11-20': 0, '21-30': 0, '31-40': 0, '41-50': 0, '51-60': 0 };

        historico.forEach(registro => {
            [...registro.apostaUsuario, ...registro.apostasSimuladas.flat()]
                .forEach(n => {
                    contador[n] = (contador[n] || 0) + 1;
                });
        });

        Object.keys(contador).forEach(n => {
            let num = parseInt(n);
            let faixa = `${Math.floor((num - 1) / 10) * 10 + 1}-${Math.floor((num - 1) / 10) * 10 + 10}`;
            dezenas[faixa] += contador[n];
        });

        return {
            contador,
            dezenas
        };
    }

    function obterNumerosBase() {
        const input = $('#todos-numeros').val().trim();

        // Se o usuário digitou números, usa SOMENTE eles
        if (input !== '') {
            return input
                .split(',')
                .map(n => parseInt(n.trim(), 10))
                .filter(n => !isNaN(n));
        }

        // Caso contrário, usa o padrão 1 a 60
        return Array.from({ length: 60 }, (_, i) => i + 1);
    }


    function gerarTabelaAnalise(item, numerosPremio) {
        let contador = {};

        const numerosUsados = [
            ...item.apostaUsuario,
            ...item.apostasSimuladas.flat()
        ];

        numerosUsados.forEach(n => {
            contador[n] = (contador[n] || 0) + 1;
        });

        let linhas = Object.keys(contador)
            .map(Number)
            .sort((a, b) => a - b)
            .map((num, index) => {
                const vezes = contador[num];
                const casaInicio = Math.floor((num - 1) / 10) * 10 + 1;
                const acertou = numerosPremio.includes(num) ? '✅' : '❌';
                const paridade = num % 2 === 0 ? 'Par' : 'Ímpar';

                return `
                    <tr>
                        <td>#0${index + 1}</td>
                        <td>${num}</td>
                        <td>${paridade}</td>
                        <td>${vezes}x</td>
                        <td>${casaInicio}-${casaInicio + 9}</td>
                        <td class="${acertou === '✅'
                            ? 'uk-text-success uk-text-bold'
                            : 'uk-text-muted'}">
                            ${acertou}
                        </td>
                    </tr>
                `;
            })
            .join('');



        return `
            <table class="uk-table uk-table-divider" style="min-width: 600px">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Números</th>
                        <th>Par / Ímpar</th>
                        <th>Nº repetição</th>
                        <th>Casa</th>
                        <th>Acertou?</th>
                    </tr>
                </thead>
                <tbody>
                    ${linhas}
                </tbody>
            </table>
        `;
    }

function gerarResumoAnalise(item, numerosPremio) {

    const todosNumeros = [
        ...item.apostaUsuario,
        ...item.apostasSimuladas.flat()
    ];

    const unicos = [...new Set(todosNumeros)].sort((a, b) => a - b);

    // Pares e ímpares
    const pares = unicos.filter(n => n % 2 === 0).length;
    const impares = unicos.length - pares;

    // Soma
    const soma = unicos.reduce((a, b) => a + b, 0);

    // Frequência simples
    const frequencia = {};
    todosNumeros.forEach(n => frequencia[n] = (frequencia[n] || 0) + 1);

    const repetidos = Object.values(frequencia).filter(v => v > 1).length;
    const unicosQtd = Object.values(frequencia).filter(v => v === 1).length;

    // Sequências simples
    let sequencias = [];
    let atual = [];

    unicos.forEach((n, i) => {
        if (i === 0 || n === unicos[i - 1] + 1) {
            atual.push(n);
        } else {
            if (atual.length > 1) sequencias.push([...atual]);
            atual = [n];
        }
    });
    if (atual.length > 1) sequencias.push(atual);

    // Distância média
    let distanciaMedia = 0;
    if (unicos.length > 1) {
        const distancias = unicos
            .slice(1)
            .map((n, i) => n - unicos[i]);
        distanciaMedia = (
            distancias.reduce((a, b) => a + b, 0) / distancias.length
        ).toFixed(1);
    }

    // Distribuição de acertos
    const distribuicao = { sena: 0, quina: 0, quadra: 0 };

    item.apostasSimuladas.forEach(aposta => {
        const acertos = aposta.filter(n => numerosPremio.includes(n)).length;
        if (acertos === 6) distribuicao.sena++;
        if (acertos === 5) distribuicao.quina++;
        if (acertos === 4) distribuicao.quadra++;
    });

    // Cobertura
    const cobertura = (
        numerosPremio.filter(n => unicos.includes(n)).length /
        numerosPremio.length * 100
    ).toFixed(0);

    // 👉 RESUMO SALVO
    const resumo = {
        pares,
        impares,
        soma,
        unicosQtd,
        repetidos,
        sequencias,
        distanciaMedia,
        cobertura,
        distribuicao
    };

    item.resumoAnalise = resumo;

    // 👉 HTML LEVE
return `
    <div class="uk-flex uk-flex-wrap uk-child-width-1-2@s">
        <div class="uk-padding-small">
            <strong>Equilíbrio dos números:</strong><br>
            ${pares} pares e ${impares} ímpares
        </div>
        <div class="uk-padding-small">
            <strong>Soma total dos números:</strong><br>
            ${soma} (valor acumulado de todos os números analisados)
        </div>
        <div class="uk-padding-small">
            <strong>Números diferentes usados:</strong><br>
            ${unicosQtd} números únicos
        </div>
        <div class="uk-padding-small">
            <strong>Números repetidos:</strong><br>
            ${repetidos} apareceram mais de uma vez
        </div>
        <div class="uk-padding-small">
            <strong>Números em sequência:</strong><br>
            ${sequencias.length
                ? sequencias.map(s => s.join(' → ')).join(', ')
                : 'Nenhuma sequência encontrada'}
        </div>
        <div class="uk-padding-small">
            <strong>Espaçamento entre números:</strong><br>
            Em média, os números estão separados por ${distanciaMedia}
        </div>
        <div class="uk-padding-small">
            <strong>Cobertura do sorteio:</strong><br>
            ${cobertura}% dos números sorteados aparecem nas apostas
        </div>
        <div class="uk-padding-small">
            <strong>Resultado das apostas simuladas:</strong><br>
            ${distribuicao.sena} Sena |
            ${distribuicao.quina} Quina |
            ${distribuicao.quadra} Quadra
        </div>
    </div>
    <hr>
`;

}


    function renderizarEstatisticas(est) {
        let linhas = Object.entries(est.contador)
            .sort((a, b) => b[1] - a[1])
            .map(([num, qtd]) => `
                    <tr>
                        <td>${num}</td>
                        <td>${qtd}</td>
                    </tr>
                `)
            .join('');

        $('#estatisticas-conteudo').html(`
            <table class="uk-table uk-table-divider uk-table-small">
                <thead>
                    <tr>
                        <th>Número</th>
                        <th>Quantidade</th>
                    </tr>
                </thead>
                <tbody>
                    ${linhas}
                </tbody>
            </table>
        `);
    }

    function numerosProximos(lista) {
        lista.sort((a, b) => a - b);
        let grupos = [];

        for (let i = 0; i < lista.length - 1; i++) {
            if (lista[i + 1] - lista[i] <= 2) {
                grupos.push([lista[i], lista[i + 1]]);
            }
        }
        return grupos;
    }


    $('#sortear').on('click', function () {
        let qtdNumeros = parseInt($('#qtd-numeros').val());
        let qtdApostas = parseInt($('#qtd-apostas').val());
        let usarQtd = $('#usar-qtd-numeros').is(':checked');

        let escolhidos = $('.numero:checked').map(function () {
            return parseInt(this.value);
        }).get();

        if (escolhidos.length !== qtdNumeros) {
            UIkit.notification({
                message: 'Selecione a quantidade correta.',
                status: 'danger'
            });
            return;
        }

        let premio = obterNumerosPremio();
        if (!premio) return;

        ultimoSorteio = premio;
        localStorage.setItem('megaSenaUltimoPremio', JSON.stringify(premio));

        let tabela = `
        <table class="uk-table uk-table-divider uk-table-small">
            <thead>
                <tr>
                    <th>Tipo</th>
                    <th>Números</th>
                    <th>Acertos</th>
                    <th>Resultado</th>
                </tr>
            </thead>
            <tbody>
        `;

        function resultado(acertos) {
            if (acertos === 6) return '🎉 Sena';
            if (acertos === 5) return '💰 Quina';
            if (acertos === 4) return '✨ Quadra';
            return '—';
        }

        let acertosUser = escolhidos.filter(n => premio.includes(n)).length;

        tabela += `
            <tr>
                <td><strong>Seu jogo</strong></td>
                <td>${escolhidos.join(', ')}</td>
                <td>${acertosUser}</td>
                <td>${resultado(acertosUser)}</td>
            </tr>
        `;

        let apostas = gerarApostas(qtdApostas, usarQtd ? qtdNumeros : 6);

        apostas.forEach((a, i) => {
            let acertos = a.filter(n => premio.includes(n)).length;

            tabela += `
                <tr>
                    <td>Aposta ${i + 1}</td>
                    <td>${formatarNumerosComAcertos(a, premio)}</td>
                    <td>${acertos}</td>
                    <td>${resultado(acertos)}</td>
                </tr>
            `;
        });


        tabela += '</tbody></table>';

        $('#numeros-sorteados').html(
            premio.map(n => `<span class="bola">${n}</span>`).join('')
        );

        $('#numeros-tabela').html(tabela);

        $('#meus-numeros').html(
            escolhidos.map(n =>
                `<span class="bola ${premio.includes(n) ? 'acerto' : ''}">${n}</span>`
            ).join('')
        );

        UIkit.modal('#resultado-modal').show();

        salvarHistorico(escolhidos, apostas);
    });

    aplicarBloqueioMinMax();
    atualizarPrecoAposta();

    function salvarHistorico(apostaUsuario, apostasSimuladas) {
        let historico = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

        historico.push({
            data: new Date().toLocaleString('pt-BR'),
            apostaUsuario,
            apostasSimuladas
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(historico));
    }
});