import React, { useState, useMemo } from 'react';

// TENTATIVE D'IMPORTATION SÉCURISÉE
let CatalogData = { BOIR_CATALOG: [], searchBoirLocal: () => [] };
try {
  // On essaie de charger les données, mais on ne crash pas si ça échoue
  CatalogData = require('../lib/boirCatalog');
} catch (e) {
  console.error("Erreur de chargement du catalogue Boir");
}

const THEME = {
  bg: '#f3efe6',
  card: '#ffffff',
  text: '#452b00',
  muted: '#806c50',
  accent: '#c8956c',
  border: '#e8e1d5',
};

export function Decouvrir() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('Tous');

  // Sécurisation des données
  const catalog = CatalogData?.BOIR_CATALOG || [];
  const searchFn = CatalogData?.searchBoirLocal || (() => []);

  // FILTRAGE ULTRA-SIMPLE (Impossible de crasher)
  const results = useMemo(() => {
    // Si on cherche par texte
    if (query.trim().length >= 2) {
      try { return searchFn(query) || []; } catch(e) { return []; }
    }
    // Si on a choisi un pays
    if (country !== 'Tous') {
      return catalog.filter(w => (w.country || w.c) === country);
    }
    return [];
  }, [query, country, catalog, searchFn]);

  return (
    <div style={{ width: '100%', padding: '0 20px 120px', boxSizing: 'border-box' }}>
      
      {/* 1. TITRE DE TEST (Si tu vois ça, React fonctionne !) */}
      <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
        <h2 style={{ color: THEME.accent, fontFamily: 'serif', margin: 0 }}>Découverte</h2>
        <p style={{ fontSize: '10px', color: THEME.muted }}>{catalog.length} vins chargés</p>
      </div>

      {/* 2. RECHERCHE */}
      <input 
        type="text" 
        value={query} 
        onChange={e => { setQuery(e.target.value); if(e.target.value) setCountry('Tous'); }}
        placeholder="Rechercher un vin..." 
        style={{ 
          width: '100%', padding: '15px', background: THEME.card, 
          border: `1px solid ${THEME.border}`, borderRadius: '12px',
          fontSize: '16px', outline: 'none', marginBottom: '15px', boxSizing: 'border-box'
        }} 
      />

      {/* 3. BOUTONS PAYS (Limité à 3 pour le test) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['Tous', 'France', 'Italie'].map(c => (
          <button key={c} onClick={() => {setCountry(c); setQuery('');}} style={{
            padding: '8px 15px', borderRadius: '20px', border: `1px solid ${THEME.accent}`,
            background: country === c ? THEME.accent : 'transparent',
            color: country === c ? '#fff' : THEME.accent, fontWeight: 'bold'
          }}>
            {c}
          </button>
        ))}
      </div>

      {/* 4. AFFICHAGE DES RÉSULTATS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {results.length > 0 ? (
          results.map((wine, i) => (
            <div key={i} style={{ background: THEME.card, padding: '15px', borderRadius: '12px', border: `1px solid ${THEME.border}` }}>
              <div style={{ fontWeight: 'bold', color: THEME.text }}>{wine.title || wine.t}</div>
              <div style={{ color: THEME.accent, fontSize: '18px', marginTop: '5px' }}>
                {(wine.price || wine.p || 0)}€
              </div>
              <a href={wine.url || wine.u} target="_blank" rel="noreferrer" style={{ 
                display: 'inline-block', marginTop: '10px', color: THEME.accent, fontWeight: 'bold', textDecoration: 'none' 
              }}>
                VOIR SUR BOIR.BE →
              </a>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', color: THEME.muted, padding: '40px 0' }}>
            {query.length < 2 && country === 'Tous' ? "Clique sur 'France' ou 'Italie' pour tester" : "Rien trouvé"}
          </div>
        )}
      </div>
    </div>
  );
}
