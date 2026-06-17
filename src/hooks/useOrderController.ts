import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  addBot as addBotToState,
  addOrder,
  completeBotOrder,
  createInitialState,
  removeNewestBot,
  type ControllerState,
} from '../domain/orderController';

type Action =
  | { type: 'add-order'; orderType: 'normal' | 'vip' }
  | { type: 'add-bot' }
  | { type: 'remove-newest-bot' }
  | { type: 'complete-order'; botId: number; orderId: number };

type ActiveTimer = {
  orderId: number;
  timeoutId: ReturnType<typeof setTimeout>;
};

const PROCESSING_TIME_MS = 10_000;

function reducer(state: ControllerState, action: Action): ControllerState {
  switch (action.type) {
    case 'add-order':
      return addOrder(state, action.orderType);
    case 'add-bot':
      return addBotToState(state);
    case 'remove-newest-bot':
      return removeNewestBot(state);
    case 'complete-order':
      return completeBotOrder(state, action.botId, action.orderId);
    default:
      return state;
  }
}

export function useOrderController() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const timersRef = useRef<Map<number, ActiveTimer>>(new Map());

  useEffect(() => {
    const activeBotIds = new Set(state.bots.map((bot) => bot.id));

    for (const [botId, timer] of timersRef.current) {
      const bot = state.bots.find((candidate) => candidate.id === botId);
      const shouldClear =
        !activeBotIds.has(botId) ||
        !bot ||
        bot.status !== 'processing' ||
        !bot.order ||
        bot.order.id !== timer.orderId;

      if (shouldClear) {
        clearTimeout(timer.timeoutId);
        timersRef.current.delete(botId);
      }
    }

    for (const bot of state.bots) {
      if (bot.status !== 'processing' || !bot.order) {
        continue;
      }

      const existingTimer = timersRef.current.get(bot.id);
      if (existingTimer?.orderId === bot.order.id) {
        continue;
      }

      if (existingTimer) {
        clearTimeout(existingTimer.timeoutId);
      }

      const orderId = bot.order.id;
      const timeoutId = setTimeout(() => {
        timersRef.current.delete(bot.id);
        dispatch({ type: 'complete-order', botId: bot.id, orderId });
      }, PROCESSING_TIME_MS);

      timersRef.current.set(bot.id, { orderId, timeoutId });
    }
  }, [state.bots, state.completedOrders, state.pendingOrders]);

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer.timeoutId);
      }
      timersRef.current.clear();
    };
  }, []);

  const addNormalOrder = useCallback(() => {
    dispatch({ type: 'add-order', orderType: 'normal' });
  }, []);

  const addVipOrder = useCallback(() => {
    dispatch({ type: 'add-order', orderType: 'vip' });
  }, []);

  const addBot = useCallback(() => {
    dispatch({ type: 'add-bot' });
  }, []);

  const removeBot = useCallback(() => {
    dispatch({ type: 'remove-newest-bot' });
  }, []);

  return {
    state,
    processingTimeMs: PROCESSING_TIME_MS,
    addNormalOrder,
    addVipOrder,
    addBot,
    removeBot,
  };
}
