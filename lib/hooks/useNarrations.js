import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNarrations, addNarration, updateNarration, deleteNarration, clearNarrations } from '@/lib/stores/narrationSlice';

export const useNarrations = () => {
  const dispatch = useDispatch();
  const { narrations, isLoading, error } = useSelector((state) => state.narrations);

  useEffect(() => {
    dispatch(fetchNarrations());
  }, [dispatch]);

  return {
    narrations,
    isLoading,
    error,
    addNarration: (narration) => dispatch(addNarration(narration)),
    updateNarration: (id, updatedData) => dispatch(updateNarration({ id, updatedData })),
    deleteNarration: (id) => dispatch(deleteNarration(id)),
    clearNarrations: () => dispatch(clearNarrations()),
    refetch: () => dispatch(fetchNarrations()),
  };
};
