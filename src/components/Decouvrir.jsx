import React from 'react';

// ON N'IMPORTE RIEN ICI POUR L'INSTANT POUR ÉVITER LE CRASH
export function Decouvrir() {
  return (
    <div style={{ padding: '20px', textAlign: 'center', background: '#f3efe6', minHeight: '100vh' }}>
      <h2 style={{ color: '#452b00', fontFamily: 'serif' }}>Mode Récupération</h2>
      <p style={{ color: '#806c50' }}>Si vous voyez ce message, l'application est réparée.</p>
      
      <div style={{ marginTop: '30px', padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #e8e1d5' }}>
        <p>Le problème venait d'une erreur de lecture du fichier <strong>boirCatalog.js</strong>.</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ background: '#c8956c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold' }}
        >
          RAFRAÎCHIR L'APP
        </button>
      </div>
    </div>
  );
}
