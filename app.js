// 1. ESTRUCTURAS DE DATOS EN MEMORIA (Estado - Dominio Kiosco 24/7)

const catalogProducts = [

    { 

        id: "PROD-K01", 

        name: "Alfajor Triple Terrabusi", 

        description: "Clásico alfajor de chocolate relleno de abundante dulce de leche.", 

        price: 1200 

    },

    { 

        id: "PROD-K02", 

        name: "Yerba Mate Playadito 500g", 

        description: "Yerba mate suave con palo, paquete de medio kilo.", 

        price: 3500 

    },

    { 

        id: "PROD-K03", 

        name: "Galletitas Don Satur", 

        description: "Bizcochitos clásicos dulces o salados, el acompañamiento perfecto para el mate.", 

        price: 1500 

    },

    { 

        id: "PROD-K04", 

        name: "Bebida Energizante Speed 250ml", 

        description: "Lata de bebida energizante para mantener la concentración y combatir la fatiga.", 

        price: 1800 

    },

    { 

        id: "PROD-K05", 

        name: "Encendedor Bic Clásico", 

        description: "Encendedor a gas de tamaño estándar, colores surtidos.", 

        price: 900 

    },

    { 

        id: "PROD-K06", 

        name: "Coca-Cola Zero 250ml", 

        description: "Gaseosa refrescante sin azúcar en envase pequeño.", 

        price: 1500 

    },

    { 

        id: "PROD-K07", 

        name: "Coca-Cola Original 250ml", 

        description: "El sabor clásico de Coca-Cola en envase pequeño.", 

        price: 1500 

    },

    { 

        id: "PROD-K08", 

        name: "Chicles Beldent", 

        description: "Chicles sabor menta o frutas para refrescar el aliento.", 

        price: 800 

    },

    { 

        id: "PROD-K09", 

        name: "Cigarrillos Marlboro (12)", 

        description: "Atado de 12 cigarrillos clásicos.", 

        price: 3200 

    },

    { 

        id: "PROD-K10", 

        name: "Preservativos Prime Ultrafino (3)", 

        description: "Caja de 3 unidades de látex ultrafinos para máxima sensibilidad.", 

        price: 2800 

    },

    { 

        id: "PROD-K11", 

        name: "Zyn Nicotine Pouches", 

        description: "Bolsitas de nicotina sin tabaco, diversas variedades.", 

        price: 5500 

    }

];



let cartState = [];

// 2. INICIALIZACIÓN (Bootstrap)
function initializeCatalog() {
    const catalogGrid = document.querySelector('.catalog-grid');
    catalogGrid.innerHTML = '';
    catalogProducts.forEach(product => {
        const productHTML = `
            <article class="product-node" data-product-id="${product.id}">
              <header><h3 class="product-name">${product.name}</h3></header>
              <div class="product-description"><p>${product.description}</p></div>
              <footer class="product-actions">
                <data class="product-price" value="${product.price}">$${product.price}</data>
                <button type="button" class="btn-add-to-cart" aria-label="Agregar ${product.name} al pedido">Agregar al Carrito</button>
              </footer>
            </article>
        `;
        catalogGrid.insertAdjacentHTML('beforeend', productHTML);
    });

    // === NUEVO: RECUPERACIÓN DE ESTADO ===
    // Intentamos leer el disco duro buscando una sesión previa
    const savedState = localStorage.getItem('takeaway_cart_state');

    // Si existe información guardada, reconstruimos el autómata
    if (savedState) {
        cartState = JSON.parse(savedState); // Deserializamos la cadena de texto a un Arreglo real
        syncCartDOM(); // Invocamos el transductor para proyectar este estado recuperado en la Vista
        console.log("Estado previo del autómata restaurado con éxito.");
    }
}
document.addEventListener('DOMContentLoaded', initializeCatalog);

// 3. OBSERVADOR CENTRAL: CATÁLOGO (Agregar al carrito)
document.querySelector('.catalog-grid').addEventListener('click', function(event) {
    if (event.target.classList.contains('btn-add-to-cart')) {
        const productId = event.target.closest('.product-node').getAttribute('data-product-id');
        mutateCartState(productId);
    }
});

function mutateCartState(productId) {
    const referenceProduct = catalogProducts.find(prod => prod.id === productId);
    if (!referenceProduct) return;

    const existingIndex = cartState.findIndex(item => item.productRef === productId);
    if (existingIndex !== -1) {
        cartState[existingIndex].quantity += 1;
        cartState[existingIndex].subtotal = cartState[existingIndex].quantity * referenceProduct.price;
    } else {
        cartState.push({
            idNode: `ITEM-${Date.now()}`,
            productRef: productId,
            name: referenceProduct.name,
            quantity: 1,
            subtotal: referenceProduct.price
        });
    }
    syncCartDOM();
}

