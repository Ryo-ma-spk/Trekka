import { useState, useEffect } from 'react';
import { Plus, FolderPlus, LogOut } from 'lucide-react';
import { TaskGroup } from './components/TaskGroup';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { AuthForm } from './components/AuthForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTasks } from './hooks/useTasks';
import type { Task } from './types';
import './App.css';

function TodoApp() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { tasks, loading, error, setError, setTasks, fetchTasks, createTasks, updateTaskLabel, updateTaskLabelOptimistic, moveTaskToPosition, moveTaskToGroupPosition, reorderTasksInGroup, updateTask, deleteTask, getTaskGroups, reorderGroups, createEmptyLabel, renameLabel, deleteLabel } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultLabel, setDefaultLabel] = useState<string>('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGroupDragging, setIsGroupDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dropPreview, setDropPreview] = useState<{ groupLabel: string; index: number } | null>(null);

  // キーボードショートカットとドラッグイベント
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + N で新しいタスク作成
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault();
        setDefaultLabel('');
        setIsModalOpen(true);
      }
      // Escape でモーダルを閉じる
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        setIsEditModalOpen(false);
        setEditingTask(null);
        setDefaultLabel('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggedTask, isGroupDragging, draggedGroup]);

  // Trello風マウスベースドラッグ&ドロップ
  const handleMouseDown = (e: React.MouseEvent, task: Task) => {
    // 編集ボタンがクリックされた場合はドラッグしない
    if ((e.target as HTMLElement).closest('.task-actions')) {
      return;
    }

    console.log('🎯 Mouse down on task:', task.title);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setMousePos({ x: e.clientX, y: e.clientY });
    setDraggedTask(task);
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if ((!isDragging || !draggedTask) && (!isGroupDragging || !draggedGroup)) return;
    
    setMousePos({ x: e.clientX, y: e.clientY });
    
    // タスクドラッグ中のドロップ位置プレビュー
    if (isDragging && draggedTask) {
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      const taskGroupElement = elementBelow?.closest('.task-group');
      
      if (taskGroupElement) {
        const targetGroupLabel = taskGroupElement.getAttribute('data-group-label');
        if (targetGroupLabel) {
          const taskList = taskGroupElement.querySelector('.task-list');
          const taskCards = Array.from(taskList?.querySelectorAll('.task-card:not(.dragging)') || []);
          
          let insertIndex = taskCards.length;
          
          // 同じグループの場合のみ詳細な位置計算
          if (targetGroupLabel === draggedTask.label) {
            for (let i = 0; i < taskCards.length; i++) {
              const rect = taskCards[i].getBoundingClientRect();
              const cardCenter = rect.top + rect.height / 2;
              
              if (e.clientY < cardCenter) {
                insertIndex = i;
                break;
              }
            }
          } else {
            // 異なるグループの場合も詳細な位置計算
            for (let i = 0; i < taskCards.length; i++) {
              const rect = taskCards[i].getBoundingClientRect();
              const cardCenter = rect.top + rect.height / 2;
              
              if (e.clientY < cardCenter) {
                insertIndex = i;
                break;
              }
            }
          }
          
          setDropPreview({ groupLabel: targetGroupLabel, index: insertIndex });
        } else {
          setDropPreview(null);
        }
      } else {
        setDropPreview(null);
      }
    }
  };

  const handleMouseUp = async (e: MouseEvent) => {
    // タスクドラッグの処理
    if (isDragging && draggedTask) {
      console.log('🏁 Mouse up, finding drop target');
      
      // ドロップターゲットを見つける
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      const taskGroupElement = elementBelow?.closest('.task-group');
      
      const currentDraggedTask = draggedTask; // 参照を保存
      
      // 即座にドラッグ状態をクリア（軽快さのため）
      setIsDragging(false);
      setDraggedTask(null);
      setDropPreview(null);
      
      if (taskGroupElement) {
        const targetGroupLabel = taskGroupElement.getAttribute('data-group-label');
        console.log('🎯 Drop target found:', targetGroupLabel);
        
        if (targetGroupLabel) {
          // 挿入位置を計算（ドロッププレビューと同じロジック使用）
          const taskList = taskGroupElement.querySelector('.task-list');
          const taskCards = Array.from(taskList?.querySelectorAll('.task-card:not(.dragging)') || []);
          
          let insertIndex = taskCards.length; // デフォルトは末尾
          
          // マウス位置に基づいて挿入位置を決定
          for (let i = 0; i < taskCards.length; i++) {
            const rect = taskCards[i].getBoundingClientRect();
            const cardCenter = rect.top + rect.height / 2;
            
            if (e.clientY < cardCenter) {
              insertIndex = i;
              break;
            }
          }
          
          console.log(`📍 Drop at position ${insertIndex}`);
          
          if (targetGroupLabel === currentDraggedTask.label) {
            // 同じグループ内での並び替え（楽観的更新で即座反映）
            const currentGroup = taskGroups.find(g => g.label === targetGroupLabel);
            if (currentGroup) {
              const currentIndex = currentGroup.tasks.findIndex(t => t.id === currentDraggedTask.id);
              
              // ドラッグ中のタスクを除外した配列でのインデックスを、元の配列のインデックスに変換
              const visibleTasks = currentGroup.tasks.filter(t => t.id !== currentDraggedTask.id);
              let actualInsertIndex = insertIndex;
              
              // insertIndexより前にドラッグ中のタスクがある場合は+1
              if (currentIndex < insertIndex) {
                actualInsertIndex = insertIndex + 1;
              }
              
              if (currentIndex !== actualInsertIndex && currentIndex !== actualInsertIndex - 1) {
                // 実際に位置が変わる場合のみ更新
                const newTaskOrder = [...currentGroup.tasks];
                const [movedTask] = newTaskOrder.splice(currentIndex, 1);
                newTaskOrder.splice(actualInsertIndex > currentIndex ? actualInsertIndex - 1 : actualInsertIndex, 0, movedTask);
                
                const taskIds = newTaskOrder.map(t => t.id);
                console.log('🔄 Immediate reorder in same group');
                
                // 即座にローカル状態を更新（正しい順序で）
                const reorderedTasks = [...tasks];
                const otherTasks = reorderedTasks.filter(t => t.label !== targetGroupLabel);
                
                // 新しい順序でposition更新
                const updatedTargetTasks = newTaskOrder.map((task, index) => ({
                  ...task,
                  position: index + 1
                }));
                
                setTasks([...otherTasks, ...updatedTargetTasks]);
                
                // バックグラウンドでDB更新
                try {
                  await reorderTasksInGroup(targetGroupLabel, taskIds);
                  console.log('✅ Same group reorder completed');
                } catch (error) {
                  console.error('❌ Same group reorder failed, reverting:', error);
                  // エラー時は元に戻す
                  await fetchTasks();
                  setError('タスクの並び替えに失敗しました');
                }
              }
            }
          } else {
            // 異なるグループへの移動（指定位置に配置）
            console.log(`⚡ Moving to different group at position ${insertIndex}`);
            try {
              await moveTaskToGroupPosition(currentDraggedTask.id, targetGroupLabel, insertIndex);
              console.log('✅ Task moved to specified position successfully');
            } catch (error) {
              console.error('❌ Task move failed:', error);
              setError('タスクの移動に失敗しました');
            }
          }
        }
      } else {
        console.log('❌ No valid drop target');
      }
      return;
    }
    
    // グループドラッグの処理
    if (isGroupDragging && draggedGroup) {
      await handleGroupDrop(e);
      return;
    }
  };

  // グループドラッグ関数
  const handleGroupMouseDown = (e: React.MouseEvent, groupLabel: string) => {
    console.log('🎯 Group drag started:', groupLabel);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setMousePos({ x: e.clientX, y: e.clientY });
    setDraggedGroup(groupLabel);
    setIsGroupDragging(true);
  };

  const handleGroupDrop = async (e: MouseEvent) => {
    if (!isGroupDragging || !draggedGroup) return;

    console.log('🏁 Group drop, finding target position');
    
    // 即座にドラッグ状態をクリア
    setIsGroupDragging(false);
    const currentDraggedGroup = draggedGroup;
    setDraggedGroup(null);
    
    // ドロップ位置を計算
    const taskGroupsContainer = document.querySelector('.task-groups');
    const groupElements = Array.from(taskGroupsContainer?.querySelectorAll('.task-group:not(.group-dragging)') || []);
    
    let insertIndex = groupElements.length; // デフォルトは末尾
    
    // マウス位置に基づいて挿入位置を決定
    for (let i = 0; i < groupElements.length; i++) {
      const rect = groupElements[i].getBoundingClientRect();
      const groupCenter = rect.left + rect.width / 2;
      
      if (e.clientX < groupCenter) {
        insertIndex = i;
        break;
      }
    }
    
    // 現在のグループ順序を取得し、新しい順序を計算
    const currentGroups = taskGroups.map(g => g.label);
    const currentIndex = currentGroups.indexOf(currentDraggedGroup);
    
    if (currentIndex !== -1 && currentIndex !== insertIndex && currentIndex !== insertIndex - 1) {
      const newOrder = [...currentGroups];
      const [movedGroup] = newOrder.splice(currentIndex, 1);
      newOrder.splice(insertIndex > currentIndex ? insertIndex - 1 : insertIndex, 0, movedGroup);
      
      console.log('🔄 Reordering groups:', newOrder);
      reorderGroups(newOrder);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleSaveTask = (taskId: string, updates: Partial<Task>) => {
    updateTask(taskId, updates);
  };

  const handleRenameGroup = async (oldLabel: string, newLabel: string) => {
    try {
      console.log(`🏷️ Renaming group from "${oldLabel}" to "${newLabel}"`);
      await renameLabel(oldLabel, newLabel);
      console.log(`✅ Successfully renamed group to "${newLabel}"`);
    } catch (error) {
      console.error('❌ Group rename error:', error);
      setError('グループ名の変更でエラーが発生しました');
    }
  };

  const handleCreateNewLabel = () => {
    try {
      console.log('📁 Creating new label group');
      
      // ユニークな名前を生成（30文字制限内で）
      let labelName = "新しいラベル";
      let counter = 1;
      
      while (taskGroups.some(group => group.label === labelName)) {
        labelName = `新しいラベル${counter}`;
        counter++;
        
        // 文字数制限チェック
        if (labelName.length > 15) {
          labelName = `ラベル${counter}`;
          if (labelName.length > 15) {
            labelName = `L${counter}`;
          }
        }
      }
      
      // 空のラベルグループを作成
      createEmptyLabel(labelName);
      
      console.log(`✅ New empty label group "${labelName}" created`);
    } catch (error) {
      console.error('❌ Create new label error:', error);
      setError('新しいラベルの作成でエラーが発生しました');
    }
  };

  const handleDeleteLabel = async (labelToDelete: string) => {
    try {
      console.log(`🗑️ Deleting label group "${labelToDelete}" and all its tasks`);
      await deleteLabel(labelToDelete);
      console.log(`✅ Successfully deleted label group "${labelToDelete}" and all its tasks`);
    } catch (error) {
      console.error('❌ Delete label error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('ラベルグループとタスクの削除でエラーが発生しました');
      }
    }
  };

  const handleAddTaskFromGroup = (groupLabel: string) => {
    setDefaultLabel(groupLabel);
    setIsModalOpen(true);
  };

  const handleCreateTaskDirect = async (title: string, label: string, startDate: Date, endDate: Date) => {
    try {
      const taskData = {
        title: title.trim(),
        label: label,
        startDate: startDate,
        endDate: endDate,
      };
      
      await createTasks([taskData]);
    } catch (error) {
      console.error('❌ Direct task creation error:', error);
      setError('タスクの作成でエラーが発生しました');
    }
  };

  // 未認証の場合はログインフォーム表示
  if (!user) {
    return <AuthForm />;
  }

  if (error) return <div className="error">エラー: {error}</div>;

  const taskGroups = getTaskGroups();

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-content">
          <div className="header-left">
            <h1>Trekka</h1>
          </div>
          <div className="header-right">
            <div className="header-actions">
              <button 
                className="header-btn header-btn-task"
                onClick={() => {
                  setDefaultLabel('');
                  setIsModalOpen(true);
                }}
                title="新しいタスクを作成"
              >
                <Plus size={18} />
                新しいタスク
              </button>
              <button 
                className="header-btn header-btn-label"
                onClick={handleCreateNewLabel}
                title="新しいラベルを作成"
              >
                <FolderPlus size={18} />
                新しいラベル
              </button>
            </div>
            <div className="user-section">
              <div className="user-info">
                <span className="user-email">{user.email}</span>
              </div>
              <button 
                className="logout-btn-header"
                onClick={signOut}
                title="ログアウト"
              >
                <LogOut size={16} />
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="task-groups-container">
        <div className="task-groups">
          {taskGroups.map((group) => (
            <TaskGroup 
              key={group.label} 
              group={group} 
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onRenameGroup={handleRenameGroup}
              onDeleteGroup={handleDeleteLabel}
              onAddTask={handleAddTaskFromGroup}
              onCreateTaskDirect={handleCreateTaskDirect}
              onMouseDown={handleMouseDown}
              onGroupMouseDown={handleGroupMouseDown}
              draggedTask={draggedTask}
              draggedGroup={draggedGroup}
              isDragging={isDragging}
              isGroupDragging={isGroupDragging}
              dropPreview={dropPreview}
            />
          ))}
        </div>
      </div>

      {/* Trello風ドラッグゴースト */}
      {isDragging && draggedTask && (
        <div 
          className="drag-ghost"
          style={{
            position: 'fixed',
            left: mousePos.x - dragOffset.x,
            top: mousePos.y - dragOffset.y,
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <div className="task-card dragging">
            <div className="task-card-header">
              <div className="task-content">
                <h3>{draggedTask.title}</h3>
              </div>
            </div>
            <div className="task-info">
              <div className="task-period">
                📅 {draggedTask.period}
              </div>
              <span className="task-label">{draggedTask.label}</span>
            </div>
          </div>
        </div>
      )}

      {/* グループドラッグゴースト */}
      {isGroupDragging && draggedGroup && (
        <div 
          className="group-drag-ghost"
          style={{
            position: 'fixed',
            left: mousePos.x - dragOffset.x,
            top: mousePos.y - dragOffset.y,
            pointerEvents: 'none',
            zIndex: 1000,
            opacity: 0.8,
            transform: 'rotate(2deg) scale(1.05)',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '1rem',
            border: '2px solid #667eea',
            minWidth: '300px'
          }}
        >
          <h3 style={{ margin: 0, color: '#172b4d', fontSize: '16px', fontWeight: '700' }}>
            📁 {draggedGroup}
          </h3>
        </div>
      )}


      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDefaultLabel('');
        }}
        onSubmit={createTasks}
        defaultLabel={defaultLabel}
      />

      <EditTaskModal
        isOpen={isEditModalOpen}
        task={editingTask}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <TodoApp />
    </AuthProvider>
  );
}

export default App