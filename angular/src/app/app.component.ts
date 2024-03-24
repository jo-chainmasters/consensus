import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TableModule } from 'primeng/table';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { BlockHeaderComponent } from '../components/block-header/block-header.component';
import { PrevotesComponent } from '../components/prevotes/prevotes.component';
import { TreeTableModule, TreeTableNodeExpandEvent } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import {
  Round,
  Commit,
  Pre,
  CommitType,
  BondStatus,
  Precommit,
  Prevote,
} from '../../../src/model/Block';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { TagModule } from 'primeng/tag';

const baseUrlApp = 'http://localhost:4000/blocks/';
const baseUrlRpc = 'https://rpc1.unification.io/';
const baseUrlRest = 'https://rest.unification.io/';

interface Column {
  field: string;
  header: string;
  type: boolean;
  boundstate: boolean;
}

@Component({
  selector: 'app-root',
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
    NgIf,
    TagModule,
    NgClass,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'angular-test';

  block: any;
  rpcBlock: any;
  _rounds: string[] = [];
  inputBlockHeight = 9727991;
  cols: Column[] = [];
  treeTableValue: TreeNode[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cols = [
      { field: 'round', header: 'Round', type: false, boundstate: false },
      { field: 'commits', header: 'Commits', type: false, boundstate: false },
      { field: 'precommits', header: 'Precommits', type: false, boundstate: false,      },
      { field: 'prevotes', header: 'Prevotes', type: false, boundstate: false },
      { field: 'name', header: 'Validator', type: false, boundstate: false,      },
      {
        field: 'timestamp',
        header: 'Timestamp',
        type: false,
        boundstate: false,
      },
      {
        field: 'blockHash',
        header: 'blockHash',
        type: false,
        boundstate: false,
      },
      //   { field: 'validatorHash',  header: 'validatorHash',   type: false,    boundstate: false,      },
      // { field: 'validatorIndex', header: 'validatorIndex', type: false,  boundstate: false,     },
      //  { field: 'status', header: 'status', type: false, boundstate: false },
      //  {field: 'operatorAddress', header: 'operatorAddress', type: false,  boundstate: false, },

      //  { field: 'identity', header: 'identity', type: false, boundstate: false },
      //  { field: 'website', header: 'website', type: false, boundstate: false },
      //  { field: 'emailAddress', header: 'emailAddress', type: false,boundstate: false, },
      // { field: 'blocktyp', header: 'blocktyp', type: true, boundstate: false },
      //{  field: 'bondStatus', header: 'BondStatus',type: true, boundstate: true, },

    ];
  }

  get nodeHeightTree() {
    const rounds: TreeNode[] = [];
    const roundCommitNode: TreeNode<any> = this.initDefaultCommitsNode();
    const roundPreCommitNode: TreeNode<any> = this.initDefaultPreCommitsNode();
    const roundPreVoteNode: TreeNode<any> = this.initDefaultPreVoteNode();
    let roundCommits: TreeNode<any>[] = [];
    let roundPrevote: TreeNode<any>[] = [];
    let roundPreCommits: TreeNode<any>[] = [];

    for (const round of this._rounds) {
      const nodeRound: TreeNode = {
        data: {
          round: round,
          commits: 'commits',
          precommits: 'precommits',
          prevotes: 'prevotes',
          name: '',
          timestamp: '',
          blocktyp: '',
          blockHash: '',
        },
        children: [],
        expanded: Number(round) === 0,
      };
      roundCommits = this.loadCommitsToTreeNode(round);
      roundPreCommits = this.loadPreCommitToTreeNode(round);
      roundPrevote = this.loadPreVoteToTreeNode(round);

      roundCommitNode.children?.push(...roundCommits);
      roundPreVoteNode.children?.push(...roundPrevote);
      roundPreCommitNode.children?.push(...roundPreCommits);
      nodeRound.children?.push(roundCommitNode);
      nodeRound.children?.push(roundPreVoteNode);
      nodeRound.children?.push(roundPreCommitNode);
      rounds.push(nodeRound);
    }
    console.log('nodeTree._rounds:', rounds);
    return rounds;
  }

  getRounds() {
    return this._rounds;
  }

  getPrevotes(round: string): Pre[] {
    if (this.block) {
      return this.block.rounds[round].prevote;
    } else {
      return [];
    }
  }

  getCommitsByRound(round: string): Commit[] {
    if (this.block) {
      return this.block.rounds[round].commits;
    } else {
      return [];
    }
  }

  getPreCommitsByRound(round: string): Precommit[] {
    if (this.block) {
      return this.block.rounds[round].precommits;
    } else {
      return [];
    }
  }

  getPreVoteByRound(round: string): Prevote[] {
    if (this.block) {
      return this.block.rounds[round].prevotes;
    } else {
      return [];
    }
  }

  private getConsensus(blockHeight: number) {
    return this.getHttp(baseUrlApp + blockHeight);
  }

  private getCommits(blockHeight: number) {
    return this.getHttp(baseUrlRpc + 'commit?height=' + blockHeight);
  }

  private getHttp(url: string) {
    return this.http.get(url);
  }

  loadBlockHeight() {
    if (this.inputBlockHeight) {
      const obsConsensus = this.getConsensus(this.inputBlockHeight);
      const obsCommit = this.getCommits(this.inputBlockHeight);

      forkJoin([obsConsensus, obsCommit]).subscribe((result: any[]) => {
        console.log('forkJoin.result:', result);
        this.block = result[0];
        this.rpcBlock = result[1].result.signed_header;
        this._rounds = Object.keys(this.block?.rounds); //  wenn mehrere Rounden stattfinden

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

  getSeverityCommitType(commitType: CommitType) {
    switch (commitType) {
      case CommitType.COMMIT:
        return 'success';
      case CommitType.ABSENT:
        return 'warning';
      case CommitType.NIL:
      case CommitType.UNKNOWN:
        return 'danger';
    }
  }

  getSeverityBoundStatus(bondStatus: BondStatus) {
    switch (bondStatus.toString()) {
      case BondStatus.BONDED.toString():
        return 'success';
      case BondStatus.UNBONDING.toString():
        return 'warning';
      case BondStatus.UNKNOWN.toString():
      case BondStatus.UNBONDED.toString():
        return 'danger';
    }
    return '';
  }

  loadCommitsToTreeNode(round: string): TreeNode[] {
    const roundCommits: TreeNode<any>[] = [];
    for (const pre of this.getCommitsByRound(round)) {
      const nodeCommit: TreeNode = {
        data: {
          round: '',
          commits: '>',
          precommits: '',
          prevotes: '',
          name: pre.validator?.name,
          timestamp: pre.timestamp,
          blocktyp: pre.commitType,
          blockHash: pre.blockHash,

        },
        children: [],
        expanded: Number(round) === 0,
      };
      roundCommits.push(nodeCommit);
    }
    return roundCommits;
  }

  private loadPreVoteToTreeNode(round: string) {
    const roundPreVotes: TreeNode<any>[] = [];
    for (const pre of this.getPreVoteByRound(round)) {
      const nodeCommit: TreeNode = {
        data: {
          round: '',
          commits: '',
          precommits: '',
          prevotes: '>',
          name: pre.validator?.name,
          timestamp: pre.timestamp,
          blocktyp: '',
          blockHash: pre.blockHash,
        },
        children: [],
        expanded: Number(round) === 0,
      };
      roundPreVotes.push(nodeCommit);
    }
    return roundPreVotes;
  }

  private loadPreCommitToTreeNode(round: string) {
    const roundPreCommit: TreeNode<any>[] = [];
    for (const pre of this.getPreVoteByRound(round)) {
      const nodeCommit: TreeNode = {
        data: {
          round: '',
          commits: '',
          precommits: '>',
          prevotes: '',
          name: pre.validator?.name,
          timestamp: pre.timestamp,
          blocktyp: '',
          blockHash: pre.blockHash,
        },
        children: [],
        expanded: Number(round) === 0,
      };
      roundPreCommit.push(nodeCommit);
    }
    return roundPreCommit;
  }

  initDefaultCommitsNode() {
    return {
      data: {
        round: '',
        commits: 'commit',
        precommits: '',
        prevotes: '',
        name: '',
        timestamp: '',
        blocktyp: '',
        blockHash: '',
      },
      children: [],
      expanded: false,
    };
  }

  initDefaultPreCommitsNode() {
    return {
      data: {
        round: '',
        commits: '',
        precommits: 'precommits',
        prevotes: '',
        name: '',
        timestamp: '',
        blocktyp: '',
        blockHash: '',
      },
      children: [],
      expanded: false,
    };
  }

  initDefaultPreVoteNode() {
    return {
      data: {
        round: '',
        commits: '',
        precommits: '',
        prevotes: 'prevotes',
        name: '',
        timestamp: '',
        blocktyp: '',
        blockHash: '',
      },
      children: [],
      expanded: false,
    };
  }
}
