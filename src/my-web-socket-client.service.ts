
import { Injectable, Logger } from "@nestjs/common";
import { WebSocket } from "ws";
import { Connection } from "mongoose";
import { InjectConnection } from "@nestjs/mongoose";
import { Block, CommitType, Vote } from "./model/Block";
import { HttpService } from "@nestjs/axios";
import { map } from "rxjs";
import { fromBase64, fromHex, toBase64, toBech32, toHex } from "@cosmjs/encoding";
import { encodeBech32Pubkey } from "@cosmjs/launchpad";




const wsUrl = "wss://rpc.unification.chainmasters.ninja/websocket";
const rpcUrl = "https://rpc.unification.chainmasters.ninja:443";
const restUrl = "https://rest.unification.chainmasters.ninja/";

@Injectable()
export class MyWebSocketClient {
  private readonly logger = new Logger(MyWebSocketClient.name);

  private client: WebSocket;

  private blocks: { [key: number]: Block } = {};

  private subscribeNewRoundStep = {
    jsonrpc: "2.0",
    method: "subscribe",
    params: {
      query: "tm.event='NewRoundStep'"
    },
    id: "1"
  };
  private subscribeVote = {
    jsonrpc: "2.0",
    method: "subscribe",
    params: {
      query: "tm.event='Vote'"
    },
    id: "2"
  };
  private subscribeCompleteProposal = {
    jsonrpc: "2.0",
    method: "subscribe",
    params: {
      query: "tm.event='CompleteProposal'"
    },
    id: "2"
  };
  private subscribeTimeoutPropose = {
    jsonrpc: "2.0",
    method: "subscribe",
    params: {
      query: "tm.event='TimeoutPropose'"
    },
    id: "2"
  };
  private subscribeCompletePolka = {
    jsonrpc: "2.0",
    method: "subscribe",
    params: {
      query: "tm.event='Polka'"
    },
    id: "2"
  };
  private subscribeValidBlock = {
    jsonrpc: "2.0",
    method: "subscribe",
    params: {
      query: "tm.event='ValidBlock'"
    },
    id: "2"
  };
  private subscribeNewRound = {
    jsonrpc: "2.0",
    method: "subscribe",
    params: {
      query: "tm.event='NewRound'"
    },
    id: "2"
  };

  private async persistBlock(height: number) {
    const block = this.blocks[height];
    if (block) {
      this.getValidatorSetAtHeight(block.height).subscribe((validators) => {
        block.validatorSet = validators;
        this.getBlock(block.height).subscribe((cosmosBlock) => {

          this.getHistoricalValidatorSetAtHeight(height).subscribe(hist => {


            //     block.rounds[cosmosBlock.block.last_commit.round].commits = [];
            for (
              let i = 0;
              i < cosmosBlock.block.last_commit.signatures.length;
              i++
            ) {
              const signature = cosmosBlock.block.last_commit.signatures[i];
              const validator = this.getValidatorByConsensusAddress(validators, toBech32("undvalcons", fromBase64(signature.validator_address)));
              const validatorHist = this.getValidatorDetailsFromHistorical(hist, validator.pub_key);

              block.rounds[cosmosBlock.block.last_commit.round].commits.push({
                blockHash: Buffer.from(
                  atob(cosmosBlock.block_id.hash),
                  "binary"
                ).toString("hex"),
                validatorMoniker: "n/A",
                timestamp: Number(signature.timestamp),
                validatorDetails: validatorHist,
                // validatorAddress: signature.validator_address,
                commitType: this.valueOfCommitType(signature.block_id_flag)
              });
            }
            const collection = this.connection.collection("consensus");
            collection.insertOne(block).then();
          });

        });
      });
    }
  }

  private getValidatorByConsensusAddress(validatorSet, address) {
    for (let i = 0; i < validatorSet.length; i++) {
      const validator = validatorSet[i];
      if (validator.address === address) {
        return validator;
      }
    }
  }

  private getValidatorDetailsFromHistorical(hist, public_key) {
    for (let i = 0; i < hist.length; i++) {
      if(hist[i].consensus_pubkey['@type'] === public_key['@type'] && hist[i].consensus_pubkey['key'] === public_key['key']) {
        return hist[i].description;
      }
    }
  }

