import { Calendar, Edit, Trash2 } from 'lucide-react';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onMouseDown?: (e: React.MouseEvent, task: Task) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, onMouseDown, isDragging }: TaskCardProps) {

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit?.(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm(`「${task.title}」を削除しますか？\n\nこの操作は取り消せません。`)) {
      onDelete?.(task.id);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    onMouseDown?.(e, task);
  };

  return (
    <div
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      style={{ cursor: 'grab' }}
    >
      <div className="task-card-header">
        <div className="task-content">
          <h3>{task.title}</h3>
        </div>
        <div className="task-actions">
          <button 
            className="task-action-btn"
            onClick={handleEdit}
            title="編集"
          >
            <Edit size={14} />
          </button>
          <button 
            className="task-action-btn delete"
            onClick={handleDelete}
            title="削除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      <div className="task-info">
        <div className="task-period">
          <Calendar size={14} />
          {task.period}
        </div>
        <span className="task-label">{task.label}</span>
      </div>
    </div>
  );
}