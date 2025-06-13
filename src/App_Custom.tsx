import { useState, useEffect } from 'react';
import { Plus, FolderPlus } from 'lucide-react';
import { TaskGroup } from './components/TaskGroup_New';
import { TaskModal } from './components/TaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { useTasks } from './hooks/useTasks';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import type { Task } from './types';
import './App.css';

function App() {
  const { loading, error, createTasks, updateTaskLabel, updateTask, deleteTask, getTaskGroups, reorderGroups, createEmptyLabel } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const {
    dragState,
    makeDraggable,
    makeDropTarget,
    setDragStartHandler,
    setDragEndHandler,
  } = useDragAndDrop();

  const taskGroups = getTaskGroups();

  // ドラッグハンドラーを設定
  useEffect(() => {
    setDragStartHandler((data) => {
      console.log('🎯 Drag started with data:', data);
    });

    setDragEndHandler((draggedData, targetData) => {
      console.log('🎯 Drag ended:', draggedData, '→', targetData);
      
      if (draggedData.type === 'task' && targetData) {
        const task = draggedData.task as Task;
        
        if (targetData.startsWith('group-')) {
          const targetLabel = targetData.replace('group-', '');
          if (task.label !== targetLabel) {
            console.log(`📦 Moving task "${task.title}" to "${targetLabel}"`);
            updateTaskLabel(task.id, targetLabel);
          }
        }
      }
      
      if (draggedData.type === 'group' && targetData) {
        const sourceLabel = draggedData.label;
        const targetLabel = targetData.replace('group-', '');
        
        if (sourceLabel !== targetLabel) {
          console.log(`🔄 Reordering groups: ${sourceLabel} → ${targetLabel}`);
          const groupLabels = taskGroups.map(group => group.label);
          const oldIndex = groupLabels.indexOf(sourceLabel);
          const newIndex = groupLabels.indexOf(targetLabel);
          
          if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = [...groupLabels];
            const [removed] = newOrder.splice(oldIndex, 1);
            newOrder.splice(newIndex, 0, removed);
            reorderGroups(newOrder);
          }
        }
      }
    });
  }, [setDragStartHandler, setDragEndHandler, updateTaskLabel, taskGroups, reorderGroups]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault();
        setIsModalOpen(true);
      }
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        setIsEditModalOpen(false);
        setEditingTask(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRenameGroup = async (oldLabel: string, newLabel: string) => {
    try {
      console.log(`🏷️ Renaming group from "${oldLabel}" to "${newLabel}"`);
      
      const tasksToUpdate = taskGroups
        .find(group => group.label === oldLabel)
        ?.tasks || [];
      
      for (const task of tasksToUpdate) {
        await updateTaskLabel(task.id, newLabel);
      }
      
      console.log(`✅ Successfully renamed ${tasksToUpdate.length} tasks`);
    } catch (error) {
      console.error('❌ Group rename error:', error);
    }
  };

  const handleCreateNewLabel = () => {
    try {
      console.log('📁 Creating new label group');
      
      let labelName = "新しいラベル";
      let counter = 1;
      
      while (taskGroups.some(group => group.label === labelName)) {
        labelName = `新しいラベル${counter}`;
        counter++;
      }
      
      createEmptyLabel(labelName);
      console.log(`✅ New empty label group "${labelName}" created`);
    } catch (error) {
      console.error('❌ Create new label error:', error);
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

  if (error) return <div className="error">エラー: {error}</div>;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-content">
          <h1>Todo App</h1>
          <div className="header-actions">
            <button 
              className="add-label-btn-header"
              onClick={handleCreateNewLabel}
              title="新しいラベルを作成"
            >
              <FolderPlus size={20} />
              新しいラベル
            </button>
            <button 
              className="add-task-btn-header"
              onClick={() => setIsModalOpen(true)}
              title="新しいタスクを作成 (Cmd/Ctrl + N)"
            >
              <Plus size={20} />
              新しいタスク
            </button>
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
              makeDraggable={makeDraggable}
              makeDropTarget={makeDropTarget}
            />
          ))}
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createTasks}
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

export default App;