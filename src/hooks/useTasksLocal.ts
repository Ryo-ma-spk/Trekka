import { useState, useEffect } from 'react';
import type { Task, TaskGroup, TaskFormData } from '../types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupOrder, setGroupOrder] = useState<string[]>([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const storedTasks = localStorage.getItem('tasks');
      const data: Task[] = storedTasks ? JSON.parse(storedTasks) : [];

      setTasks(data);
      
      // グループ順序を取得または初期化
      const labels = [...new Set(data.map(task => task.label))];
      const storedOrder = localStorage.getItem('groupOrder');
      if (storedOrder) {
        const parsed = JSON.parse(storedOrder);
        // 新しいラベルを追加
        const newLabels = labels.filter(label => !parsed.includes(label));
        setGroupOrder([...parsed, ...newLabels]);
      } else {
        setGroupOrder(labels);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createTasks = async (tasksData: TaskFormData[]) => {
    try {
      const newTasks = tasksData.map(task => ({
        id: Math.random().toString(36).substr(2, 9),
        title: task.title,
        period: task.startDate && task.endDate 
          ? `${task.startDate.toLocaleDateString('ja-JP')} - ${task.endDate.toLocaleDateString('ja-JP')}`
          : '',
        label: task.label,
        created_at: new Date().toISOString(),
      }));

      const updatedTasks = [...tasks, ...newTasks];
      setTasks(updatedTasks);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      
      // グループ順序を更新
      const newLabels = [...new Set(newTasks.map(t => t.label))];
      const updatedGroupOrder = [...groupOrder];
      newLabels.forEach(label => {
        if (!updatedGroupOrder.includes(label)) {
          updatedGroupOrder.push(label);
        }
      });
      setGroupOrder(updatedGroupOrder);
      localStorage.setItem('groupOrder', JSON.stringify(updatedGroupOrder));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tasks');
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      setTasks(updatedTasks);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const updateTaskLabel = async (taskId: string, newLabel: string) => {
    try {
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, label: newLabel } : task
      );
      setTasks(updatedTasks);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      
      // グループ順序を更新
      if (!groupOrder.includes(newLabel)) {
        const updatedGroupOrder = [...groupOrder, newLabel];
        setGroupOrder(updatedGroupOrder);
        localStorage.setItem('groupOrder', JSON.stringify(updatedGroupOrder));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task label');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const reorderGroups = (newOrder: string[]) => {
    setGroupOrder(newOrder);
    localStorage.setItem('groupOrder', JSON.stringify(newOrder));
  };

  const getTaskGroups = (): TaskGroup[] => {
    const groups: { [key: string]: Task[] } = {};
    
    tasks.forEach(task => {
      if (!groups[task.label]) {
        groups[task.label] = [];
      }
      groups[task.label].push(task);
    });

    return groupOrder.map(label => ({
      label,
      tasks: groups[label] || []
    })).filter(group => group.tasks.length > 0);
  };

  return {
    tasks,
    loading,
    error,
    createTasks,
    updateTask,
    updateTaskLabel,
    deleteTask,
    getTaskGroups,
    reorderGroups,
  };
}