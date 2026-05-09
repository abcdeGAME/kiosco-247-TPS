// Archivo: state.js
let cartState = [];

export function getCartState() {
    return cartState;
}

export function loadCartState() {
    const savedState = localStorage.getItem('takeaway_cart_state');
    if (savedState) {
        cartState = JSON.parse(savedState);
    }
    return cartState;
}

export function saveCartState(newState) {
    cartState = newState;
    localStorage.setItem('takeaway_cart_state', JSON.stringify(cartState));
}

export function clearCartState() {
    cartState = [];
    localStorage.removeItem('takeaway_cart_state');
}