import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Papa } from 'ngx-papaparse';

export type CsvUploadDialogData = { portfolioId: string };

export type CsvUploadResult = {
  portfolioId: string;
  format: 'degiro' | 'yahoo';
  mode: 'replace' | 'merge';
  rows: unknown[];
};

@Component({
  selector: 'aws-csv-upload-dialog',
  templateUrl: './csv-upload-dialog.component.html',
  styleUrls: ['./csv-upload-dialog.component.scss'],
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatRadioModule, MatSelectModule, MatFormFieldModule],
})
export class CsvUploadDialogComponent {
  format: 'degiro' | 'yahoo' = 'degiro';
  mode: 'replace' | 'merge' = 'replace';
  fileName = '';
  rows: unknown[] = [];

  constructor(
    public dialogRef: MatDialogRef<CsvUploadDialogComponent, CsvUploadResult | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: CsvUploadDialogData,
    private papa: Papa,
    private cdr: ChangeDetectorRef
  ) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.fileName = file.name;
    this.papa.parse(file, {
      header: true,
      complete: (result) => {
        this.rows = result.data;
        this.cdr.detectChanges();
      },
    });
  }

  confirm() {
    if (this.rows.length === 0) return;
    this.dialogRef.close({
      portfolioId: this.data.portfolioId,
      format: this.format,
      mode: this.mode,
      rows: this.rows,
    });
  }

  cancel() {
    this.dialogRef.close(undefined);
  }
}
