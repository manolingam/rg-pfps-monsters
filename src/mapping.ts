import {
  Transfer,
  MonsterSpawn as MonsterContract
} from '../generated/MonsterSpawn/MonsterSpawn';
import { Mint, Monster, Owner, Trade } from '../generated/schema';

const zeroAddress = '0x0000000000000000000000000000000000000000';

function handleClaim(event: Transfer): void {
  let mint = new Mint(event.transaction.hash.toHex());

  let monster = new Monster(event.params.tokenId.toHex());
  let minter = Owner.load(event.params.to.toHex());

  if (minter == null) {
    minter = new Owner(event.params.to.toHex());
  }

  let monsterContract = MonsterContract.bind(event.address);
  let mintedTokenUri = monsterContract.tokenURI(event.params.tokenId);

  minter.address = event.params.to;

  mint.minter = minter.id;
  mint.time = event.block.timestamp;

  monster.tokenId = event.params.tokenId;
  monster.currentOwner = minter.id;
  monster.tokenUri = mintedTokenUri;
  monster.mintInfo = mint.id;

  mint.save();
  minter.save();
  monster.save();
}

function handleOwnerChange(event: Transfer): void {
  let trade = new Trade(event.transaction.hash.toHex());
  let monster = Monster.load(event.params.tokenId.toHex());
  let oldOwner = Owner.load(event.params.from.toHex());
  let newOwner = Owner.load(event.params.to.toHex());

  if (newOwner == null) {
    newOwner = new Owner(event.params.to.toHex());
    newOwner.address = event.params.to;
  }

  if (monster == null) {
    monster = new Monster(event.params.tokenId.toHex());
  }

  trade.oldOwner = oldOwner.id;
  trade.newOwner = newOwner.id;
  trade.time = event.block.timestamp;

  monster.currentOwner = newOwner.id;
  monster.tradeInfo = trade.id;

  newOwner.save();
  oldOwner.save();
  trade.save();
  monster.save();
}

export function handleTransfer(event: Transfer): void {
  let from = event.params.from.toHex();
  let to = event.params.to.toHex();

  if (from == zeroAddress && to != zeroAddress) {
    handleClaim(event);
  } else if (from != zeroAddress && to != zeroAddress) {
    handleOwnerChange(event);
  }
}
