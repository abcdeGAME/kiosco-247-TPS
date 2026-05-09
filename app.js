// Archivo: app.js
import { fetchCatalog } from './api.js';
import { getCartState, loadCartState, saveCartState, clearCartState } from './state.js';
import { validateInput } from './security.js';

let catalogProducts = [];
let currentCategory = 'all';
let currentSearchTerm = '';
let isNameValid = false;

// 1. BOOTSTRAP DEL SISTEMA
async function initializeSystem() {
    try {
        console.log("Inicializando sistema...");
        catalogProducts = await fetchCatalog();
        console.log("Catálogo cargado:", catalogProducts);
        
        renderCatalog(catalogProducts);
        
        loadCartState(); 
        syncCartDOM();   
        
        setupEventListeners();
    } catch (error) {
        console.error("Error crítico al inicializar:", error);
    }
}

// 2. RENDERIZADO DEL CATÁLOGO
function renderCatalog(productsToRender) {
    const catalogGrid = document.querySelector('.catalog-grid');
    if (!catalogGrid) {
        console.error("No se encontró el contenedor .catalog-grid");
        return;
    }
    
    catalogGrid.innerHTML = '';
    
    if (productsToRender.length === 0) {
        catalogGrid.innerHTML = '<p class="empty-state">No se encontraron productos que coincidan con la búsqueda.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const productHTML = `
            <article class="product-node" data-product-id="${product.id}">
              <header><h3 class="product-name">${product.name}</h3></header>
              <div class="product-description"><p>${product.description}</p></div>
              <footer class="product-actions">
                <data class="product-price" value="${product.price}">$${product.price}</data>
                <button type="button" class="btn-add-to-cart">Agregar al Carrito</button>
              </footer>
            </article>
        `;
        catalogGrid.insertAdjacentHTML('beforeend', productHTML);
    });
}

function applyFilters() {
    let filteredData = catalogProducts;

    if (currentCategory !== 'all') {
        filteredData = filteredData.filter(item => item.category === currentCategory);
    }

    if (currentSearchTerm !== '') {
        const lowerCaseTerm = currentSearchTerm.toLowerCase();
        filteredData = filteredData.filter(item => 
            item.name.toLowerCase().includes(lowerCaseTerm) || 
            item.description.toLowerCase().includes(lowerCaseTerm)
        );
    }

    renderCatalog(filteredData);
}

// 3. EVENT LISTENERS Y LÓGICA DE INTERACCIÓN
function setupEventListeners() {
    // OBSERVADOR DE INSERCIÓN (Delegación de Eventos)
    const catalogGrid = document.querySelector('.catalog-grid');
    if (catalogGrid) {
        catalogGrid.addEventListener('click', (e) => {
            // Verificamos si el clic provino exactamente del botón de agregar
            if (e.target.classList.contains('btn-add-to-cart')) {
                // Escalamiento en el árbol DOM para obtener el nodo del producto
                const productNode = e.target.closest('.product-node');
                const targetId = productNode.getAttribute('data-product-id');
                
                // Disparamos la lógica de transacción
                processCartInsertion(targetId);
            }
        });
    }

    const searchEngine = document.getElementById('search-engine');
    if (searchEngine) {
        searchEngine.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            applyFilters();
        });
    }

    const filterButtons = document.querySelectorAll('.btn-filter');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.getAttribute('data-category');
            applyFilters();
        });
    });

    const inputName = document.getElementById('actor-name');
    const errorName = document.getElementById('error-name');
    if (inputName) {
        inputName.addEventListener('input', (e) => {
            const check = validateInput(e.target.value, 'name');
            isNameValid = check.isValid;
            
            if (isNameValid) {
                inputName.classList.remove('invalid');
                inputName.classList.add('valid');
                if (errorName) errorName.textContent = '';
            } else {
                inputName.classList.remove('valid');
                inputName.classList.add('invalid');
                if (errorName) errorName.textContent = 'Requiere de 3 a 40 caracteres alfabéticos.';
            }
            evaluateSystemLock();
        });
    }

    const btnCheckout = document.querySelector('.btn-checkout');
    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            if (!isNameValid) return;
            const currentState = getCartState();
            if (currentState.length === 0) return;

            const inputName = document.getElementById('actor-name');
            const finalName = validateInput(inputName.value, 'name').value;

            let orderPayload = `*NUEVA TRANSACCIÓN - KIOSCO 24/7*\n`;
            orderPayload += `Identificador: ${finalName}\n`;
            orderPayload += `--------------------------\n`;

            currentState.forEach(item => {
                orderPayload += `▪ ${item.quantity}x ${item.name}\n`;
            });

            const encodedPayload = encodeURIComponent(orderPayload);
            window.open(`https://wa.me/5491123456789?text=${encodedPayload}`, '_blank');

            clearCartState();
            inputName.value = '';
            isNameValid = false;
            inputName.classList.remove('valid');
            syncCartDOM(); 
            evaluateSystemLock(); 
        });
    }
}

