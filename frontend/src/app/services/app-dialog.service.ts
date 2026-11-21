import { Injectable, signal } from '@angular/core';

export type AppDialogKind = 'info' | 'success' | 'warning';

export interface AppDialogMessage {
  title: string;
  message: string;
  kind: AppDialogKind;
  confirmAction?: () => void;
  confirmLabel?: string;
  confirmTone?: 'default' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class AppDialogService {
  readonly current = signal<AppDialogMessage | null>(null);

  show(title: string, message: string, kind: AppDialogKind = 'info'): void {
    this.current.set({ title, message, kind });
  }

  showConfirmation(
    title: string,
    message: string,
    confirmAction: () => void,
    confirmLabel = 'Confirm',
    confirmTone: 'default' | 'danger' = 'default'
  ): void {
    this.current.set({ title, message, kind: 'warning', confirmAction, confirmLabel, confirmTone });
  }

  confirm(): void {
    const action = this.current()?.confirmAction;
    this.close();
    action?.();
  }

  close(): void {
    this.current.set(null);
  }
}
