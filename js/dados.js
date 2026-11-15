/* Frangos & Assados — dados da demonstração (salvos no navegador)
   Na versão final estes dados ficam no Firebase. */
(function () {
  const CHAVE = 'frangos_assados_demo_v2';

  const ITENS_ESTOQUE = [
    { id: 'frango',   nome: 'Frangos',            un: 'un',     icone: '🍗', aviso1: 10, aviso2: 5 },
    { id: 'polenta',  nome: 'Polenta frita',      un: 'porções', icone: '🟨', aviso1: 15, aviso2: 5 },
    { id: 'maionese', nome: 'Salada de maionese', un: 'potes 500g', icone: '🥗', aviso1: 5, aviso2: 2 }
  ];

  const PRODUTOS_PADRAO = [
    { id: 'frango-com-polenta', nome: 'Frango com polenta', preco: 60, img: 'img/frango.jpg',
      desc: 'Frango bem assadinho com o nosso tempero tradicional, acompanhado de uma porção da nossa famosa polenta frita!',
      consumo: { frango: 1, polenta: 1 }, ativo: true, destaque: 'Mais pedido' },
    { id: 'meio-frango-com-polenta', nome: '½ frango com polenta', preco: 32, img: 'img/meio-frango.jpg',
      desc: 'Metade de um frango bem assadinho com o nosso tempero tradicional, acompanhado de uma porção da nossa famosa polenta frita!',
      consumo: { frango: 0.5, polenta: 1 }, ativo: true, destaque: '' },
    { id: 'polenta-extra', nome: 'Polenta extra', preco: 5, img: 'img/polenta.jpg',
      desc: 'Nossa famosa polenta frita. Depois de experimentar, a polenta extra não vai ser mais opção! Porção com 6 pedaços.',
      consumo: { polenta: 1 }, ativo: true, destaque: '' },
    { id: 'salada-de-maionese', nome: 'Salada de maionese', preco: 14, img: 'img/maionese.jpg',
      desc: 'Porção perfeita para um almoço. Salada fresquinha feita no dia, com cebola e salsinha trituradas e temperada com carinho! Porção de 500 g.',
      consumo: { maionese: 1 }, ativo: true, destaque: 'Feita no dia' }
  ];

  const CONFIG_PADRAO = {
    nome: 'Frangos & Assados',
    whatsapp: '555134796365',
    telefone: '(51) 3479-6365',
    instagram: 'frangoseassados',
    endereco: 'Endereço da loja (a confirmar)',
    horaInicio: '07:00',      // horário da loja
    horaFim: '13:00',
    retiradaInicio: '11:00',  // horário em que os pedidos do site podem ser retirados
    retiradaFim: '13:00',
    antecedenciaMin: 30
  };

  /* ---------- utilidades ---------- */
  const pad = n => String(n).padStart(2, '0');
  const dataISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const num = v => (Math.round(v * 10) / 10).toLocaleString('pt-BR');
  const uid = () => Math.random().toString(36).slice(2, 9);

  /* gerador fixo para os dados de exemplo sempre saírem iguais */
  function aleatorio(seed) {
    let s = seed;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  function horaAleatoria(r) {
    // pico entre 10h30 e 12h30
    const pesos = [[7, 2], [8, 4], [9, 7], [10, 12], [11, 18], [12, 14]];
    const total = pesos.reduce((a, p) => a + p[1], 0);
    let x = r() * total;
    for (const [h, p] of pesos) { if ((x -= p) <= 0) return `${pad(h)}:${r() < 0.5 ? '00' : '30'}`; }
    return '11:00';
  }

  function consumoDe(itens, produtos) {
    const c = {};
    itens.forEach(it => {
      const p = produtos.find(x => x.id === it.pid);
      if (!p) return;
      Object.entries(p.consumo).forEach(([k, v]) => { c[k] = (c[k] || 0) + v * it.qtd; });
    });
    return c;
  }

  /* ---------- dados de exemplo: últimos 8 fins de semana + hoje ---------- */
  function gerarExemplo() {
    const r = aleatorio(20061);
    const produtos = JSON.parse(JSON.stringify(PRODUTOS_PADRAO));
    const pedidos = [], movs = [];
    let codigo = 1000;
    const hoje = new Date(); hoje.setHours(12, 0, 0, 0);

    // dias de fim de semana anteriores (16 dias)
    const dias = [];
    const d = new Date(hoje);
    while (dias.length < 16) {
      d.setDate(d.getDate() - 1);
      if (d.getDay() === 6 || d.getDay() === 0) dias.push(new Date(d));
    }
    dias.reverse();

    const nomes = ['Ana', 'Carlos', 'Juliana', 'Marcos', 'Patrícia', 'Roberto', 'Fernanda', 'Paulo', 'Luciana', 'Diego', 'Sandra', 'Jorge', 'Camila', 'Ricardo', 'Vera', 'Tiago'];

    function simularDia(dia, fatorVenda, fechado, soEncomendas) {
      const iso = dataISO(dia);
      const domingo = dia.getDay() === 0;
      const entradaFrango = domingo ? 90 : 70;
      const motivoEnt = soEncomendas ? 'Produção prevista para ' + (domingo ? 'domingo' : 'sábado') : 'Produção do dia';
      const dataEnt = soEncomendas ? dataISO(new Date()) + 'T08:00' : iso + 'T06:00';
      movs.push({ id: uid(), data: dataEnt, item: 'frango', tipo: 'entrada', qtd: entradaFrango, motivo: motivoEnt });
      movs.push({ id: uid(), data: dataEnt, item: 'polenta', tipo: 'entrada', qtd: domingo ? 170 : 140, motivo: motivoEnt });
      movs.push({ id: uid(), data: dataEnt, item: 'maionese', tipo: 'entrada', qtd: domingo ? 55 : 45, motivo: motivoEnt });

      let frangosVendidos = 0;
      const alvo = entradaFrango * fatorVenda * (0.86 + r() * 0.14);
      while (frangosVendidos < alvo - 1) {
        const itens = [];
        const x = r();
        if (x < 0.62) itens.push({ pid: 'frango-com-polenta', qtd: r() < 0.82 ? 1 : 2 });
        else itens.push({ pid: 'meio-frango-com-polenta', qtd: 1 });
        if (r() < 0.45) itens.push({ pid: 'salada-de-maionese', qtd: r() < 0.8 ? 1 : 2 });
        if (r() < 0.35) itens.push({ pid: 'polenta-extra', qtd: 1 + Math.floor(r() * 3) });
        itens.forEach(it => { const p = produtos.find(p => p.id === it.pid); it.nome = p.nome; it.preco = p.preco; });
        // respeita o estoque do dia: tira o que não tem mais
        const saldoSim = item => movs.filter(m => m.item === item).reduce((a, m) => a + (m.tipo === 'entrada' ? m.qtd : -m.qtd), 0);
        for (let k = itens.length - 1; k >= 0; k--) {
          const ck = consumoDe([itens[k]], produtos);
          if (Object.entries(ck).some(([item, q]) => saldoSim(item) < q + (k === 0 ? 0 : (consumoDe(itens.slice(0, k), produtos)[item] || 0)))) itens.splice(k, 1);
        }
        if (!itens.length || !itens.some(i => i.pid.includes('frango'))) break;
        const c = consumoDe(itens, produtos);
        frangosVendidos += c.frango || 0;
        const site = soEncomendas || r() < 0.3;
        const hora = site ? ['11:00', '11:00', '11:30', '11:30', '11:30', '12:00', '12:00', '12:30'][Math.floor(r() * 8)] : horaAleatoria(r);
        codigo++;
        const ped = {
          id: uid(), codigo, origem: site ? 'site' : 'balcao',
          cliente: site ? nomes[Math.floor(r() * nomes.length)] : 'Balcão', fone: site ? '(51) 9' + Math.floor(1000 + r() * 8999) + '-' + Math.floor(1000 + r() * 8999) : '',
          itens, total: itens.reduce((a, i) => a + i.preco * i.qtd, 0),
          retirada: { data: iso, hora }, obs: '',
          status: fechado ? 'retirado' : (site ? (r() < 0.5 ? 'novo' : 'pronto') : 'retirado'),
          criado: soEncomendas ? dataISO(new Date()) + 'T' + pad(8 + Math.floor(r() * 11)) + ':' + pad(Math.floor(r() * 60)) : iso + 'T' + hora
        };
        pedidos.push(ped);
        Object.entries(c).forEach(([item, q]) => movs.push({ id: uid(), data: ped.criado, item, tipo: 'saida', qtd: q, motivo: site ? 'Pedido do site' : 'Venda no balcão', ref: ped.codigo }));
      }
      if (fechado) {
        // sobra do dia sai como consumo/perda para zerar
        ['frango', 'polenta', 'maionese'].forEach(item => {
          const saldo = movs.filter(m => m.item === item).reduce((a, m) => a + (m.tipo === 'entrada' ? m.qtd : -m.qtd), 0);
          if (saldo > 0) movs.push({ id: uid(), data: iso + 'T13:30', item, tipo: 'saida', qtd: Math.round(saldo * 10) / 10, motivo: 'Sobra do dia (consumo/perda)' });
        });
      }
    }

    dias.forEach((dia, i) => simularDia(dia, 0.82 + (i / 16) * 0.14, true));

    // dia atual (ou próximo sábado) com vendas em andamento
    const atual = new Date(hoje);
    if (atual.getDay() === 6 || atual.getDay() === 0) {
      simularDia(atual, 0.6, false, false);
    } else {
      // durante a semana: produção prevista do sábado lançada e algumas encomendas já feitas
      while (atual.getDay() !== 6) atual.setDate(atual.getDate() + 1);
      simularDia(atual, 0.12, false, true);
    }

    return { versao: 1, config: { ...CONFIG_PADRAO }, produtos, pedidos, movs, proximoCodigo: codigo + 1 };
  }

  /* ---------- carregar / salvar ---------- */
  function carregar() {
    try {
      const s = localStorage.getItem(CHAVE);
      if (s) return JSON.parse(s);
    } catch (e) {}
    const novo = gerarExemplo();
    salvar(novo);
    return novo;
  }
  function salvar(db) { try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch (e) {} }
  function restaurar() { try { localStorage.removeItem(CHAVE); } catch (e) {} return carregar(); }

  function saldo(db, item) {
    return Math.round(db.movs.filter(m => m.item === item).reduce((a, m) => a + (m.tipo === 'entrada' ? m.qtd : -m.qtd), 0) * 10) / 10;
  }

  /* quantas unidades de um produto ainda dá para vender com o estoque atual */
  function disponivel(db, produto, carrinho) {
    const reservado = consumoDe(carrinho || [], db.produtos);
    let max = Infinity;
    Object.entries(produto.consumo).forEach(([item, q]) => {
      const livre = saldo(db, item) - (reservado[item] || 0);
      max = Math.min(max, Math.floor(livre / q + 1e-9));
    });
    return Math.max(0, max);
  }

  function registrarPedido(db, pedido) {
    pedido.id = uid();
    pedido.codigo = db.proximoCodigo++;
    pedido.total = pedido.itens.reduce((a, i) => a + i.preco * i.qtd, 0);
    db.pedidos.push(pedido);
    const c = consumoDe(pedido.itens, db.produtos);
    Object.entries(c).forEach(([item, q]) => db.movs.push({
      id: uid(), data: pedido.criado, item, tipo: 'saida', qtd: q,
      motivo: pedido.origem === 'site' ? 'Pedido do site' : 'Venda no balcão', ref: pedido.codigo
    }));
    salvar(db);
    return pedido;
  }

  function cancelarPedido(db, pedido) {
    if (pedido.status === 'cancelado') return;
    pedido.status = 'cancelado';
    const c = consumoDe(pedido.itens, db.produtos);
    const agora = new Date();
    Object.entries(c).forEach(([item, q]) => db.movs.push({
      id: uid(), data: dataISO(agora) + 'T' + pad(agora.getHours()) + ':' + pad(agora.getMinutes()),
      item, tipo: 'entrada', qtd: q, motivo: 'Pedido cancelado (volta ao estoque)', ref: pedido.codigo
    }));
    salvar(db);
  }

  /* dias de retirada: próximos sábado e domingo (inclui hoje se ainda dá tempo) */
  function diasRetirada(config) {
    const out = [];
    const agora = new Date();
    const [hf, mf] = (config.retiradaFim || config.horaFim).split(':').map(Number);
    const d = new Date(agora); d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14 && out.length < 2; i++) {
      const dia = new Date(d); dia.setDate(d.getDate() + i);
      if (dia.getDay() !== 6 && dia.getDay() !== 0) continue;
      if (i === 0) {
        const limite = new Date(agora); limite.setHours(hf, mf - config.antecedenciaMin, 0, 0);
        if (agora >= limite) continue;
      }
      out.push(dia);
    }
    return out;
  }

  function horariosRetirada(config, dia) {
    const out = [];
    const [hi, mi] = (config.retiradaInicio || config.horaInicio).split(':').map(Number);
    const [hf, mf] = (config.retiradaFim || config.horaFim).split(':').map(Number);
    const agora = new Date();
    const hoje = dataISO(agora) === dataISO(dia);
    for (let m = hi * 60 + mi; m <= hf * 60 + mf - 30; m += 30) {
      if (hoje && m < agora.getHours() * 60 + agora.getMinutes() + config.antecedenciaMin) continue;
      out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
    }
    return out;
  }

  function lojaAberta(config) {
    const a = new Date();
    if (a.getDay() !== 6 && a.getDay() !== 0) return false;
    const m = a.getHours() * 60 + a.getMinutes();
    const [hi, mi] = config.horaInicio.split(':').map(Number);
    const [hf, mf] = config.horaFim.split(':').map(Number);
    return m >= hi * 60 + mi && m < hf * 60 + mf;
  }

  window.CF = {
    ITENS_ESTOQUE, carregar, salvar, restaurar, saldo, disponivel, consumoDe,
    registrarPedido, cancelarPedido, diasRetirada, horariosRetirada, lojaAberta,
    brl, num, dataISO, pad, uid
  };
})();
