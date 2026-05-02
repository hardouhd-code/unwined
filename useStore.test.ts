import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';

describe('Wine Store (Zustand)', () => {
  beforeEach(() => {
    useStore.setState({ db: [], userName: '', user: null });
  });

  it('should initialize with an empty database', () => {
    const state = useStore.getState();
    expect(state.db).toEqual([]);
    expect(state.userName).toBe('');
  });

  it('should add a wine to the database', () => {
    const newWine = {
      id: '123',
      type: 'red',
      producer: 'Château Test',
      addedAt: Date.now()
    };
    
    useStore.getState().addWine(newWine as any);
    
    const state = useStore.getState();
    expect(state.db).toHaveLength(1);
    expect(state.db[0].producer).toBe('Château Test');
  });

  it('should update a wine in the database', () => {
    const initialWine = {
      id: '456',
      type: 'white',
      quantity: 1
    };
    
    useStore.getState().setDb([initialWine as any]);
    
    // Update quantity
    useStore.getState().updateWine('456', { quantity: 5 });
    
    const state = useStore.getState();
    expect(state.db[0].quantity).toBe(5);
  });

  it('should delete a wine from the database', () => {
    const wineToKeep = { id: '1' };
    const wineToDelete = { id: '2' };
    
    useStore.getState().setDb([wineToKeep as any, wineToDelete as any]);
    
    useStore.getState().deleteWine('2');
    
    const state = useStore.getState();
    expect(state.db).toHaveLength(1);
    expect(state.db[0].id).toBe('1');
  });
});
