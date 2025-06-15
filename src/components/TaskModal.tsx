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
  availableLabels?: string[];
}

export function TaskModal({ isOpen, onClose, onSubmit, defaultLabel = '', availableLabels = [] }: TaskModalProps) {
  // 共通設定
  const [commonLabel, setCommonLabel] = useState('');
  const [commonStartDate, setCommonStartDate] = useState(new Date());
  const [commonEndDate, setCommonEndDate] = useState(new Date());
  
  // タスクタイトルのリスト
  const [taskTitles, setTaskTitles] = useState<string[]>(['']);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // defaultLabelが変更された時に適用
  useEffect(() => {
    if (isOpen && defaultLabel) {
      setCommonLabel(defaultLabel);
    }
  }, [isOpen, defaultLabel]);

  const addTaskTitle = () => {
    setTaskTitles([...taskTitles, '']);
  };

  const removeTaskTitle = (index: number) => {
    if (taskTitles.length > 1) {
      setTaskTitles(taskTitles.filter((_, i) => i !== index));
      // エラーも削除
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`title_${index}`];
        return newErrors;
      });
    }
  };

  const updateTaskTitle = (index: number, value: string) => {
    setTaskTitles(prev => 
      prev.map((title, i) => 
        i === index ? value : title
      )
    );
    
    // エラークリア
    if (errors[`title_${index}`]) {
      setErrors(prev => ({
        ...prev,
        [`title_${index}`]: ''
      }));
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

  const updateCommonField = (field: 'label' | 'startDate' | 'endDate', value: any) => {
    if (field === 'label') {
      setCommonLabel(value);
      // バリデーション
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        commonLabel: error
      }));
    } else if (field === 'startDate') {
      setCommonStartDate(value);
    } else if (field === 'endDate') {
      setCommonEndDate(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    const newErrors: Record<string, string> = {};
    let hasErrors = false;
    
    // 共通ラベルのバリデーション
    const labelError = validateField('label', commonLabel);
    if (labelError) {
      newErrors.commonLabel = labelError;
      hasErrors = true;
    }
    
    // 各タスクタイトルのバリデーション
    taskTitles.forEach((title, index) => {
      const titleError = validateField('title', title);
      if (titleError) {
        newErrors[`title_${index}`] = titleError;
        hasErrors = true;
      }
    });
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    
    // 有効なタスクのみフィルタ
    const validTitles = taskTitles.filter(title => title.trim());
    if (validTitles.length === 0) return;
    
    // TaskFormData形式に変換（逆順で送信して正しい順序にする）
    const tasksToSubmit: TaskFormData[] = validTitles.reverse().map(title => ({
      title: title.trim(),
      label: commonLabel,
      startDate: commonStartDate,
      endDate: commonEndDate,
    }));
    
    onSubmit(tasksToSubmit);
    
    // リセット
    setTaskTitles(['']);
    setCommonLabel('');
    setCommonStartDate(new Date());
    setCommonEndDate(new Date());
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    // リセット
    setTaskTitles(['']);
    setCommonLabel('');
    setCommonStartDate(new Date());
    setCommonEndDate(new Date());
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
            {/* 共通設定セクション */}
            <div className="common-settings">
              
              <div className="form-row">
                <div className="form-field">
                  <label>
                    ラベル 
                    <span className="char-count">
                      ({commonLabel.length}/{VALIDATION_RULES.label.max})
                    </span>
                  </label>
                  <select
                    value={commonLabel}
                    onChange={e => updateCommonField('label', e.target.value)}
                    className={errors.commonLabel ? 'error' : ''}
                    required
                  >
                    <option value="">ラベルを選択</option>
                    {availableLabels.map(label => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {errors.commonLabel && (
                    <span className="error-message">{errors.commonLabel}</span>
                  )}
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '20px' }}>
                <div className="form-field">
                  <label>開始日</label>
                  <DatePicker
                    selected={commonStartDate}
                    onChange={date => updateCommonField('startDate', date || new Date())}
                    dateFormat="yyyy/M/d"
                    className="date-picker"
                  />
                </div>
                
                <div className="form-field">
                  <label>終了日</label>
                  <DatePicker
                    selected={commonEndDate}
                    onChange={date => updateCommonField('endDate', date || new Date())}
                    dateFormat="yyyy/M/d"
                    className="date-picker"
                    minDate={commonStartDate}
                  />
                </div>
              </div>
            </div>
            
            {/* タスクリストセクション */}
            <div className="tasks-section">
              <div className="tasks-header">
                <h3>タスク一覧</h3>
                <button type="button" className="add-task-btn" onClick={addTaskTitle}>
                  <Plus size={16} />
                  タスクを追加
                </button>
              </div>

              <div className="tasks-list">
                {taskTitles.map((title, index) => (
                  <div key={index} className="task-item">
                    <span className="task-number">{index + 1}.</span>
                    <div className="task-input-container">
                      <input
                        type="text"
                        value={title}
                        onChange={e => updateTaskTitle(index, e.target.value)}
                        placeholder="タスク名を入力"
                        maxLength={VALIDATION_RULES.title.max}
                        className={errors[`title_${index}`] ? 'error' : ''}
                        required
                      />
                      {taskTitles.length > 1 && (
                        <button
                          type="button"
                          className="remove-task-btn"
                          onClick={() => removeTaskTitle(index)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {errors[`title_${index}`] && (
                      <span className="error-message">{errors[`title_${index}`]}</span>
                    )}
                  </div>
                ))}
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
            >
              タスクを作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}