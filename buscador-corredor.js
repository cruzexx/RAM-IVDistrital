document.addEventListener('DOMContentLoaded', function () {
  var QUERY_KEY = 'buscar';
  var contenedor = document.getElementById('ram-contenedor');
  var encabezado = document.getElementById('encabezado-ram');
  var input = document.getElementById('buscador-corredor');
  var mensajeSinResultados = document.getElementById('mensaje-sin-resultados');
  var resultadosBusqueda = document.getElementById('resultados-busqueda-vertical');

  if (!contenedor || !encabezado || !input || !mensajeSinResultados || !resultadosBusqueda) {
    return;
  }

  var tarjetas = Array.from(contenedor.children).filter(function (elemento) {
    return (
      elemento !== encabezado &&
      elemento !== mensajeSinResultados &&
      elemento !== resultadosBusqueda &&
      elemento.tagName === 'DIV'
    );
  });

  function normalizarTexto(texto) {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function escaparHtml(texto) {
    return String(texto || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function extraerCorredor(tarjeta) {
    var bloquePrincipal = tarjeta.firstElementChild;
    if (!bloquePrincipal) {
      return null;
    }

    var numeroEl = bloquePrincipal.firstElementChild;
    var bloqueTexto = bloquePrincipal.children[1];
    var nombreEl = bloqueTexto ? bloqueTexto.firstElementChild : null;
    var categoriaEl = bloqueTexto ? bloqueTexto.children[1] : null;
    var bloqueMangas = tarjeta.children[1];

    var mangas = [];
    if (bloqueMangas) {
      mangas = Array.from(bloqueMangas.children)
        .map(function (item) {
          var etiquetaEl = item.children && item.children[0] ? item.children[0] : null;
          var valorEl = item.children && item.children[1] ? item.children[1] : null;

          if (!etiquetaEl || !valorEl) {
            return null;
          }

          return {
            etiqueta: etiquetaEl.textContent.trim(),
            valor: valorEl.textContent.replace(/\s+/g, ' ').trim()
          };
        })
        .filter(function (manga) {
          return manga !== null;
        });
    }

    var numero = numeroEl ? numeroEl.textContent.trim() : '';
    var nombre = nombreEl ? nombreEl.textContent.trim() : '';
    var categoria = categoriaEl ? categoriaEl.textContent.trim() : '';

    return {
      element: tarjeta,
      numero: numero,
      nombre: nombre,
      categoria: categoria,
      mangas: mangas,
      numeroNorm: normalizarTexto(numero),
      nombreNorm: normalizarTexto(nombre)
    };
  }

  var corredores = tarjetas
    .map(extraerCorredor)
    .filter(function (corredor) {
      return corredor !== null;
    });

  function crearTarjetaVertical(corredor) {
    var card = document.createElement('article');
    card.style.cssText = [
      'display: flex',
      'flex-direction: column',
      'border: 1px solid #dbe3ea',
      'border-radius: 14px',
      'padding: 16px',
      'background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
      'box-shadow: 0 8px 24px rgba(29,53,87,0.08)'
    ].join('; ');

    var mangasHtml = corredor.mangas.map(function (manga) {
      return [
        '<div style="border: 1px solid #e6edf4; border-radius: 10px; padding: 10px 12px; background-color: #ffffff;">',
        '  <div style="font-size: 11px; color: #6c757d; font-weight: 700; letter-spacing: 0.4px;">' + escaparHtml(manga.etiqueta) + '</div>',
        '  <div style="font-size: 24px; color: #1d3557; font-weight: 900; line-height: 1.1; margin-top: 3px;">' + escaparHtml(manga.valor) + '</div>',
        '</div>'
      ].join('');
    }).join('');

    card.innerHTML = [
      '<div style="display: flex; justify-content: center; margin-bottom: 12px;">',
      '  <div style="min-width: 110px; text-align: center; font-size: 36px; font-weight: 900; color: #1d3557; background-color: #eef4fa; border: 1px solid #d6e0ea; border-radius: 12px; padding: 12px 14px;">' + escaparHtml(corredor.numero) + '</div>',
      '</div>',
      '<div style="text-align: center; font-size: 24px; font-weight: 800; color: #212529; line-height: 1.15; margin-bottom: 8px;">' + escaparHtml(corredor.nombre) + '</div>',
      '<div style="text-align: center; font-size: 12px; font-weight: 700; color: #6c757d; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 14px;">' + escaparHtml(corredor.categoria) + '</div>',
      '<div style="display: grid; gap: 10px;">' + mangasHtml + '</div>'
    ].join('');

    return card;
  }

  function renderizarResultadosVertical(coincidencias) {
    resultadosBusqueda.innerHTML = '';

    if (coincidencias.length === 0) {
      resultadosBusqueda.style.display = 'none';
      return;
    }

    resultadosBusqueda.style.display = 'grid';

    var resumen = document.createElement('div');
    resumen.style.cssText = 'grid-column: 1 / -1; text-align: center; color: #1d3557; font-weight: 800; font-size: 14px; letter-spacing: 0.3px; margin-bottom: 2px;';
    resumen.textContent = coincidencias.length + ' resultado' + (coincidencias.length === 1 ? '' : 's') + ' de busqueda';
    resultadosBusqueda.appendChild(resumen);

    coincidencias.forEach(function (corredor) {
      resultadosBusqueda.appendChild(crearTarjetaVertical(corredor));
    });
  }

  function filtrarCorredores() {
    var termino = normalizarTexto(input.value);

    if (!termino) {
      corredores.forEach(function (corredor) {
        corredor.element.style.display = 'flex';
      });
      resultadosBusqueda.style.display = 'none';
      resultadosBusqueda.innerHTML = '';
      mensajeSinResultados.style.display = 'none';
      return;
    }

    var coincidencias = corredores.filter(function (corredor) {
      return (
        corredor.numeroNorm.indexOf(termino) !== -1 ||
        corredor.nombreNorm.indexOf(termino) !== -1
      );
    });

    corredores.forEach(function (corredor) {
      corredor.element.style.display = 'none';
    });

    renderizarResultadosVertical(coincidencias);
    mensajeSinResultados.style.display = coincidencias.length === 0 ? 'block' : 'none';
  }

  function actualizarQueryParam(valor) {
    var url = new URL(window.location.href);
    if (valor) {
      url.searchParams.set(QUERY_KEY, valor);
    } else {
      url.searchParams.delete(QUERY_KEY);
    }

    var nuevaUrl = url.pathname;
    var query = url.searchParams.toString();
    if (query) {
      nuevaUrl += '?' + query;
    }
    if (url.hash) {
      nuevaUrl += url.hash;
    }

    window.history.replaceState(null, '', nuevaUrl);
  }

  var valorInicial = new URL(window.location.href).searchParams.get(QUERY_KEY);
  if (valorInicial) {
    input.value = valorInicial;
  }

  filtrarCorredores();

  input.addEventListener('input', function () {
    actualizarQueryParam(input.value.trim());
    filtrarCorredores();
  });
});
