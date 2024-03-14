export interface Block {
  height: number;
  rounds: {[key: number]: Round },
}

export interface Vote {
  timestamp: number;
  blockHash: string;
  validatorHash: string;
  validatorIndex: number;
}

export interface Prevote extends Vote {

}

export interface Precommit extends Vote {

}

export interface Commit extends Vote {

}

export interface Round {
  prevotes: Prevote[];
  precommits: Precommit[];
  commits: Commit[];
}