// MOTOR LÓGICO DE TRANSACCIONES
function processCartInsertion(productId) {
    // 1. Extracción de Definición (Base de Conocimiento)
    const productDefinition = catalogProducts.find(p => p.id === productId);
    if (!productDefinition) {
        console.error("Fallo de integridad: Producto no encontrado en el catálogo.");
        return;
    }

    // 2. Extracción de Estado (Memoria Transaccional)
    const currentState = getCartState();

    // 3. Búsqueda Lineal de Colisiones
    const existingNode = currentState.find(item => item.id === productId);

    if (existingNode) {
        // Mutación Algebraica (El producto ya existe, incrementamos cantidad)
        existingNode.quantity += 1;
    } else {
        // Instanciación (El producto es nuevo en el carrito)
        currentState.push({
            id: productDefinition.id,
            name: productDefinition.name,
            price: productDefinition.price,
            quantity: 1
        });
    }

    // 4. Persistencia y Proyección
    saveCartState(currentState); // Sobrescribimos el LocalStorage a través del módulo
    syncCartDOM();               // Renderizamos el carrito
    evaluateSystemLock();        // Auditamos el estado de seguridad OPSEC

    // Gatillo de Telemetría
    emitTelemetrySignal(`✅ ${productDefinition.name} agregado al sistema.`);
}

// MOTOR DE TELEMETRÍA VISUAL
function emitTelemetrySignal(message) {
    const consoleNode = document.getElementById('telemetry-console');
    if (!consoleNode) return;

    // Instanciación del nodo físico
    const signalNode = document.createElement('div');
    signalNode.className = 'toast-node';
    signalNode.textContent = message;
    
    // Inyección en el DOM
    consoleNode.appendChild(signalNode);
    
    // Autodestrucción asíncrona tras 2500 ms
    setTimeout(() => {
        signalNode.remove();
    }, 2500);
}

// OBSERVADOR DE MUTACIÓN INVERSA (Delegación en el Panel del Carrito)
const cartListContainer = document.querySelector('.cart-item-list');

if (cartListContainer) {
    cartListContainer.addEventListener('click', (e) => {
        // Guard Clause: Ignoramos clics que no sean sobre botones
        if (!e.target.matches('button')) return;

        // Extracción de coordenadas
        const targetId = e.target.getAttribute('data-id');
        const currentState = getCartState();
        
        // Búsqueda del índice exacto en memoria
        const itemIndex = currentState.findIndex(item => item.id === targetId);
        if (itemIndex === -1) return; // Anomalía de estado

        // Bifurcación Lógica de la Operación
        if (e.target.classList.contains('btn-qty-plus')) {
            // Incremento Algebraico
            currentState[itemIndex].quantity++;
            
        } else if (e.target.classList.contains('btn-qty-minus')) {
            // Decremento con evaluación de límite inferior
            if (currentState[itemIndex].quantity > 1) {
                currentState[itemIndex].quantity--;
            } else {
                // Si la cantidad llega a 0, ejecutamos la purga del nodo
                currentState.splice(itemIndex, 1);
            }
            
        } else if (e.target.classList.contains('btn-remove-item')) {
            // Purga Absoluta Directa
            currentState.splice(itemIndex, 1);
        }

        // Persistencia y recálculo del estado global del sistema
        saveCartState(currentState);
        syncCartDOM();
        evaluateSystemLock();
    });
}

// ACTUALIZACIÓN DEL DOM DEL CARRITO (Con Controladores de Mutación)
function syncCartDOM() {
    const cartList = document.querySelector('.cart-item-list');
    const displayTotal = document.querySelector('.total-value');
    const currentState = getCartState(); 
    
    if (!cartList || !displayTotal) return;

    cartList.innerHTML = '';
    let transactionTotal = 0; 

    currentState.forEach(item => {
        const nodeSubtotal = item.price * item.quantity;
        transactionTotal += nodeSubtotal;

        const li = document.createElement('li');
        li.className = 'cart-item-node';
        
        // Inyección de la topología de control
        li.innerHTML = `
            <div class="cart-item-info">
                <strong>${item.name}</strong>
                <span>$${item.price} c/u</span>
            </div>
            <div class="cart-item-controls">
                <button type="button" class="btn-qty-minus" data-id="${item.id}">-</button>
                <span class="cart-qty-display">${item.quantity}</span>
                <button type="button" class="btn-qty-plus" data-id="${item.id}">+</button>
            </div>
            <div class="cart-item-total">
                <strong>$${nodeSubtotal}</strong>
                <button type="button" class="btn-remove-item" data-id="${item.id}" aria-label="Eliminar nodo">x</button>
            </div>
        `;
        cartList.appendChild(li);
    });

    displayTotal.textContent = `$${transactionTotal.toFixed(2)}`;

    const btnCheckout = document.querySelector('.btn-checkout');
    if (btnCheckout && currentState.length === 0) {
        btnCheckout.setAttribute('disabled', 'true');
    }
    
    evaluateSystemLock();
}

function evaluateSystemLock() {
    const btnCheckout = document.querySelector('.btn-checkout');
    if (!btnCheckout) return;
    
    const currentState = getCartState();
    if (currentState.length > 0 && isNameValid) {
        btnCheckout.removeAttribute('disabled');
    } else {
        btnCheckout.setAttribute('disabled', 'true');
    }
}

// ARRANQUE
initializeSystem();