import { Component, Input } from "@angular/core";
import { CardModule } from "primeng/card";
import { JsonPipe, NgIf } from "@angular/common";

@Component({
  selector: 'app-block-header',
  standalone: true,
  imports: [
    CardModule,
    NgIf,
    JsonPipe
  ],
  templateUrl: './block-header.component.html',
  styleUrl: './block-header.component.css'
})
export class BlockHeaderComponent {

  private _blockHeader: any;

  @Input()
  set blockHeader(blockHeader: any) {
    this._blockHeader = blockHeader;
    console.log(blockHeader);
  }

  get blockHeader() {
    return this._blockHeader;
  }

}
