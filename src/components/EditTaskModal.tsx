import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { X } from 'lucide-react';
import type { Task } from '../types';
import 'react-datepicker/dist/react-datepicker.css';

// バリデーション設定
const VALIDATION_RULES = {
  title: { min: 1, max: 100 },
  label: { min: 1, max: 15 }
};

interface EditTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
  availableLabels?: string[];
}

export function EditTaskModal({ isOpen, task, onClose, onSave, availableLabels = [] }: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [label, setLabel] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const updateField = (field: 'title' | 'label', value: string) => {
    if (field === 'title') {
      setTitle(value);
    } else {
      setLabel(value);
    }
    
    // バリデーション
    const error = validateField(field, value);
    const newErrors = { ...errors };
    
    if (error) {
      newErrors[field] = error;
    } else {
      delete newErrors[field];
    }
    setErrors(newErrors);
  };

  // Update form when task changes
  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setLabel(task.label);
      setErrors({});
      
      // Parse period back to dates
      const [start, end] = task.period.split(' - ');
      if (start && end) {
        try {
          // Convert YYYY/MM/DD to YYYY-MM-DD for proper Date parsing
          const startFormatted = start.split('/').map(n => n.padStart(2, '0')).join('-');
          const endFormatted = end.split('/').map(n => n.padStart(2, '0')).join('-');
          setStartDate(new Date(startFormatted));
          setEndDate(new Date(endFormatted));
        } catch (error) {
          console.error('Date parsing error:', error);
          setStartDate(new Date());
          setEndDate(new Date());
        }
      }
    }
  }, [task]);

  const formatDateRange = (startDate: Date | null, endDate: Date | null): string => {
    if (!startDate || !endDate) return '';
    const start = startDate.toLocaleDateString('ja-JP');
    const end = endDate.toLocaleDateString('ja-JP');
    return `${start} - ${end}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task) return;
    
    // 全フィールドのバリデーション
    const titleError = validateField('title', title);
    const labelError = validateField('label', label);
    
    const newErrors: Record<string, string> = {};
    if (titleError) newErrors.title = titleError;
    if (labelError) newErrors.label = labelError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    if (!startDate || !endDate) return;
    
    const updates = {
      title: title.trim(),
      label: label.trim(),
      period: formatDateRange(startDate, endDate),
    };
    
    onSave(task.id, updates);
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setLabel('');
    setStartDate(null);
    setEndDate(null);
    onClose();
  };

  if (!isOpen || !task) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>タスクを編集</h2>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="tasks-form">

            <div className="tasks-list">
              <div className="task-card-form">
                <div className="task-form-header">
                  <span className="task-number">編集中</span>
                </div>

                <div className="task-form-fields">
                  <div className="form-row">
                    <div className="form-field">
                      <label>
                        タスク名 
                        <span className="char-count">
                          ({title.length}/{VALIDATION_RULES.title.max})
                        </span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={e => updateField('title', e.target.value)}
                        placeholder="タスク名を入力"
                        maxLength={VALIDATION_RULES.title.max}
                        className={errors.title ? 'error' : ''}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label>
                        ラベル 
                        <span className="char-count">
                          ({label.length}/{VALIDATION_RULES.label.max})
                        </span>
                      </label>
                      <select
                        value={label}
                        onChange={e => updateField('label', e.target.value)}
                        className={errors.label ? 'error' : ''}
                        required
                      >
                        <option value="">ラベルを選択</option>
                        {availableLabels.map(availableLabel => (
                          <option key={availableLabel} value={availableLabel}>
                            {availableLabel}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>開始日</label>
                      <DatePicker
                        selected={startDate}
                        onChange={setStartDate}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        dateFormat="yyyy/MM/dd"
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label>終了日</label>
                      <DatePicker
                        selected={endDate}
                        onChange={setEndDate}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        dateFormat="yyyy/MM/dd"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
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
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}