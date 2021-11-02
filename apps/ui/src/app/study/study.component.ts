import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { Block } from '../block/block';
import { BlockComponent } from '../block/block.component';
import { StudyConditionService } from '../study-conditions/study-condition.service';
import { StudyConfig } from '../study-config-form/study-config';

@Component({
  selector: 'study',
  templateUrl: './study.component.html',
  styleUrls: ['./study.component.scss']
})
export class StudyComponent implements OnInit {

  @ViewChild(BlockComponent, { static: true }) blockComponent!: BlockComponent;
  blocks: Block[] = [];
  completed = new EventEmitter();
  config: StudyConfig|undefined;

  constructor(
    readonly conditionsSvc: StudyConditionService
  ) {
  }

  nextBlock() {
    if (this.blocks.length > 0) {
      this.blocks.shift()?.start(this.blockComponent);
    } else {
      this.completed.emit();
    }
  }

  async ngOnInit(): Promise<void> {
    this.blocks = await this.conditionsSvc.blocks$().toPromise();
    this.nextBlock();
  }

}