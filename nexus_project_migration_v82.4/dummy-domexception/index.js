// Use the platform's native DOMException as recommended by the deprecation notice.
module.exports = globalThis.DOMException || Error;
