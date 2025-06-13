import React, { useState } from 'react';
import { GripVertical, Edit2, Check, X, Trash2 } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { TaskGroup as TaskGroupType, Task } from '../types';

interface TaskGroupProps {
  group: TaskGroupType;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onRenameGroup?: (oldLabel: string, newLabel: string) => void;
  onDeleteGroup?: (label: string) => void;
  onMouseDown?: (e: React.MouseEvent, task: Task) => void;
  onGroupMouseDown?: (e: React.MouseEvent, groupLabel: string) => void;
  draggedTask?: Task | null;
  draggedGroup?: string | null;
  isDragging?: boolean;
  isGroupDragging?: boolean;
  dropPreview?: { groupLabel: string; index: number } | null;
}

// バリデーション設定
const GROUP_NAME_MAX_LENGTH = 15;

export function TaskGroup({ 
  group, 
  onEditTask, 
  onDeleteTask, 
  onRenameGroup, 
  onDeleteGroup,
  onMouseDown,
  onGroupMouseDown,
  draggedTask,
  draggedGroup,
  isDragging,
  isGroupDragging,
  dropPreview 
}: TaskGroupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(group.label);
  const [error, setError] = useState('');

  const handleEditStart = () => {
    setIsEditing(true);
    setEditValue(group.label);
    setError('');
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditValue(group.label);
    setError('');
  };

  const validateGroupName = (value: string): string => {
    if (!value || value.trim().length === 0) {
      return 'グループ名は必須です';
    }
    if (value.trim().length > GROUP_NAME_MAX_LENGTH) {
      return `グループ名は${GROUP_NAME_MAX_LENGTH}文字以内で入力してください`;
    }
    return '';
  };

  const handleEditSave = () => {
    const trimmedValue = editValue.trim();
    const validationError = validateGroupName(trimmedValue);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    if (trimmedValue !== group.label && onRenameGroup) {
      onRenameGroup(group.label, trimmedValue);
    }
    setIsEditing(false);
    setError('');
  };

  const handleInputChange = (value: string) => {
    setEditValue(value);
    const validationError = validateGroupName(value);
    setError(validationError);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleDeleteGroup = () => {
    const taskCount = group.tasks.length;
    let confirmMessage = `ラベルグループ「${group.label}」を削除しますか？\n\n`;
    
    if (taskCount > 0) {
      confirmMessage += `このグループには${taskCount}個のタスクが含まれており、全て削除されます。\n\n`;
    }
    
    confirmMessage += `この操作は取り消せません。`;
    
    if (window.confirm(confirmMessage)) {
      onDeleteGroup?.(group.label);
    }
  };


  const isCurrentlyDragged = draggedGroup === group.label;

  return (
    <div
      className={`task-group ${isCurrentlyDragged ? 'group-dragging' : ''}`}
      data-group-label={group.label}
    >
      <div className="group-header">
        <div 
          className="group-drag-handle"
          onMouseDown={(e) => onGroupMouseDown?.(e, group.label)}
          title="グループをドラッグして並び替え"
        >
          <GripVertical size={16} />
        </div>
        <div className="group-title-section">
          {isEditing ? (
            <div className="group-title-edit">
              <div className="group-edit-input-container">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={handleEditSave}
                  className={`group-title-input ${error ? 'error' : ''}`}
                  maxLength={GROUP_NAME_MAX_LENGTH}
                  autoFocus
                />
                <span className="group-char-count">
                  {editValue.length}/{GROUP_NAME_MAX_LENGTH}
                </span>
              </div>
              <div className="group-edit-actions">
                <button
                  className="group-edit-btn save"
                  onClick={handleEditSave}
                  disabled={!!error}
                  title="保存"
                >
                  <Check size={14} />
                </button>
                <button
                  className="group-edit-btn cancel"
                  onClick={handleEditCancel}
                  title="キャンセル"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="group-title-display" onClick={handleEditStart}>
              <h2 className="group-title">
                {group.label}
                <span className="task-count">({group.tasks.length})</span>
              </h2>
              <div className="group-actions">
                <button className="group-edit-trigger" title="グループ名を編集">
                  <Edit2 size={14} />
                </button>
                <button 
                  className="group-delete-trigger" 
                  title="グループを削除"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGroup();
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="task-list">
        {group.tasks.length === 0 ? (
          <div className="empty-state">
            <p>タスクをここにドラッグ&ドロップ</p>
          </div>
        ) : (
          group.tasks
            .filter(task => !draggedTask || task.id !== draggedTask.id) // ドラッグ中のタスクは非表示
            .map((task, index) => (
              <React.Fragment key={task.id}>
                {/* ドロッププレビュー */}
                {dropPreview && 
                 dropPreview.groupLabel === group.label && 
                 dropPreview.index === index && (
                  <div className="drop-placeholder">
                  </div>
                )}
                <TaskCard 
                  task={task} 
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onMouseDown={onMouseDown}
                  isDragging={draggedTask?.id === task.id}
                />
              </React.Fragment>
            ))
        )}
        {/* 末尾のドロッププレビュー */}
        {dropPreview && 
         dropPreview.groupLabel === group.label && 
         dropPreview.index >= group.tasks.filter(task => !draggedTask || task.id !== draggedTask.id).length && (
          <div className="drop-placeholder">
          </div>
        )}
      </div>
    </div>
  );
}