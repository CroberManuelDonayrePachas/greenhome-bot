// ==UserScript==
// @name         Green Home Bot
// @namespace    http://tampermonkey.net/
// @version      6.9
// @description  Recolector automático con cambio de árbol, notificación al celular y ajuste manual de árboles 🌳
// @author       Crober Manuel Donayre
// @match        https://greenearths.pe/h5/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=greenearths.pe
// @grant        none
// ==/UserScript==


(function () {
  'use strict';

  // ⚙️ Configuración principal
  const INTERVALO_RECOLECCION = 10000; // tiempo entre recolecciones
  const TIEMPO_CAMBIO_ARBOL = 30; // segundos para cambiar de árbol
  const SONIDO_RECOLECCION = new Audio('https://www.myinstants.com/media/sounds/coin.mp3');
let selectorRecolector = '.fullpic, .fs13.gui-bold, ._box'; // ✅ Selector combinado para detectar árboles listos

  // 📊 Variables de control
  let ultimoValorPorElemento = {};
  let totalRecolectado = 0;
  let cronometroIntervalo;
  let arbolActual = 1;
  let TOTAL_ARBOL = 3; // valor inicial, puede ser actualizado por el botón
  let direccion = 'right';
  let intervaloRecoleccionID;

  // 📲 Enviar mensaje a celular vía Pushover
  function enviarPushover(arbolId, kg) {
    fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'a9siztj3wjjbrzvnxf6686prhvwxk1',
        user: 'ugqthubi36iojuamd4wikcgvh9ck31',
        message: `👋 Hola Manuel Antonio Donayre Perez, tu Árbol ${arbolId} recolectó ${kg.toFixed(2)}kg ✅` // Mensaje de Texto Actualizarlo
      })
    }).then(r => r.json())
      .then(data => console.log('✅ Pushover enviado:', data))
      .catch(error => console.error('❌ Error Pushover:', error));
  }

  // 🔁 Recolectar árboles automáticamente
  function recolectar() {
  const elementos = Array.from(document.querySelectorAll(selectorRecolector)).filter(el =>
    el.offsetParent !== null &&
    el.textContent.includes('kg') &&
    parseFloat(el.textContent.replace(',', '.')) >= 0.005
  );

  // 🧠 Detectar número de árbol visible (ej. Árbol 2 de 5)
  const etiqueta = [...document.querySelectorAll('uni-text')].find(el => el.textContent.includes('Árbol'));
  let numeroArbolVisible = arbolActual; // por defecto
  if (etiqueta) {
    const encontrado = etiqueta.textContent.match(/Árbol\s*(\d+)/);
    if (encontrado) {
      numeroArbolVisible = parseInt(encontrado[1]);
    }
  }

  elementos.forEach((el, i) => {
    const texto = el.textContent.trim();
    const valor = parseFloat(texto.replace(',', '.').replace(/[^\d.]/g, ''));

    const id = `Árbol ${numeroArbolVisible}`; // ✅ Usamos el número real del árbol visible

    if (!isNaN(valor) && valor < 20 && ultimoValorPorElemento[id + '_' + i] !== valor) {
      const contenedor = el.closest('.en_itm') || el.closest('uni-view');

      if (contenedor && typeof contenedor.click === 'function') {
        contenedor.click();
        SONIDO_RECOLECCION.play().catch(() => {});
        ultimoValorPorElemento[id + '_' + i] = valor;
        totalRecolectado += valor;
        mostrarBurbuja(`👋 Hola Manuel Antonio Donayre Perez, tu ${id} recolectó ${valor.toFixed(2)} kg ✅`); // Nombre Personalizado ✅✅✅
        enviarPushover(id, valor);
      } else {
        console.warn('⚠️ No se encontró contenedor clickeable para:', el);
      }
    }
  });
}


  // 🔄 Cambiar de árbol con dirección automática
  function cambiarArbol() {
    if (arbolActual >= TOTAL_ARBOL) direccion = 'left';
    else if (arbolActual <= 1) direccion = 'right';

    let boton = null;
    if (direccion === 'right') {
      boton = document.querySelector('uni-view.nex1t_r > uni-text.gui-icons.gui-block.gui-color-green.gui-text.fs30');
      arbolActual++;
    } else {
      const flecha = [...document.querySelectorAll('uni-text span')].find(span => span.textContent === '');
      if (flecha) boton = flecha.closest('uni-text');
      arbolActual--;
    }

    if (boton) boton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    iniciarCronometro();
  }

  // ⏱ Mostrar cronómetro de cambio de árbol
  function iniciarCronometro() {
    let tiempo = TIEMPO_CAMBIO_ARBOL;
    const cronometro = document.createElement('div');
    Object.assign(cronometro.style, {
      position: 'fixed', bottom: '10px', right: '20px', backgroundColor: '#f39c12',
      color: 'white', padding: '10px 16px', borderRadius: '10px', fontSize: '18px',
      zIndex: '9999', fontWeight: 'bold'
    });
    document.body.appendChild(cronometro);

    cronometro.innerText = `⏱ Cambiar árbol en: ${tiempo}s`;
    cronometroIntervalo = setInterval(() => {
      tiempo--;
      cronometro.innerText = `⏱ Cambiar árbol en: ${tiempo}s`;
      if (tiempo <= 0) {
        clearInterval(cronometroIntervalo);
        cronometro.remove();
        cambiarArbol();
      }
    }, 1000);
  }

  // 🔔 Mostrar burbuja flotante de estado
  function mostrarBurbuja(mensaje) {
    const burbuja = document.createElement('div');
    burbuja.innerHTML = mensaje;
    Object.assign(burbuja.style, {
      position: 'fixed', bottom: '300px', right: '20px', backgroundColor: '#3498db',
      color: 'white', padding: '10px 16px', borderRadius: '10px', fontSize: '15px',
      zIndex: '9999', fontWeight: 'bold', boxShadow: '0 0 10px rgba(0,0,0,0.2)'
    });
    document.body.appendChild(burbuja);
    setTimeout(() => burbuja.remove(), 7000);
  }

  // ➕ Botón para ajustar la cantidad de árboles
  function crearBotonActualizarArboles() {
    const boton = document.createElement('button');
    boton.innerText = '🌳 Ajustar árboles';
    Object.assign(boton.style, {
      position: 'fixed', bottom: '180px', right: '20px', padding: '12px 20px',
      backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '12px',
      fontSize: '16px', cursor: 'pointer', zIndex: '2147483647', fontWeight: 'bold',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)', marginBottom: '60px'
    });

    boton.onclick = () => {
      const nuevoTotal = prompt('🌳 Ingresa la nueva cantidad de árboles:');
      const numero = parseInt(nuevoTotal);
      if (!isNaN(numero) && numero > 0) {
        TOTAL_ARBOL = numero;
        mostrarBurbuja(`✅ Total de árboles actualizado a ${TOTAL_ARBOL}`);
        console.log(`✅ NUEVO: TOTAL_ARBOL ahora es ${TOTAL_ARBOL}`);
      } else {
        mostrarBurbuja('❌ Valor inválido. No se actualizó.');
      }
    };

    document.body.appendChild(boton);
  }

  // 🚀 Iniciar el bot automáticamente al cargar
  function iniciarBot() {
    mostrarBurbuja("✅ BOT ACTIVADO 🌱");
    intervaloRecoleccionID = setInterval(recolectar, INTERVALO_RECOLECCION);
    iniciarCronometro();
  }

  // ✅ Lanzamiento
  iniciarBot();
  crearBotonActualizarArboles(); // Agrega el botón flotante para cambiar el total de árboles
})();
