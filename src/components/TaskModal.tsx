import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { X, Plus, Trash2 } from 'lucide-react';
import type { TaskFormData } from '../types';
import 'react-datepicker/dist/react-datepicker.css';

// バリデーション設定
const VALIDATION_RULES = {
  title: { min: 1, max: 100 },
  label: { min: 1, max: 15 }
};

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tasks: TaskFormData[]) => void;
  defaultLabel?: string;
}

export function TaskModal({ isOpen, onClose, onSubmit, defaultLabel = '' }: TaskModalProps) {
  const [tasks, setTasks] = useState<TaskFormData[]>([
    {
      title: '',
      label: '',
      startDate: new Date(),
      endDate: new Date(),
    },
  ]);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  // defaultLabelが変更された時、最初のタスクのラベルを更新
  useEffect(() => {
    if (isOpen && defaultLabel) {
      setTasks(prevTasks => 
        prevTasks.map((task, index) => 
          index === 0 ? { ...task, label: defaultLabel } : task
        )
      );
    }
  }, [isOpen, defaultLabel]);

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        title: '',
        label: '',
        startDate: new Date(),
        endDate: new Date(),
      },
    ]);
  };

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  // バリデーション関数
  const validateField = (field: string, value: string): string => {
    if (!value || value.trim().length === 0) {
      return `${field === 'title' ? 'タスク名' : 'ラベル'}は必須です`;
    }
    
    const rule = VALIDATION_RULES[field as keyof typeof VALIDATION_RULES];
    if (rule) {
      const trimmedValue = value.trim();
      if (trimmedValue.length < rule.min) {
        return `${field === 'title' ? 'タスク名' : 'ラベル'}は${rule.min}文字以上で入力してください`;
      }
      if (trimmedValue.length > rule.max) {
        return `${field === 'title' ? 'タスク名' : 'ラベル'}は${rule.max}文字以内で入力してください`;
      }
    }
    
    return '';
  };

  const updateTask = (index: number, field: keyof TaskFormData, value: any) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
    
    // バリデーション
    if (field === 'title' || field === 'label') {
      const error = validateField(field, value);
      const newErrors = { ...errors };
      if (!newErrors[index]) newErrors[index] = {};
      
      if (error) {
        newErrors[index][field] = error;
      } else {
        delete newErrors[index][field];
        if (Object.keys(newErrors[index]).length === 0) {
          delete newErrors[index];
        }
      }
      setErrors(newErrors);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 全タスクのバリデーション
    const newErrors: Record<number, Record<string, string>> = {};
    let hasErrors = false;
    
    tasks.forEach((task, index) => {
      const titleError = validateField('title', task.title);
      const labelError = validateField('label', task.label);
      
      if (titleError || labelError) {
        newErrors[index] = {};
        if (titleError) newErrors[index].title = titleError;
        if (labelError) newErrors[index].label = labelError;
        hasErrors = true;
      }
    });
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    
    const validTasks = tasks.filter(
      task => task.title.trim() && task.label.trim() && task.startDate && task.endDate
    );
    
    if (validTasks.length === 0) return;
    
    onSubmit(validTasks);
    setTasks([{
      title: '',
      label: '',
      startDate: new Date(),
      endDate: new Date(),
    }]);
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setTasks([{
      title: '',
      label: '',
      startDate: new Date(),
      endDate: new Date(),
    }]);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>新しいタスクを作成</h2>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="tasks-form">
            <div className="tasks-header">
              <h3>タスク一覧</h3>
              <button type="button" className="add-task-btn" onClick={addTask}>
                <Plus size={16} />
                タスクを追加
              </button>
            </div>

            <div className="tasks-list">
              {tasks.map((task, index) => (
                <div key={index} className="task-card-form">
                  <div className="task-form-header">
                    <span className="task-number">タスク {index + 1}</span>
                    {tasks.length > 1 && (
                      <button
                        type="button"
                        className="remove-task-btn"
                        onClick={() => removeTask(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="task-form-fields">
                    <div className="form-row">
                      <div className="form-field">
                        <label>
                          タスク名 
                          <span className="char-count">
                            ({task.title.length}/{VALIDATION_RULES.title.max})
                          </span>
                        </label>
                        <input
                          type="text"
                          value={task.title}
                          onChange={e => updateTask(index, 'title', e.target.value)}
                          placeholder="タスク名を入力"
                          maxLength={VALIDATION_RULES.title.max}
                          className={errors[index]?.title ? 'error' : ''}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label>
                          ラベル 
                          <span className="char-count">
                            ({task.label.length}/{VALIDATION_RULES.label.max})
                          </span>
                        </label>
                        <input
                          type="text"
                          value={task.label}
                          onChange={e => updateTask(index, 'label', e.target.value)}
                          placeholder="カテゴリ"
                          maxLength={VALIDATION_RULES.label.max}
                          className={errors[index]?.label ? 'error' : ''}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label>開始日</label>
                        <DatePicker
                          selected={task.startDate}
                          onChange={date => updateTask(index, 'startDate', date)}
                          selectsStart
                          startDate={task.startDate}
                          endDate={task.endDate}
                          dateFormat="yyyy/MM/dd"
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label>終了日</label>
                        <DatePicker
                          selected={task.endDate}
                          onChange={date => updateTask(index, 'endDate', date)}
                          selectsEnd
                          startDate={task.startDate}
                          endDate={task.endDate}
                          minDate={task.startDate}
                          dateFormat="yyyy/MM/dd"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={handleClose}>
              キャンセル
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={Object.keys(errors).length > 0}
            >
              タスクを作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}