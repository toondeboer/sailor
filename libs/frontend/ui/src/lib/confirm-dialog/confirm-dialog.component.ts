import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA, DIALOG_REF } from '../dialog/dialog-ref';

export type ConfirmDialogData = {
  title: string;
  message: string;
  confirmLabel?: string;
};

@Component({
  selector: 'aws-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  imports: [CommonModule],
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(DIALOG_REF) public dialogRef: DialogRef<ConfirmDialogComponent, boolean>,
    @Inject(DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
