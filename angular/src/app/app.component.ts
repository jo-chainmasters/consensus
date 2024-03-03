import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TableModule } from 'primeng/table';
import { HttpClient } from "@angular/common/http";
import { forkJoin } from "rxjs";
import { BlockHeaderComponent } from "../components/block-header/block-header.component";
import { PrevotesComponent } from "../components/prevotes/prevotes.component";

const baseUrlApp = 'http://localhost:4000/blocks/';
const baseUrlRpc = 'https://rpc1.unification.io/';
const baseUrlRest = 'https://rest.unification.io/';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TableModule, BlockHeaderComponent, PrevotesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'angular-test';

  block: any;
  rpcBlock: any;
  rounds: string[] = [];

  constructor(private http: HttpClient) {

  }

  ngOnInit(): void {
    const obsConsensus = this.getConsensus(9522614);
    const obsCommit = this.getCommits(9522614);

    forkJoin([obsConsensus, obsCommit]).subscribe((result: any[]) => {
      this.block = result[0];
      this.rpcBlock = result[1].result.signed_header;
      this.rounds = Object.keys(this.block.votes.prevote);
      console.log(this.rounds);
    });

  }

  get precommits() {
    if(this.block)
      return this.block.votes.precommit['0'];
    else
      return [];
  }

  getPrevotes(round: string) {
    console.log('round: ' + round);
    if(this.block) {
      console.log(this.block.votes.prevote[round]);
      return this.block.votes.prevote[round];
    } else
      return [];
  }

  get commits() {
    return this.rpcBlock.commit.signatures;
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

}
