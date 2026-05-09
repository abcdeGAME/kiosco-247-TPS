// Archivo: api.js
// Exportamos la función para que sea accesible desde otros dominios
export async function fetchCatalog() {
    const response = await fetch('catalogo.json');
    if (!response.ok) {
        throw new Error(`Fallo en la red: Error ${response.status}`);
    }
    return await response.json();
}