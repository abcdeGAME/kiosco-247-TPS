// Archivo: security.js

/* 
  Definición de Autómatas (Regex):
  - NAME_PATTERN: Acepta letras (incluyendo acentos) y espacios. Longitud 3 a 40. Rechaza números y símbolos.
  - LOCATION_PATTERN: Acepta alfanuméricos, espacios, comas, puntos y guiones. Longitud 3 a 60.
*/
const REGEX_PATTERNS = {
    name: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,40}$/,
    location: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,-]{3,60}$/
};

export function validateInput(string, type) {
    // Sanitización inicial: eliminación de espacios en blanco en los extremos
    const sanitizedString = string.trim();
    
    // Ejecución del reconocedor
    const isValid = REGEX_PATTERNS[type].test(sanitizedString);
    
    return {
        isValid: isValid,
        value: sanitizedString
    };
}