  private processMessage(message: any): void {
    if (message.result.query === "tm.event='NewRoundStep'") {
      const newRoundStep = {
        height: Number(message.result.data.value.height),
        step: message.result.data.value.step,
        round: Number(message.result.data.value.round),
        timestamp: Date.now()
      };
      this.logger.log(
        `NewRoundStep     : height: ${newRoundStep.height}, round: ${newRoundStep.round}, step: ${newRoundStep.step}`
      );

      if (newRoundStep.step === "RoundStepNewHeight") {
        this.blocks[newRoundStep.height] = {
          height: newRoundStep.height,
          rounds: {},
        };

        const pHeight = newRoundStep.height - 2;
        this.persistBlock(pHeight);
        delete this.blocks[pHeight];
      }
    } else if (message.result.query === "tm.event='NewRound'") {
      this.logger.log(
        `NewRound         : height: ${message.result.data.value.height}, round: ${message.result.data.value.round}, step: ${message.result.data.value.step}, validator: ${message.result.data.value.proposer.address}`
      );

      if (this.blocks[message.result.data.value.height]) {
        this.blocks[message.result.data.value.height].rounds[
          message.result.data.value.round

        ] = {

          prevotes: [],
          precommits: [],
          commits: [],
          prevote: [],
          precommit: [],
        };
      }
    } else if (message.result.query === "tm.event='CompleteProposal'") {
      this.logger.log(
        `CompleteProposal : height: ${message.result.data.value.height}, round: ${message.result.data.value.round}, step: ${message.result.data.value.step}, block: ${message.result.data.value.block_id.hash}`
      );
    } else if (message.result.query === "tm.event='Polka'") {
      this.logger.log(
        `Polka            : height: ${message.result.data.value.height}, round: ${message.result.data.value.round}, step: ${message.result.data.value.step}`
      );
    } else if (message.result.query === "tm.event='TimeoutPropose'") {
      this.logger.log(
        `TimeoutPropose   : height: ${message.result.data.value.height}, round: ${message.result.data.value.round}, step: ${message.result.data.value.step}`
      );
    } else if (message.result.query === "tm.event='ValidBlock'") {
      this.logger.log(
        `ValidBlock       : height: ${message.result.data.value.height}, round: ${message.result.data.value.round}, step: ${message.result.data.value.step}`
      );
    } else if (message.result.query === "tm.event='Vote'") {
      let type = message.result.data.value.Vote.type as string;
      if (type == "1") {
        type = "prevotes";
      }
      if (type == "2") {
        type = "precommits";
      }
      const vote = {
        height: Number(message.result.data.value.Vote.height),
        type,
        round: Number(message.result.data.value.Vote.round),
        block: message.result.data.value.Vote.block_id.hash,
        timestamp: new Date(message.result.data.value.Vote.timestamp).getTime(),
        validatorHash: message.result.data.value.Vote.validator_address,
        validatorIndex: Number(message.result.data.value.Vote.validator_index)
      };

      if (this.blocks[vote.height]) {
        if (!this.blocks[vote.height].rounds[vote.round][vote.type]) {
          this.blocks[vote.height].rounds[vote.round][vote.type] = [];
        }

        this.blocks[vote.height].rounds[vote.round][vote.type].push({
          blockHash: vote.block,
          timestamp: vote.timestamp,
          validatorHash: vote.validatorHash,
          validatorIndex: vote.validatorIndex,
        } as Vote);
      }
    } else {
      console.log('Messenge', message);
    }
  }

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly httpService: HttpService
  ) {
    this.client = new WebSocket(wsUrl);

    this.client.on("open", () => {
      this.sendMessage(this.subscribeNewRoundStep);
      this.sendMessage(this.subscribeVote);
      this.sendMessage(this.subscribeNewRound);
      this.sendMessage(this.subscribeCompleteProposal);
      this.sendMessage(this.subscribeCompletePolka);
      this.sendMessage(this.subscribeTimeoutPropose);
      this.sendMessage(this.subscribeValidBlock);
    });

    this.client.on("message", (data: WebSocket.Data) => {
      const message = JSON.parse(data.toString());
      this.processMessage(message);
    });

    this.client.on("error", (error) => {
      console.error("Fehler in WebSocket:", error);
    });
  }

  sendMessage(message: any) {
    this.client.send(JSON.stringify(message));
  }

  getValidatorSetAtHeight(height: number) {
    return this.httpService
      .get(restUrl + "cosmos/base/tendermint/v1beta1/validatorsets/" + height)
      .pipe(map((response) => response.data.validators));
  }

  getHistoricalValidatorSetAtHeight(height: number) {
    return this.httpService
      .get(restUrl + "cosmos/staking/v1beta1/historical_info/" + height)
      .pipe(map(response => response.data.hist.valset));
  }

  getBlock(height: number) {
    return this.httpService
      .get(restUrl + "cosmos/base/tendermint/v1beta1/blocks/" + height)
      .pipe(map((response) => response.data));
  }

  valueOfCommitType(type: string) {
    switch (type) {
      case "BLOCK_ID_FLAG_COMMIT":
        return CommitType.COMMIT;
      case "BLOCK_ID_FLAG_ABSENT":
        return CommitType.ABSENT;
      case "BLOCK_ID_FLAG_NIL":
        return CommitType.NIL;
      default:
        return CommitType.UNKNOWN;
    }
  }
}

// // Beispiel Hex-Hash
// const validatorHashHex = "04652EBFABB956B7CD53AB6491BBFF3281931296";
// const pubkeyBytes = fromHex(validatorHashHex);
// const pubkey = {
//   type: '/cosmos.crypto.ed25519.PubKey',
//   value: fromHex(validatorHashHex)
// };
// const bech32Prefix = "undvalconspub";
// const bech32Pubkey = encodeBech32Pubkey(pubkey, bech32Prefix).toString();
// console.log(bech32Pubkey); // Ausgabe: undvalconspub1zcjduepqcdav5ylt2zst90qmuh8e5w07xmxv9y6wufp5k9ngzmx7v9qewqtqkcq4z8



