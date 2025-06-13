import { useState } from 'react';
import { GripVertical, Edit2, Check, X } from 'lucide-react';
import { TaskCard_New } from './TaskCard_New';
import type { TaskGroup as TaskGroupType, Task } from '../types';

interface TaskGroupProps {
  group: TaskGroupType;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onRenameGroup?: (oldLabel: string, newLabel: string) => void;
  makeDraggable: (data: any) => any;
  makeDropTarget: (targetId: string) => any;
}

export function TaskGroup({ 
  group, 
  onEditTask, 
  onDeleteTask, 
  onRenameGroup,
  makeDraggable,
  makeDropTarget
}: TaskGroupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(group.label);

  const handleEditStart = () => {
    setIsEditing(true);
    setEditValue(group.label);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditValue(group.label);
  };

  const handleEditSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== group.label && onRenameGroup) {
      onRenameGroup(group.label, trimmedValue);
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const groupDragProps = makeDraggable({
    type: 'group',
    label: group.label
  });

  const groupDropProps = makeDropTarget(`group-${group.label}`);

  return (
    <div
      className="task-group"
      {...groupDropProps}
    >
      <div className="group-header">
        <div 
          className="group-drag-handle"
          {...groupDragProps}
        >
          <GripVertical size={16} />
        </div>
        <div className="group-title-section">
          {isEditing ? (
            <div className="group-title-edit">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleEditSave}
                className="group-title-input"
                autoFocus
              />
              <div className="group-edit-actions">
                <button
                  className="group-edit-btn save"
                  onClick={handleEditSave}
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
              <button className="group-edit-trigger" title="グループ名を編集">
                <Edit2 size={14} />
              </button>
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
          group.tasks.map((task) => (
            <TaskCard_New 
              key={task.id} 
              task={task} 
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              makeDraggable={makeDraggable}
            />
          ))
        )}
      </div>
    </div>
  );
}