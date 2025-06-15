import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Task, TaskGroup, TaskFormData } from '../types';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [groupOrder, setGroupOrder] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) {
      return;
    }

    try {
      // user_id列が存在するかチェック
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let tasksData = [];
      
      if (error) {
        // user_id列が存在しない場合は全件取得
        if (error.message.includes('user_id')) {
          const { data: allData, error: allError } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (allError) {
            throw allError;
          }
          tasksData = allData || [];
        } else {
          throw error;
        }
      } else {
        tasksData = data || [];
      }

      setTasks(tasksData);

      // グループ順序を取得または初期化（ユーザー別）
      const labels = [...new Set(tasksData.map(task => task.label))];
      const storedOrderKey = `groupOrder_${user.id}`;
      const storedOrder = localStorage.getItem(storedOrderKey);
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
      // Loading state removed
    }
  };

  const createTasks = async (tasksData: TaskFormData[]) => {
    if (!user) return;

    try {
      // user_id列とposition列の存在チェック
      const { data: sampleData, error: checkError } = await supabase
        .from('tasks')
        .select('position, user_id')
        .limit(1);

      let tasksToInsert;

      const hasPosition = !checkError || !checkError.message.includes('position');
      const hasUserId = !checkError || !checkError.message.includes('user_id');

      if (!hasPosition && !hasUserId) {
        tasksToInsert = tasksData.map(task => ({
          title: task.title,
          period: task.startDate && task.endDate 
            ? `${task.startDate.toLocaleDateString('ja-JP')} - ${task.endDate.toLocaleDateString('ja-JP')}`
            : '',
          label: task.label,
        }));
      } else if (!hasPosition) {
        tasksToInsert = tasksData.map(task => ({
          title: task.title,
          period: task.startDate && task.endDate 
            ? `${task.startDate.toLocaleDateString('ja-JP')} - ${task.endDate.toLocaleDateString('ja-JP')}`
            : '',
          label: task.label,
          user_id: user.id,
        }));
      } else if (!hasUserId) {
        tasksToInsert = await Promise.all(tasksData.map(async (task) => {
          const { data: maxPositionData } = await supabase
            .from('tasks')
            .select('position')
            .eq('label', task.label)
            .order('position', { ascending: false })
            .limit(1);
          
          const maxPosition = maxPositionData?.[0]?.position || 0;
          
          return {
            title: task.title,
            period: task.startDate && task.endDate 
              ? `${task.startDate.toLocaleDateString('ja-JP')} - ${task.endDate.toLocaleDateString('ja-JP')}`
              : '',
            label: task.label,
            position: maxPosition + 1,
          };
        }));
      } else {
        // 両方の列がある場合
        tasksToInsert = await Promise.all(tasksData.map(async (task) => {
          const { data: maxPositionData } = await supabase
            .from('tasks')
            .select('position')
            .eq('label', task.label)
            .eq('user_id', user.id)
            .order('position', { ascending: false })
            .limit(1);
          
          const maxPosition = maxPositionData?.[0]?.position || 0;
          
          return {
            title: task.title,
            period: task.startDate && task.endDate 
              ? `${task.startDate.toLocaleDateString('ja-JP')} - ${task.endDate.toLocaleDateString('ja-JP')}`
              : '',
            label: task.label,
            position: maxPosition + 1,
            user_id: user.id,
          };
        }));
      }

      const { error } = await supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (error) throw error;

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tasks');
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const updateTaskLabel = async (taskId: string, newLabel: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ label: newLabel })
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task label');
    }
  };

  // 楽観的更新版 - 即座にローカル状態を更新してからDB更新
  const updateTaskLabelOptimistic = async (taskId: string, newLabel: string) => {
    // 1. 即座にローカル状態を更新
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, label: newLabel } : task
      )
    );

    // 2. バックグラウンドでデータベース更新
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ label: newLabel })
        .eq('id', taskId);

      if (error) {
        // エラー時は元に戻す
        await fetchTasks();
        throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task label');
      throw err;
    }
  };

  const moveTaskToPosition = async (taskId: string, newLabel: string, targetIndex?: number) => {
    try {
      // ラベルを更新
      const { error } = await supabase
        .from('tasks')
        .update({ label: newLabel })
        .eq('id', taskId);

      if (error) throw error;

      // タスクの順序を更新（将来的にタスク内ソートを実装する場合）
      // 現在はラベル変更のみ実装
      
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move task');
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const reorderGroups = (newOrder: string[]) => {
    if (!user) return;
    setGroupOrder(newOrder);
    const storedOrderKey = `groupOrder_${user.id}`;
    localStorage.setItem(storedOrderKey, JSON.stringify(newOrder));
  };

  const createEmptyLabel = (labelName: string) => {
    if (!user) return;
    // 新しいラベルをグループ順序に追加
    if (!groupOrder.includes(labelName)) {
      const newOrder = [...groupOrder, labelName];
      setGroupOrder(newOrder);
      const storedOrderKey = `groupOrder_${user.id}`;
      localStorage.setItem(storedOrderKey, JSON.stringify(newOrder));
    }
  };

  const renameLabel = async (oldLabel: string, newLabel: string) => {
    try {
      // 新しいラベル名が既に存在するかチェック
      if (groupOrder.includes(newLabel) && newLabel !== oldLabel) {
        throw new Error(`ラベル「${newLabel}」は既に存在します`);
      }

      // そのラベルにタスクがあるかチェック
      const tasksWithLabel = tasks.filter(task => task.label === oldLabel);
      
      if (tasksWithLabel.length > 0) {
        // タスクがある場合はデータベースを更新
        const { error } = await supabase
          .from('tasks')
          .update({ label: newLabel })
          .eq('label', oldLabel);

        if (error) throw error;
      }

      // グループ順序を更新（タスクがあってもなくても）
      const newOrder = groupOrder.map(label => 
        label === oldLabel ? newLabel : label
      );
      setGroupOrder(newOrder);
      if (user) {
        const storedOrderKey = `groupOrder_${user.id}`;
        localStorage.setItem(storedOrderKey, JSON.stringify(newOrder));
      }

      // タスクがある場合のみfetchTasks()を実行
      if (tasksWithLabel.length > 0) {
        await fetchTasks();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename label');
      throw err;
    }
  };

  const deleteLabel = async (labelToDelete: string) => {
    try {
      // そのラベルに含まれるタスクを取得
      const tasksWithLabel = tasks.filter(task => task.label === labelToDelete);
      
      if (tasksWithLabel.length > 0) {
        // タスクがある場合は全て削除
        for (const task of tasksWithLabel) {
          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', task.id);

          if (error) throw error;
        }
      }

      // ラベルグループを削除
      const newOrder = groupOrder.filter(label => label !== labelToDelete);
      setGroupOrder(newOrder);
      if (user) {
        const storedOrderKey = `groupOrder_${user.id}`;
        localStorage.setItem(storedOrderKey, JSON.stringify(newOrder));
      }
      
      // タスクリストを更新
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete label');
      throw err;
    }
  };

  const getTaskGroups = (): TaskGroup[] => {
    const groups: { [key: string]: Task[] } = {};
    
    tasks.forEach(task => {
      if (!groups[task.label]) {
        groups[task.label] = [];
      }
      groups[task.label].push(task);
    });

    // position値が存在する場合はposition順、そうでなければ作成日順でソート
    Object.keys(groups).forEach(label => {
      groups[label].sort((a, b) => {
        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position;
        } else {
          // positionがない場合は作成日順でソート
          return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
        }
      });
    });

    // 空のラベルグループも含めて表示
    return groupOrder.map(label => ({
      label,
      tasks: groups[label] || []
    }));
  };

  // タスクの並び替え機能
  const reorderTasksInGroup = async (label: string, taskIds: string[]) => {
    try {
      // position列が存在するかチェック
      const { data: sampleData, error: checkError } = await supabase
        .from('tasks')
        .select('position')
        .limit(1);

      if (checkError && checkError.message.includes('position')) {
        // position列がない場合は並び替えを行わない（作成順で表示）
        return;
      }

      // 各タスクのpositionを更新
      const updates = taskIds.map((taskId, index) => 
        supabase
          .from('tasks')
          .update({ position: index + 1 })
          .eq('id', taskId)
      );

      await Promise.all(updates);
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder tasks');
      throw err;
    }
  };

  // タスクを別のグループの特定位置に移動（楽観的更新版）
  const moveTaskToGroupPosition = async (taskId: string, targetLabel: string, targetIndex: number) => {
    // 1. 即座にローカル状態を更新
    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) {
      throw new Error('Task not found');
    }

    const targetGroupTasks = tasks.filter(task => task.label === targetLabel && task.id !== taskId);
    
    // 新しいタスク配列を作成
    const newTargetTasks = [...targetGroupTasks];
    const updatedTask = { ...taskToMove, label: targetLabel };
    newTargetTasks.splice(targetIndex, 0, updatedTask);
    
    // position値を再設定
    const updatedTargetTasksWithPosition = newTargetTasks.map((task, index) => ({
      ...task,
      position: index + 1
    }));
    
    // 他のグループのタスクと結合
    const otherTasks = tasks.filter(t => t.label !== targetLabel && t.id !== taskId);
    const updatedTasks = [...otherTasks, ...updatedTargetTasksWithPosition];
    
    setTasks(updatedTasks);

    // 2. バックグラウンドでデータベース更新
    try {
      // position列が存在するかチェック
      const { data: sampleData, error: checkError } = await supabase
        .from('tasks')
        .select('position')
        .limit(1);

      if (checkError && checkError.message.includes('position')) {
        // position列がない場合は、単純にラベルのみ更新
        const { error } = await supabase
          .from('tasks')
          .update({ label: targetLabel })
          .eq('id', taskId);

        if (error) {
          await fetchTasks();
          throw error;
        }
      } else {
        // position列がある場合は、整数値でposition更新
        const newPosition = targetIndex + 1;
        
        const { error } = await supabase
          .from('tasks')
          .update({ label: targetLabel, position: newPosition })
          .eq('id', taskId);

        if (error) {
          await fetchTasks();
          throw error;
        }

        // 他のタスクのposition値も更新
        const updates = updatedTargetTasksWithPosition
          .filter(t => t.id !== taskId)
          .map((task, index) => 
            supabase
              .from('tasks')
              .update({ position: task.position })
              .eq('id', task.id)
          );

        await Promise.all(updates);
      }
    } catch (err) {
      // エラー時は元に戻す
      await fetchTasks();
      setError(err instanceof Error ? err.message : 'Failed to move task');
      throw err;
    }
  };

  return {
    tasks,
    error,
    setError,
    setTasks,
    fetchTasks,
    createTasks,
    updateTask,
    updateTaskLabel,
    updateTaskLabelOptimistic,
    moveTaskToPosition,
    deleteTask,
    getTaskGroups,
    reorderGroups,
    reorderTasksInGroup,
    moveTaskToGroupPosition,
    createEmptyLabel,
    renameLabel,
    deleteLabel,
  };
}