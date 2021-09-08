import { Address } from '@graphprotocol/graph-ts';

import {
  Transfer,
  MonsterSpawn as MonsterContract
} from '../generated/MonsterSpawn/MonsterSpawn';
import { MonsterBook as MonsterBookContract } from '../generated/MonsterBook/MonsterBook';

import { Mint, Monster, Owner, Trade, MonsterBook } from '../generated/schema';

const zeroAddress = '0x0000000000000000000000000000000000000000';

function handleClaim(event: Transfer): void {
  let mint = new Mint(event.transaction.hash.toHex());

  let monster = new Monster(event.params.tokenId.toHex());
  let monsterBook = new MonsterBook(event.params.tokenId.toHex());
  let minter = Owner.load(event.params.to.toHex());

  if (minter == null) {
    minter = new Owner(event.params.to.toHex());
  }

  let monsterContract = MonsterContract.bind(event.address);
  let mintedTokenUri = monsterContract.tokenURI(event.params.tokenId);

  let monsterBookContract = MonsterBookContract.bind(
    Address.fromString('0x1B7c86617636856F3c95868490d23678a7445dfD')
  );

  let name = monsterBookContract.getName(event.params.tokenId);
  let size = monsterBookContract.getSize(event.params.tokenId);
  let weakness = monsterBookContract.getWeakness(event.params.tokenId);
  let specialAbility = monsterBookContract.getSpecialAbility(
    event.params.tokenId
  );
  let locomotion = monsterBookContract.getLocomotion(event.params.tokenId);
  let language = monsterBookContract.getLanguage(event.params.tokenId);
  let alignment = monsterBookContract.getAlignment(event.params.tokenId);
  let action1 = monsterBookContract.getAction1(event.params.tokenId);
  let action2 = monsterBookContract.getAction2(event.params.tokenId);

  monsterBook.name = name;
  monsterBook.size = size;
  monsterBook.weakness = weakness;
  monsterBook.specialAbility = specialAbility;
  monsterBook.locomotion = locomotion;
  monsterBook.language = language;
  monsterBook.alignment = alignment;
  monsterBook.action1 = action1;
  monsterBook.action2 = action2;

  minter.address = event.params.to;

  mint.minter = minter.id;
  mint.time = event.block.timestamp;

  monster.tokenId = event.params.tokenId;
  monster.currentOwner = minter.id;
  monster.tokenUri = mintedTokenUri;
  monster.mintInfo = mint.id;
  monster.monsterInfo = monsterBook.id;

  monsterBook.save();
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
