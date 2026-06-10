const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite sur web (wa-sqlite) : le binaire wasm doit être servi comme asset.
config.resolver.assetExts.push('wasm');

// La persistance SQLite web (OPFS) exige l'isolation cross-origin. Le serveur
// de dev Metro pose les en-têtes ici ; un hébergeur statique de production
// devra poser les mêmes en-têtes COOP/COEP.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  middleware(req, res, next);
};

module.exports = config;
