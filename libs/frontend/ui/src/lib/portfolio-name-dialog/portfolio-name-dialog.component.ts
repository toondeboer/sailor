import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA, DIALOG_REF } from '../dialog/dialog-ref';

export type PortfolioNameDialogData = {
  title: string;
  initialName?: string;
};

@Component({
  selector: 'aws-portfolio-name-dialog',
  templateUrl: './portfolio-name-dialog.component.html',
  styleUrls: ['./portfolio-name-dialog.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class PortfolioNameDialogComponent {
  name: string;

  constructor(
    @Inject(DIALOG_REF) public dialogRef: DialogRef<PortfolioNameDialogComponent, string>,
    @Inject(DIALOG_DATA) public data: PortfolioNameDialogData
  ) {
    this.name = data.initialName ?? '';
  }

  confirm() {
    if (this.name.trim()) {
      this.dialogRef.close(this.name.trim());
    }
  }

  cancel() {
    this.dialogRef.close(undefined);
  }
}
