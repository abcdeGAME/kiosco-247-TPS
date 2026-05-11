// Archivo: api.js
export async function fetchCatalog() {
    try {
        const response = await fetch('./catalogo.json');
        if (!response.ok) {
            throw new Error(`No se pudo cargar el catálogo (Error ${response.status}: ${response.statusText})`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error en fetchCatalog:", error);
        throw error;
    }
}