import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { type Card, HandState } from "@holdem/poker-engine";
import { PokerTable } from './PokerTable';

type NewPokerTableProps = {
  state: HandState;
  seatsMeta: any[];  // 여기에 적절한 타입을 정의하세요
  humanSeat: number;
  buttonIndex: number;
  reveal: boolean;
  showdownEffectActive?: boolean;
  playerAvatarIndex: number;
};

export function NewPokerTable({ state, seatsMeta, humanSeat, buttonIndex, reveal, showdownEffectActive, playerAvatarIndex }: NewPokerTableProps) {
  return (
    <View>
      <PokerTable
        state={state}
        seatsMeta={seatsMeta}
        humanSeat={humanSeat}
        buttonIndex={buttonIndex}
        reveal={reveal}
        showdownEffectActive={showdownEffectActive}
        playerAvatarIndex={playerAvatarIndex}
      />
      {/* 추가 기능 또는 UI 요소가 필요한 경우 추가하세요 */}
    </View>
  );
}