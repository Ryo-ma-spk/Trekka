import { useState, useEffect } from "react";
import { Plus, FolderPlus, LogOut, Calendar } from "lucide-react";
import { TaskGroup } from "./components/TaskGroup";
import { TaskModal } from "./components/TaskModal";
import { EditTaskModal } from "./components/EditTaskModal";
import { AuthForm } from "./components/AuthForm";
import { SignupComplete } from "./components/SignupComplete";
import { PasswordReset } from "./components/PasswordReset";
import { PasswordResetComplete } from "./components/PasswordResetComplete";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useTasks } from "./hooks/useTasks";
import type { Task } from "./types";
import "./App.css";

function TodoApp() {
  // *** すべてのフックを最上部で呼ぶ（Reactのルール） ***
  const { user, loading: authLoading, signOut, isSignupComplete, isPasswordReset, isPasswordResetComplete, clearSignupComplete, clearPasswordReset, clearPasswordResetComplete } = useAuth();
  
  // useState フック
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultLabel, setDefaultLabel] = useState<string>("");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGroupDragging, setIsGroupDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dropPreview, setDropPreview] = useState<{ groupLabel: string; index: number } | null>(null);
  
  // カスタムフック
  const {
    tasks,
    error,
    setError,
    setTasks,
    fetchTasks,
    createTasks,
    moveTaskToGroupPosition,
    reorderTasksInGroup,
    updateTask,
    deleteTask,
    getTaskGroups,
    reorderGroups,
    createEmptyLabel,
    renameLabel,
    deleteLabel,
  } = useTasks();

  // イベントハンドラー関数の定義
  const handleMouseDown = (e: React.MouseEvent, task: Task) => {
    if ((e.target as HTMLElement).closest(".task-actions")) {
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setMousePos({ x: e.clientX, y: e.clientY });
    setDraggedTask(task);
    setIsDragging(true);
  };

  const handleGroupMouseDown = (e: React.MouseEvent, groupLabel: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setMousePos({ x: e.clientX, y: e.clientY });
    setDraggedGroup(groupLabel);
    setIsGroupDragging(true);
  };

  const handleGroupDrop = async (e: MouseEvent) => {
    if (!isGroupDragging || !draggedGroup) return;

    setIsGroupDragging(false);
    const currentDraggedGroup = draggedGroup;
    setDraggedGroup(null);

    const taskGroupsContainer = document.querySelector(".task-groups");
    const groupElements = Array.from(taskGroupsContainer?.querySelectorAll(".task-group:not(.group-dragging)") || []);

    let insertIndex = groupElements.length;

    for (let i = 0; i < groupElements.length; i++) {
      const rect = groupElements[i].getBoundingClientRect();
      const groupCenter = rect.left + rect.width / 2;

      if (e.clientX < groupCenter) {
        insertIndex = i;
        break;
      }
    }

    const currentGroups = getTaskGroups().map((g) => g.label);
    const currentIndex = currentGroups.indexOf(currentDraggedGroup);

    if (currentIndex !== -1 && currentIndex !== insertIndex && currentIndex !== insertIndex - 1) {
      const newOrder = [...currentGroups];
      const [movedGroup] = newOrder.splice(currentIndex, 1);
      newOrder.splice(insertIndex > currentIndex ? insertIndex - 1 : insertIndex, 0, movedGroup);
      reorderGroups(newOrder);
    }
  };

  // useEffect フック
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "n") {
        event.preventDefault();
        setDefaultLabel("");
        setIsModalOpen(true);
      }
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setIsEditModalOpen(false);
        setEditingTask(null);
        setDefaultLabel("");
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if ((!isDragging || !draggedTask) && (!isGroupDragging || !draggedGroup)) return;

      setMousePos({ x: e.clientX, y: e.clientY });

      if (isDragging && draggedTask) {
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
        const taskGroupElement = elementBelow?.closest(".task-group");

        if (taskGroupElement) {
          const targetGroupLabel = taskGroupElement.getAttribute("data-group-label");
          if (targetGroupLabel) {
            const taskList = taskGroupElement.querySelector(".task-list");
            const taskCards = Array.from(taskList?.querySelectorAll(".task-card:not(.dragging)") || []);

            let insertIndex = taskCards.length;

            if (targetGroupLabel === draggedTask.label) {
              for (let i = 0; i < taskCards.length; i++) {
                const rect = taskCards[i].getBoundingClientRect();
                const cardCenter = rect.top + rect.height / 2;

                if (e.clientY < cardCenter) {
                  insertIndex = i;
                  break;
                }
              }
            } else {
              for (let i = 0; i < taskCards.length; i++) {
                const rect = taskCards[i].getBoundingClientRect();
                const cardCenter = rect.top + rect.height / 2;

                if (e.clientY < cardCenter) {
                  insertIndex = i;
                  break;
                }
              }
            }

            setDropPreview({ groupLabel: targetGroupLabel, index: insertIndex });
          } else {
            setDropPreview(null);
          }
        } else {
          setDropPreview(null);
        }
      }
    };

    const handleMouseUp = async (e: MouseEvent) => {
      if (isDragging && draggedTask) {
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
        const taskGroupElement = elementBelow?.closest(".task-group");
        const currentDraggedTask = draggedTask;

        setIsDragging(false);
        setDraggedTask(null);
        setDropPreview(null);

        if (taskGroupElement) {
          const targetGroupLabel = taskGroupElement.getAttribute("data-group-label");

          if (targetGroupLabel) {
            const taskList = taskGroupElement.querySelector(".task-list");
            const taskCards = Array.from(taskList?.querySelectorAll(".task-card:not(.dragging)") || []);

            let insertIndex = taskCards.length;

            for (let i = 0; i < taskCards.length; i++) {
              const rect = taskCards[i].getBoundingClientRect();
              const cardCenter = rect.top + rect.height / 2;

              if (e.clientY < cardCenter) {
                insertIndex = i;
                break;
              }
            }

            if (targetGroupLabel === currentDraggedTask.label) {
              const currentGroup = getTaskGroups().find((g) => g.label === targetGroupLabel);
              if (currentGroup) {
                const currentIndex = currentGroup.tasks.findIndex((t) => t.id === currentDraggedTask.id);
                let actualInsertIndex = insertIndex;

                if (currentIndex < insertIndex) {
                  actualInsertIndex = insertIndex + 1;
                }

                if (currentIndex !== actualInsertIndex && currentIndex !== actualInsertIndex - 1) {
                  const newTaskOrder = [...currentGroup.tasks];
                  const [movedTask] = newTaskOrder.splice(currentIndex, 1);
                  newTaskOrder.splice(
                    actualInsertIndex > currentIndex ? actualInsertIndex - 1 : actualInsertIndex,
                    0,
                    movedTask
                  );

                  const taskIds = newTaskOrder.map((t) => t.id);
                  const reorderedTasks = [...tasks];
                  const otherTasks = reorderedTasks.filter((t) => t.label !== targetGroupLabel);
                  const updatedTargetTasks = newTaskOrder.map((task, index) => ({
                    ...task,
                    position: index + 1,
                  }));

                  setTasks([...otherTasks, ...updatedTargetTasks]);

                  try {
                    await reorderTasksInGroup(targetGroupLabel, taskIds);
                  } catch (error) {
                    await fetchTasks();
                    setError("タスクの並び替えに失敗しました");
                  }
                }
              }
            } else {
              try {
                await moveTaskToGroupPosition(currentDraggedTask.id, targetGroupLabel, insertIndex);
              } catch (error) {
                setError("タスクの移動に失敗しました");
              }
            }
          }
        }
        return;
      }

      if (isGroupDragging && draggedGroup) {
        await handleGroupDrop(e);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, draggedTask, isGroupDragging, draggedGroup, tasks, getTaskGroups, setError, fetchTasks, setTasks, reorderTasksInGroup, moveTaskToGroupPosition]);

  // 認証中は何も表示しない（読み込み画面削除）
  if (authLoading) {
    return null;
  }

  // パスワードリセット完了画面（最優先）
  if (isPasswordResetComplete) {
    return (
      <PasswordResetComplete 
        onComplete={clearPasswordResetComplete}
      />
    );
  }

  // パスワードリセット画面
  if (isPasswordReset && user) {
    return (
      <PasswordReset 
        onComplete={clearPasswordReset}
      />
    );
  }

  // アカウント登録完了画面
  if (isSignupComplete && user) {
    return (
      <SignupComplete 
        onComplete={clearSignupComplete}
      />
    );
  }

  // 未認証の場合はログインフォーム
  if (!user) {
    return <AuthForm />;
  }

  // ユーティリティ関数
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleSaveTask = (taskId: string, updates: Partial<Task>) => {
    updateTask(taskId, updates);
  };

  const handleRenameGroup = async (oldLabel: string, newLabel: string) => {
    try {
      await renameLabel(oldLabel, newLabel);
    } catch (error) {
      setError("グループ名の変更でエラーが発生しました");
    }
  };

  const handleCreateNewLabel = () => {
    try {
      let labelName = "新しいラベル";
      let counter = 1;

      const taskGroups = getTaskGroups();
      while (taskGroups.some((group) => group.label === labelName)) {
        labelName = `新しいラベル${counter}`;
        counter++;

        if (labelName.length > 15) {
          labelName = `ラベル${counter}`;
          if (labelName.length > 15) {
            labelName = `L${counter}`;
          }
        }
      }

      createEmptyLabel(labelName);
    } catch (error) {
      setError("新しいラベルの作成でエラーが発生しました");
    }
  };

  const handleDeleteLabel = async (labelToDelete: string) => {
    try {
      await deleteLabel(labelToDelete);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("ラベルグループとタスクの削除でエラーが発生しました");
      }
    }
  };

  const handleAddTaskFromGroup = (groupLabel: string) => {
    setDefaultLabel(groupLabel);
    setIsModalOpen(true);
  };

  const handleCreateTaskDirect = async (title: string, label: string, startDate: Date, endDate: Date) => {
    try {
      const taskData = {
        title: title.trim(),
        label: label,
        startDate: startDate,
        endDate: endDate,
      };

      await createTasks([taskData]);
    } catch (error) {
      setError("タスクの作成でエラーが発生しました");
    }
  };

  if (error) return <div className="error">エラー: {error}</div>;

  const taskGroups = getTaskGroups();

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-content">
          <div className="header-left">
            <h1>Trekka</h1>
          </div>
          <div className="header-right">
            <div className="header-actions">
              <button
                className="header-btn header-btn-task"
                onClick={() => {
                  setDefaultLabel("");
                  setIsModalOpen(true);
                }}
                title="新しいタスクを作成"
              >
                <Plus size={18} />
                新しいタスク
              </button>
              <button className="header-btn header-btn-label" onClick={handleCreateNewLabel} title="新しいラベルを作成">
                <FolderPlus size={18} />
                新しいラベル
              </button>
            </div>
            <div className="user-section">
              <span className="user-email">{user.email}</span>
              <button className="logout-btn-header" onClick={signOut} title="ログアウト">
                <LogOut size={16} />
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="task-groups-container">
        <div className="task-groups">
          {taskGroups.map((group) => (
            <TaskGroup
              key={group.label}
              group={group}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onRenameGroup={handleRenameGroup}
              onDeleteGroup={handleDeleteLabel}
              onAddTask={handleAddTaskFromGroup}
              onCreateTaskDirect={handleCreateTaskDirect}
              onMouseDown={handleMouseDown}
              onGroupMouseDown={handleGroupMouseDown}
              draggedTask={draggedTask}
              draggedGroup={draggedGroup}
              isDragging={isDragging}
              isGroupDragging={isGroupDragging}
              dropPreview={dropPreview}
            />
          ))}
        </div>
      </div>

      {/* ドラッグゴースト */}
      {isDragging && draggedTask && (
        <div
          className="drag-ghost"
          style={{
            position: "fixed",
            left: mousePos.x - dragOffset.x,
            top: mousePos.y - dragOffset.y,
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          <div className="task-card dragging">
            <div className="task-card-header">
              <div className="task-content">
                <h3>{draggedTask.title}</h3>
              </div>
            </div>
            <div className="task-info">
              <div className="task-period">
                <Calendar size={14} />
                {draggedTask.period}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* グループドラッグゴースト */}
      {isGroupDragging && draggedGroup && (
        <div
          className="group-drag-ghost"
          style={{
            position: "fixed",
            left: mousePos.x - dragOffset.x,
            top: mousePos.y - dragOffset.y,
            pointerEvents: "none",
            zIndex: 1000,
            opacity: 0.8,
            transform: "rotate(2deg) scale(1.05)",
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "16px",
            padding: "1rem",
            border: "2px solid #667eea",
            minWidth: "300px",
          }}
        >
          <h3 style={{ margin: 0, color: "#172b4d", fontSize: "16px", fontWeight: "700" }}>📁 {draggedGroup}</h3>
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDefaultLabel("");
        }}
        onSubmit={createTasks}
        defaultLabel={defaultLabel}
        availableLabels={getTaskGroups().map(group => group.label)}
      />

      <EditTaskModal
        isOpen={isEditModalOpen}
        task={editingTask}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        availableLabels={getTaskGroups().map(group => group.label)}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <TodoApp />
    </AuthProvider>
  );
}

export default App;