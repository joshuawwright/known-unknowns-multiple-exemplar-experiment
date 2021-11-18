import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { timer } from 'rxjs';
import { fadeOut } from '../../animations/fade-out.animation';
import { FADE_OUT_DURATION_MS } from '../../trial/fade-out-duration';

export interface BlockButtonDialogData {
  disableClose?: boolean;
  text: string;
}

@Component({
  selector: 'block-start-dialog',
  templateUrl: './block-button-dialog.component.html',
  styleUrls: ['./block-button-dialog.component.css'],
  animations: [
    fadeOut({ duration: FADE_OUT_DURATION_MS })
  ]
})
export class BlockButtonDialogComponent {
  animated = false;
  disableClose = Boolean(this.data.disableClose);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BlockButtonDialogData,
    readonly ref: MatDialogRef<BlockButtonDialogComponent>
  ) { }

  async close() {
    this.animated = true;
    await timer(FADE_OUT_DURATION_MS).toPromise();
    this.ref.close();
  }

}