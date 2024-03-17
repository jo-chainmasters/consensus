import { Component, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TableModule } from "primeng/table";
import { HttpClient } from "@angular/common/http";
import { forkJoin } from "rxjs";
import { BlockHeaderComponent } from "../components/block-header/block-header.component";
import { PrevotesComponent } from "../components/prevotes/prevotes.component";
import { TreeTableModule } from "primeng/treetable";
import { TreeNode } from "primeng/api";

const baseUrlApp = "http://localhost:4000/blocks/";
const baseUrlRpc = "https://rpc1.unification.io/";
const baseUrlRest = "https://rest.unification.io/";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    RouterOutlet,
    TableModule,
    BlockHeaderComponent,
    PrevotesComponent,
    TreeTableModule
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css"
})
export class AppComponent implements OnInit {
  title = "angular-test";

  block: any;
  rpcBlock: any;
  _rounds: string[] = [];

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    const obsConsensus = this.getConsensus(9687600);
    const obsCommit = this.getCommits(9687600);

    forkJoin([obsConsensus, obsCommit]).subscribe((result: any[]) => {
      console.log('forkJoin.result:', result);
      this.block = result[0];
      this.rpcBlock = result[1].result.signed_header;
      this._rounds = Object.keys(this.block.rounds[0].prevote); //  wenn mehrere Rounden stattfinden

      console.log('forkJoin.block:', result[0]);
      console.log('forkJoin.rpcBlock:', result[1]);
      console.log('forkJoin._rounds:', this._rounds);
    });
  }

  get bla() {
    console.log('bla._rounds:', this._rounds);
    const rounds: TreeNode[] = [];
    for (const round of this._rounds) {
      const node: TreeNode = {
        data: {
          validator: 'Round 0',
          timestamp: 'timestamp',
          type: 'Folder',
        },
        children: []
      };
      rounds.push(node);

      const steps = [
        "prevote",
        "precommit",
        "commit",
        "prevotes",
        "precommits"
      ];
      for (const step of steps) {
        const stepNode: TreeNode = {
          data: {
            validator: "step",
            timestamp: "timestamp"
          },
          children: []
        };
        node.children?.push(stepNode);
      }

      // const value = this.block.rounds[round][step];
      // for (const v of value) {
      //   stepNode.children?.push({
      //     validator: v.validator,
      //     timestamp: v.timestamp,
      //     type: 'Application',
      //   });
      // }
    }

    console.log("rounds-ui:", rounds);
    return rounds;
  }

  getRounds() {
    return this._rounds;
  }

  getPrevotes(round: string) {
    if (this.block) {
      return this.block.votes.prevote[round];
    } else {
      return [];
    }
  }

  get commits() {
    return this.rpcBlock.commit.signatures;
  }

  private getConsensus(blockHeight: number) {
    return this.getHttp(baseUrlApp + blockHeight);
  }

  private getCommits(blockHeight: number) {
    return this.getHttp(baseUrlRpc + "commit?height=" + blockHeight);
  }

  private getHttp(url: string) {
    return this.http.get(url);
  }
}
