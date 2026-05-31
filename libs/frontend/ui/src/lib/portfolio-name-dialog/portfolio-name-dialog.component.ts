import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export type PortfolioNameDialogData = {
  title: string;
  initialName?: string;
};

@Component({
  selector: 'aws-portfolio-name-dialog',
  templateUrl: './portfolio-name-dialog.component.html',
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
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
