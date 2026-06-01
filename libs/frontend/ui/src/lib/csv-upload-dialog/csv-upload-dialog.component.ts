import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA, DIALOG_REF } from '../dialog/dialog-ref';
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
  imports: [CommonModule, FormsModule],
})
export class CsvUploadDialogComponent {
  format: 'degiro' | 'yahoo' = 'degiro';
  mode: 'replace' | 'merge' = 'replace';
  fileName = '';
  rows: unknown[] = [];
  isDragging = false;

  constructor(
    @Inject(DIALOG_REF) public dialogRef: DialogRef<CsvUploadDialogComponent, CsvUploadResult | undefined>,
    @Inject(DIALOG_DATA) public data: CsvUploadDialogData,
    private papa: Papa,
    private cdr: ChangeDetectorRef
  ) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.parseFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.parseFile(file);
  }

  private parseFile(file: File) {
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
