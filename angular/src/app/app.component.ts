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
import { CutdotPipe } from '../directives/cutdot.pipe';

const baseUrlApp = 'http://localhost:4000/blocks/';
const baseUrlRpc = 'https://rpc1.unification.io/';
const baseUrlRest = 'https://rest.unification.io/';

interface Column {
  field: string;
  header: string;
  type: boolean;
  bondStatus: boolean;
  hash: boolean;
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
    CutdotPipe,
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
  maxRound = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cols = [
      {
        field: 'round',
        header: 'Round',
        type: false,
        bondStatus: false,
        hash: false,
      },
      //{ field: 'commits', header: 'Commits', type: false, boundstate: false },
      // { field: 'precommits', header: 'Precommits', type: false, boundstate: false,      },
      //{ field: 'prevotes', header: 'Prevotes', type: false, boundstate: false },
      {
        field: 'name',
        header: 'Validator',
        type: false,
        bondStatus: false,
        hash: false,
      },
      {
        field: 'timestamp',
        header: 'Timestamp',
        type: false,
        bondStatus: false,
        hash: false,
      },
      {
        field: 'blockHash',
        header: 'blockHash',
        type: false,
        bondStatus: false,
        hash: true,
      },
      //   { field: 'validatorHash',  header: 'validatorHash',   type: false,    bondStatus: false,      },
      // { field: 'validatorIndex', header: 'validatorIndex', type: false,  bondStatus: false,     },

      //  {field: 'operatorAddress', header: 'operatorAddress', type: false,  bondStatus: false, },

      //  { field: 'identity', header: 'identity', type: false, bondStatus: false },
      //  { field: 'website', header: 'website', type: false, bondStatus: false },
      //  { field: 'emailAddress', header: 'emailAddress', type: false,bondStatus: false, },
      {
        field: 'blocktyp',
        header: 'blocktyp',
        type: true,
        bondStatus: false,
        hash: false,
      },
    {  field: 'bondStatus', header: 'BondStatus',  type: false,  bondStatus: true,  hash: false}
    ];
  }

  get nodeHeightTree() {
    const rounds: TreeNode[] = [];
    let roundCommitNode: TreeNode<any> = {};
    let roundPreCommitNode: TreeNode<any> = {};
    let roundPreVoteNode: TreeNode<any> = {};
    let roundCommits: TreeNode<any>[] = [];
    let roundPrevote: TreeNode<any>[] = [];
    let roundPreCommits: TreeNode<any>[] = [];

    for (const round of this._rounds) {
      roundCommitNode = this.initDefaultCommitsNode(round);
      roundPreCommitNode = this.initDefaultPreCommitsNode(round);
      roundPreVoteNode = this.initDefaultPreVoteNode(round);
      const nodeRound: TreeNode = {
        data: {
          round: 'Round: ' + round,
          name: '',
          timestamp: '',
          blocktyp: '',
          blockHash: '',
          bondStatus: ''
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
        this.maxRound = this._rounds.length - 1;
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
      case CommitType.NIL:
        return 'warning';
      case CommitType.ABSENT:
      case CommitType.UNKNOWN:
        return 'danger';
    }
  }

  getSeverityBoundStatus(bondStatus: BondStatus) {
    switch (bondStatus) {
      case BondStatus.BONDED:
        return 'success';
      case BondStatus.UNBONDING:
        return 'warning';
      case BondStatus.UNKNOWN:
      case BondStatus.UNBONDED:
        return 'danger';
    }
  }

  loadCommitsToTreeNode(round: string): TreeNode[] {
    const roundCommits: TreeNode<any>[] = [];
    for (const pre of this.getCommitsByRound(round)) {
      const nodeCommit: TreeNode = {
        data: {
          round: '',
          name: pre.validator?.name,
          timestamp: pre.timestamp,
          blocktyp: pre.commitType,
          blockHash: pre.blockHash,
          bondStatus: pre.validator?.bondStatus
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
          name: pre.validator?.name,
          timestamp: pre.timestamp,
          blocktyp: '',
          blockHash: pre.blockHash,
          bondStatus: pre.validator?.bondStatus
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
    for (const pre of this.getPreCommitsByRound(round)) {
      const nodeCommit: TreeNode = {
        data: {
          round: '',
          name: pre.validator?.name,
          timestamp: pre.timestamp,
          blocktyp: '',
          blockHash: pre.blockHash,
          bondStatus: pre.validator?.bondStatus
        },
        children: [],
        expanded: Number(round) === 0,
      };
      roundPreCommit.push(nodeCommit);
    }
    return roundPreCommit;
  }

  initDefaultCommitsNode(round: string) {
    const count = this.getCommitsByRound(round)?.length;
    return {
      data: {
        round: 'commits' + '(' + count + ')',
        name: '',
        timestamp: '',
        blocktyp: '',
        blockHash: '',
        bondStatus: ''
      },
      children: [],
      expanded: false,
    };
  }

  initDefaultPreCommitsNode(round: string) {
    const count = this.getPreCommitsByRound(round)?.length;
    return {
      data: {
        round: 'precommits' + '(' + count + ')',
        name: '',
        timestamp: '',
        blocktyp: '',
        blockHash: '',
        bondStatus: ''

      },
      children: [],
      expanded: false,
    };
  }

  initDefaultPreVoteNode(round: string) {
    const count = this.getPreVoteByRound(round)?.length;
    return {
      data: {
        round: 'prevote' + '(' + count + ')',
        name: '',
        timestamp: '',
        blocktyp: '',
        blockHash: '',
        bondStatus: ''
      },
      children: [],
      expanded: false,
    };
  }
}
