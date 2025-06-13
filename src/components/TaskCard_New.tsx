import { Calendar, Edit, Trash2 } from 'lucide-react';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  makeDraggable: (data: any) => any;
}

export function TaskCard_New({ task, onEdit, onDelete, makeDraggable }: TaskCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit?.(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm(`「${task.title}」を削除しますか？\\n\\nこの操作は取り消せません。`)) {
      onDelete?.(task.id);
    }
  };

  const dragProps = makeDraggable({
    type: 'task',
    task: task
  });

  return (
    <div
      className="task-card"
      {...dragProps}
    >
      <div className="task-drag-zone">
        <div className="task-card-header">
          <div className="task-content">
            <h3>{task.title}</h3>
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
      
      <div className="task-actions">
        <button 
          className="task-action-btn"
          onClick={handleEdit}
          title="編集"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Edit size={14} />
        </button>
        <button 
          className="task-action-btn delete"
          onClick={handleDelete}
          title="削除"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}