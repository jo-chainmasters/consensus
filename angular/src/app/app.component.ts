import { Component, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TableModule } from "primeng/table";
import { HttpClient } from "@angular/common/http";
import { forkJoin } from "rxjs";
import { BlockHeaderComponent } from "../components/block-header/block-header.component";
import { PrevotesComponent } from "../components/prevotes/prevotes.component";
import { TreeTableModule, TreeTableNodeExpandEvent } from "primeng/treetable";
import { TreeNode } from "primeng/api";
import { InputTextModule } from "primeng/inputtext";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { Round, Vote } from "../../../src/model/Block";
import { NgForOf, NgIf } from "@angular/common";

const baseUrlApp = "http://localhost:4000/blocks/";
const baseUrlRpc = "https://rpc1.unification.io/";
const baseUrlRest = "https://rest.unification.io/";

interface Column {
  field: string;
  header: string;
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    RouterOutlet,
    TableModule,
    BlockHeaderComponent,
    PrevotesComponent,
    TreeTableModule,
    InputTextModule,
    FormsModule,
    ButtonModule,
    NgForOf,
    NgIf
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css"
})
export class AppComponent implements OnInit {
  title = "angular-test";

  block: any;
  rpcBlock: any;
  _rounds: string[] = [];
  inputBlockHeight = 9727991;
  cols: Column[] = [];
  treeTableValue: TreeNode[] =[];

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.cols = [
      { field: "round", header: "Round" },
      { field: "prevote", header: "prevote" },
      { field: "precommit", header: "precommit" },
      { field: "validatorHash", header: "validatorHash" },
      { field: "blockHash", header: "blockHash" },
      { field: "Timestamp", header: "Timestamp" },
      { field: "validatorIndex", header: "validatorIndex" }
    ];

  }

  get nodeHeightTree() {

    const rounds: TreeNode[] = [];
    let roundsVote: TreeNode[] = [];

    for (const round of this._rounds) {
      const nodeRound: TreeNode = {
        key: round,
        data: {
          round: round,
          prevote: "prevote",
          precommit: "precommit",
          validatorHash: "",
          timestamp: "",
          blockHash: "",
          validatorIndex: ""
        },
        children: [],
        expanded: Number(round) === 0
      };
      roundsVote = [];
      for (const vote of this.getPrevotes(round)) {

        const nodeVote: TreeNode = {
          key: round + "-" + vote.validatorIndex,
          data: {
            round: "",
            prevote: "",
            precommit: "",
            validatorHash: vote.validatorHash.toString(),
            timestamp: vote.timestamp,
            blockHash: "",
            validatorIndex: vote.validatorIndex.toString()
          },
          children: [],
          expanded: Number(round) === 0
        };
        roundsVote.push(nodeVote);

      }
      nodeRound.children = roundsVote;
      rounds.push(nodeRound);

    }
    console.log("nodeTree._rounds:", rounds);
    return rounds;
  }

  getRounds() {
    return this._rounds;
  }

  getPrevotes(round: string): Vote[] {
    if (this.block) {
      return this.block.rounds[round].prevote;
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

  loadBlockHeight() {
    if (this.inputBlockHeight) {
      const obsConsensus = this.getConsensus(this.inputBlockHeight);
      const obsCommit = this.getCommits(this.inputBlockHeight);

      forkJoin([obsConsensus, obsCommit]).subscribe((result: any[]) => {
        console.log("forkJoin.result:", result);
        this.block = result[0];
        this.rpcBlock = result[1].result.signed_header;
        this._rounds = Object.keys(this.block.rounds); //  wenn mehrere Rounden stattfinden

        this.treeTableValue = this.nodeHeightTree;
      });
    }

  }

  onNodeExpand(event: TreeTableNodeExpandEvent) {
    console.log('onNodeExpand', event.node);
    if (event?.node?.children) {
    //  event.node.children.forEach(
    //    (value) => (value.expanded = event.node.expanded),
    //  );
    }
  }

  expandNode($event: any, col: any) {
    
  }
}
