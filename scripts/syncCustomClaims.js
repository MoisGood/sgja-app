#!/usr/bin/env node

/**
 * Script: Sincronizar Custom Claims (VERSIÓN LOCAL - Sin Cloud Functions)
 * Ejecutar: node scripts/syncCustomClaims.js
 * 
 * NOTA: Esta versión no requiere plan Blaze ni Cloud Functions deployadas.
 * Usa Firebase Admin SDK para establecer Custom Claims directamente.
 */

require('./setCustomClaimsLocal.js');
