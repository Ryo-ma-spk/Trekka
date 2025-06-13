import { useState, useRef, useCallback } from 'react';

interface DragState {
  isDragging: boolean;
  draggedElement: HTMLElement | null;
  draggedData: any;
  startPosition: { x: number; y: number } | null;
  currentPosition: { x: number; y: number } | null;
}

export function useDragAndDrop() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedElement: null,
    draggedData: null,
    startPosition: null,
    currentPosition: null,
  });

  const dragGhost = useRef<HTMLDivElement | null>(null);
  const onDragStart = useRef<((data: any) => void) | null>(null);
  const onDragEnd = useRef<((data: any, target: any) => void) | null>(null);

  // Ghost要素を作成
  const createGhost = useCallback((element: HTMLElement, data: any) => {
    const ghost = element.cloneNode(true) as HTMLElement;
    ghost.style.position = 'fixed';
    ghost.style.top = '-1000px';
    ghost.style.left = '-1000px';
    ghost.style.zIndex = '9999';
    ghost.style.opacity = '0.8';
    ghost.style.transform = 'rotate(5deg) scale(1.1)';
    ghost.style.pointerEvents = 'none';
    ghost.style.boxShadow = '0 25px 50px rgba(102, 126, 234, 0.6)';
    ghost.style.border = '2px solid #667eea';
    
    document.body.appendChild(ghost);
    dragGhost.current = ghost;
    
    return ghost;
  }, []);

  // Ghost要素を削除
  const removeGhost = useCallback(() => {
    if (dragGhost.current) {
      document.body.removeChild(dragGhost.current);
      dragGhost.current = null;
    }
  }, []);

  // Ghost要素の位置を更新
  const updateGhostPosition = useCallback((x: number, y: number) => {
    if (dragGhost.current) {
      dragGhost.current.style.left = `${x - 50}px`;
      dragGhost.current.style.top = `${y - 30}px`;
    }
  }, []);

  // ドラッグ開始
  const handleDragStart = useCallback((
    event: React.MouseEvent | React.PointerEvent,
    element: HTMLElement,
    data: any
  ) => {
    console.log('🎯 Custom drag start:', data);
    
    const startPos = { x: event.clientX, y: event.clientY };
    
    setDragState({
      isDragging: true,
      draggedElement: element,
      draggedData: data,
      startPosition: startPos,
      currentPosition: startPos,
    });

    createGhost(element, data);
    
    // 元の要素を半透明に
    element.style.opacity = '0.3';
    
    onDragStart.current?.(data);
    
    // グローバルイベントリスナーを追加
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    
    event.preventDefault();
  }, [createGhost]);

  // マウス移動
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    const currentPos = { x: event.clientX, y: event.clientY };
    setDragState(prev => ({ ...prev, currentPosition: currentPos }));
    updateGhostPosition(event.clientX, event.clientY);
    
    // ドロップターゲットをハイライト
    const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
    const dropTarget = elementBelow?.closest('[data-drop-target]');
    
    // 全てのハイライトをクリア
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
    
    // 新しいターゲットをハイライト
    if (dropTarget) {
      dropTarget.classList.add('drag-over');
    }
  }, [dragState.isDragging, updateGhostPosition]);

  // ポインター移動
  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!dragState.isDragging) return;
    
    const currentPos = { x: event.clientX, y: event.clientY };
    setDragState(prev => ({ ...prev, currentPosition: currentPos }));
    updateGhostPosition(event.clientX, event.clientY);
    
    // ドロップターゲットをハイライト
    const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
    const dropTarget = elementBelow?.closest('[data-drop-target]');
    
    // 全てのハイライトをクリア
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
    
    // 新しいターゲットをハイライト
    if (dropTarget) {
      dropTarget.classList.add('drag-over');
    }
  }, [dragState.isDragging, updateGhostPosition]);

  // ドラッグ終了
  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    console.log('🎯 Custom drag end');
    
    // ドロップターゲットを見つける
    const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
    const dropTarget = elementBelow?.closest('[data-drop-target]');
    
    if (dropTarget) {
      const targetData = dropTarget.getAttribute('data-drop-target');
      console.log('📍 Drop target found:', targetData);
      onDragEnd.current?.(dragState.draggedData, targetData);
    }
    
    // クリーンアップ
    if (dragState.draggedElement) {
      dragState.draggedElement.style.opacity = '';
    }
    
    removeGhost();
    
    // ハイライトをクリア
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
    
    setDragState({
      isDragging: false,
      draggedElement: null,
      draggedData: null,
      startPosition: null,
      currentPosition: null,
    });
    
    // イベントリスナーを削除
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  }, [dragState, removeGhost, handleMouseMove]);

  // ポインター終了
  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (!dragState.isDragging) return;
    
    console.log('🎯 Custom pointer end');
    
    // ドロップターゲットを見つける
    const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
    const dropTarget = elementBelow?.closest('[data-drop-target]');
    
    if (dropTarget) {
      const targetData = dropTarget.getAttribute('data-drop-target');
      console.log('📍 Drop target found:', targetData);
      onDragEnd.current?.(dragState.draggedData, targetData);
    }
    
    // クリーンアップ
    if (dragState.draggedElement) {
      dragState.draggedElement.style.opacity = '';
    }
    
    removeGhost();
    
    // ハイライトをクリア
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
    
    setDragState({
      isDragging: false,
      draggedElement: null,
      draggedData: null,
      startPosition: null,
      currentPosition: null,
    });
    
    // イベントリスナーを削除
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  }, [dragState, removeGhost, handlePointerMove]);

  // ドラッグ可能要素を作る
  const makeDraggable = useCallback((data: any) => ({
    onMouseDown: (event: React.MouseEvent<HTMLElement>) => {
      handleDragStart(event, event.currentTarget, data);
    },
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      handleDragStart(event, event.currentTarget, data);
    },
    style: {
      cursor: dragState.isDragging ? 'grabbing' : 'grab',
      userSelect: 'none' as const,
      touchAction: 'none' as const,
    }
  }), [handleDragStart, dragState.isDragging]);

  // ドロップターゲットを作る
  const makeDropTarget = useCallback((targetId: string) => ({
    'data-drop-target': targetId,
  }), []);

  return {
    dragState,
    makeDraggable,
    makeDropTarget,
    setDragStartHandler: (handler: (data: any) => void) => {
      onDragStart.current = handler;
    },
    setDragEndHandler: (handler: (data: any, target: any) => void) => {
      onDragEnd.current = handler;
    },
  };
}