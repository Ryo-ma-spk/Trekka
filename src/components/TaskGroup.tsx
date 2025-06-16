import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical, Edit2, Check, X, Trash2, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TaskCard } from './TaskCard';
import type { TaskGroup as TaskGroupType, Task } from '../types';

interface TaskGroupProps {
  group: TaskGroupType;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onRenameGroup?: (oldLabel: string, newLabel: string) => void;
  onDeleteGroup?: (label: string) => void;
  onAddTask?: (groupLabel: string) => void;
  onCreateTaskDirect?: (title: string, label: string, startDate: Date, endDate: Date) => void;
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
  onCreateTaskDirect,
  onMouseDown,
  onGroupMouseDown,
  draggedTask,
  draggedGroup,
  dropPreview 
}: TaskGroupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(group.label);
  const [, setError] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStartDate, setNewTaskStartDate] = useState(new Date());
  const [newTaskEndDate, setNewTaskEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const taskFormRef = useRef<HTMLDivElement>(null);

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


  const handleEditSave = () => {
    const trimmedValue = editValue.trim();
    
    if (!trimmedValue) {
      // 空の場合は元の値に戻して終了
      setEditValue(group.label);
      setIsEditing(false);
      setError('');
      return;
    }
    
    if (trimmedValue.length > GROUP_NAME_MAX_LENGTH) {
      // 文字数超過の場合は切り詰めて保存
      const truncatedValue = trimmedValue.substring(0, GROUP_NAME_MAX_LENGTH);
      if (truncatedValue !== group.label && onRenameGroup) {
        onRenameGroup(group.label, truncatedValue);
      }
    } else if (trimmedValue !== group.label && onRenameGroup) {
      onRenameGroup(group.label, trimmedValue);
    }
    
    setIsEditing(false);
    setError('');
  };

  const handleInputChange = (value: string) => {
    setEditValue(value);
    // エラー表示は一切しない - 入力中は常にエラーをクリア
    setError('');
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

  const handleAddTaskStart = () => {
    setIsAddingTask(true);
    setNewTaskTitle('');
    setNewTaskStartDate(new Date());
    setNewTaskEndDate(new Date());
  };

  const handleAddTaskCancel = useCallback(() => {
    setIsAddingTask(false);
    setNewTaskTitle('');
    setNewTaskStartDate(new Date());
    setNewTaskEndDate(new Date());
    setShowDatePicker(false);
  }, []);

  const handleAddTaskSave = useCallback(() => {
    const trimmedTitle = newTaskTitle.trim();
    if (trimmedTitle && onCreateTaskDirect) {
      onCreateTaskDirect(trimmedTitle, group.label, newTaskStartDate, newTaskEndDate);
      setIsAddingTask(false);
      setNewTaskTitle('');
      setNewTaskStartDate(new Date());
      setNewTaskEndDate(new Date());
      setShowDatePicker(false);
    } else if (!trimmedTitle) {
      // タイトルが空の場合は作成せずにキャンセル
      handleAddTaskCancel();
    }
  }, [newTaskTitle, onCreateTaskDirect, group.label, newTaskStartDate, newTaskEndDate]);

  const handleDateInputChange = (value: string) => {
    // 日付文字列をパースして日付オブジェクトに変換
    const dateMatch = value.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})\s*-\s*(\d{4})\/(\d{1,2})\/(\d{1,2})/);
    if (dateMatch) {
      const [, startYear, startMonth, startDay, endYear, endMonth, endDay] = dateMatch;
      const newStartDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
      const newEndDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));
      
      if (!isNaN(newStartDate.getTime()) && !isNaN(newEndDate.getTime())) {
        setNewTaskStartDate(newStartDate);
        setNewTaskEndDate(newEndDate);
      }
    }
  };

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDatePicker(!showDatePicker);
  };

  // DatePickerの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // タスク入力フォーム外クリック時の処理
  useEffect(() => {
    const handleFormClickOutside = (event: MouseEvent) => {
      if (taskFormRef.current && !taskFormRef.current.contains(event.target as Node)) {
        // フォーム外をクリックした場合、確認なしで単純に解除
        handleAddTaskCancel();
      }
    };

    if (isAddingTask) {
      // 少し遅延を入れてイベントリスナーを追加（初期フォーカスとの競合を避ける）
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleFormClickOutside);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleFormClickOutside);
      };
    }
  }, [isAddingTask, handleAddTaskCancel]);

  const handleAddTaskKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newTaskTitle.trim()) {
        handleAddTaskSave();
      }
      // 空の場合は何もしない（入力継続）
    } else if (e.key === 'Escape') {
      handleAddTaskCancel();
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
                  className="group-title-input"
                  maxLength={GROUP_NAME_MAX_LENGTH}
                  placeholder=" "
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
        {/* インライン新規タスク入力 */}
        {isAddingTask && (
          <div className="task-card inline-task-input" ref={taskFormRef}>
            <div className="task-card-header">
              <div className="task-content">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={handleAddTaskKeyPress}
                  placeholder="タスクタイトルを入力..."
                  className="inline-task-title-input"
                  autoFocus
                />
              </div>
              <div className="task-actions">
                <button 
                  className="task-action-btn"
                  onClick={handleAddTaskCancel}
                  title="キャンセル"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            
            <div className="task-info">
              <div className="task-period inline-date-container" ref={datePickerRef}>
                <Calendar size={14} onClick={handleCalendarClick} style={{ cursor: 'pointer' }} />
                <input
                  type="text"
                  value={`${newTaskStartDate.getFullYear()}/${newTaskStartDate.getMonth() + 1}/${newTaskStartDate.getDate()} - ${newTaskEndDate.getFullYear()}/${newTaskEndDate.getMonth() + 1}/${newTaskEndDate.getDate()}`}
                  onChange={(e) => handleDateInputChange(e.target.value)}
                  className="inline-period-input"
                  placeholder="YYYY/M/D - YYYY/M/D"
                />
                {showDatePicker && (
                  <div className="inline-datepicker-popup">
                    <div className="datepicker-row">
                      <label>開始:</label>
                      <DatePicker
                        selected={newTaskStartDate}
                        onChange={(date) => setNewTaskStartDate(date || new Date())}
                        dateFormat="yyyy/M/d"
                        className="popup-date-picker"
                      />
                    </div>
                    <div className="datepicker-row">
                      <label>終了:</label>
                      <DatePicker
                        selected={newTaskEndDate}
                        onChange={(date) => setNewTaskEndDate(date || new Date())}
                        dateFormat="yyyy/M/d"
                        className="popup-date-picker"
                        minDate={newTaskStartDate}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 右下のタスク作成ボタン */}
      <button 
        className="floating-add-task-btn" 
        title="このグループにタスクを追加"
        onClick={(e) => {
          e.stopPropagation();
          handleAddTaskStart();
        }}
      >
        +
      </button>
    </div>
  );
}