// 4. OBSERVADOR CENTRAL: CARRITO (Mutación Interna)
document.querySelector('.cart-item-list').addEventListener('click', function(event) {
    const clickedElement = event.target;
    const cartItemNode = clickedElement.closest('.cart-item-node');
    if (!cartItemNode) return; 

    const transactionId = cartItemNode.getAttribute('data-cart-item-id');

    if (clickedElement.classList.contains('btn-increase')) modifyItemQuantity(transactionId, 1);
    else if (clickedElement.classList.contains('btn-decrease')) modifyItemQuantity(transactionId, -1);
    else if (clickedElement.classList.contains('btn-remove-node')) removeTransactionNode(transactionId);
});

function modifyItemQuantity(transactionId, delta) {
    const item = cartState.find(item => item.idNode === transactionId);
    if (!item) return;
    const referenceProduct = catalogProducts.find(prod => prod.id === item.productRef);
    
    item.quantity += delta;
    if (item.quantity <= 0) {
        removeTransactionNode(transactionId);
    } else {
        item.subtotal = item.quantity * referenceProduct.price;
        syncCartDOM();
    }
}

function removeTransactionNode(transactionId) {
    cartState = cartState.filter(item => item.idNode !== transactionId);
    syncCartDOM();
}

// 5. TRANSDUCTOR: SINCRONIZACIÓN DOM (Single Source of Truth)
function syncCartDOM() {
    const cartListContainer = document.querySelector('.cart-item-list');
    cartListContainer.innerHTML = '';
    let totalItems = 0;
    let totalPrice = 0;

    cartState.forEach(item => {
        totalItems += item.quantity;
        totalPrice += item.subtotal;
        const nodeHTML = `
            <li class="cart-item-node" data-cart-item-id="${item.idNode}">
              <span class="item-name">${item.name}</span>
              <div class="item-quantity-controls">
                <button type="button" class="btn-decrease">-</button>
                <output class="item-quantity">${item.quantity}</output>
                <button type="button" class="btn-increase">+</button>
              </div>
              <data class="item-subtotal" value="${item.subtotal}">$${item.subtotal}</data>
              <button type="button" class="btn-remove-node">Eliminar</button>
            </li>
        `;
        cartListContainer.insertAdjacentHTML('beforeend', nodeHTML);
    });

    document.getElementById('cart-counter').textContent = totalItems;
    const totalOutput = document.querySelector('.cart-total-value');
    totalOutput.value = totalPrice;
    totalOutput.textContent = `$${totalPrice}`;

    const checkoutBtn = document.querySelector('.btn-checkout');
    if (cartState.length === 0) checkoutBtn.setAttribute('disabled', 'true');
    else checkoutBtn.removeAttribute('disabled');

    // === NUEVO: PERSISTENCIA DE ESTADO ===
    // Convertimos la estructura discreta a JSON y la escribimos en disco ($O(1)$)
    localStorage.setItem('takeaway_cart_state', JSON.stringify(cartState));
}

// ==========================================
// MÓDULO: CIERRE DE TRANSACCIÓN (Checkout)
// ==========================================

// 1. Identificamos el nodo de salida (El gatillo)
const checkoutButtonObserver = document.querySelector('.btn-checkout');

// 2. Interceptamos la señal de confirmación
checkoutButtonObserver.addEventListener('click', function() {
    
    // Guard Clause (Cláusula de seguridad): Si el sistema está vacío, abortamos.
    // Aunque el botón esté 'disabled' en el HTML, esta es una validación de backend.
    if (cartState.length === 0) return;

    // 3. Compilación del Payload (Serialización de Estructuras)
    // Transformamos la Lista Dinámica en una cadena de texto estructurada.
    let orderPayload = "Hola, me gustaría confirmar el siguiente pedido:\n\n";

    // Iteramos sobre las variables discretas del arreglo para construir el detalle
    cartState.forEach(item => {
        orderPayload += `▪ ${item.quantity}x ${item.name} ($${item.subtotal})\n`;
    });

    // Calculamos la sumatoria final basándonos en la Única Fuente de Verdad
    const grandTotal = cartState.reduce((acc, item) => acc + item.subtotal, 0);
    orderPayload += `\n*Total a Pagar: $${grandTotal}*`;

    // 4. Interfaz de Comunicación (API Gateway)
    // Definimos el número de destino (Asegúrate de incluir el código de país, ej: 54 para Argentina)
    const phoneNumber = "5493718502710"; 
    
    // Codificamos el texto para que los espacios y saltos de línea sean válidos en una URL (URI Encoding)
    const encodedPayload = encodeURIComponent(orderPayload);
    
    // Construimos la petición GET hacia el límite del sistema externo
    const gatewayURL = `https://wa.me/${phoneNumber}?text=${encodedPayload}`;

    // 5. Ejecución: Abrimos la conexión en una nueva pestaña
    window.open(gatewayURL, '_blank');

    // 6. Purga del Sistema (Opcional pero recomendado)
    // Una vez que la transacción abandona nuestro TPS, destruimos el estado local
    // para preparar la máquina para un nuevo Actor.
    cartState = [];
    localStorage.removeItem('takeaway_cart_state');
    syncCartDOM();
});