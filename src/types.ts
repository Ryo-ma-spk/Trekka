export interface Task {
  id: string;
  title: string;
  period: string;
  label: string;
  position?: number;
  user_id?: string;
  created_at?: string;
}

export interface TaskGroup {
  label: string;
  tasks: Task[];
}

export interface TaskFormData {
  title: string;
  label: string;
  startDate: Date | null;
  endDate: Date | null;
}

export interface TaskFormData_Extended extends TaskFormData {
  // 拡張用のインターフェース
}