import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export type PortfolioNameDialogData = {
  title: string;
  initialName?: string;
};

@Component({
  selector: 'aws-portfolio-name-dialog',
  templateUrl: './portfolio-name-dialog.component.html',
  styleUrls: ['./portfolio-name-dialog.component.scss'],
  imports: [CommonModule, FormsModule, MatDialogModule],
})
export class PortfolioNameDialogComponent {
  name: string;

  constructor(
    public dialogRef: MatDialogRef<PortfolioNameDialogComponent, string>,
    @Inject(MAT_DIALOG_DATA) public data: PortfolioNameDialogData
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
