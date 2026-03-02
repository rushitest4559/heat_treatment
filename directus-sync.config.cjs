// directus-sync.config.cjs
module.exports = {
  directusUrl: process.env.DIRECTUS_URL || 'http://localhost:8055',
  directusToken: process.env.DIRECTUS_TOKEN, 

  dumpPath: './sync',

  onlyCollections: ['dashboards', 'panels', 'flows', 'folders', 'operations', 'policies', 'presets', 'translations', 'settings', 'roles', 'permissions'], 
};