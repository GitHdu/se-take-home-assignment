import { useMemo } from 'react';
import './App.css';
import { useOrderController } from './hooks/useOrderController';
import type { Bot, Order } from './domain/orderController';

function orderLabel(order: Order) {
  return `${order.type === 'vip' ? 'VIP' : 'Normal'} Order #${order.id}`;
}

function App() {
  const {
    state,
    processingTimeMs,
    addNormalOrder,
    addVipOrder,
    addBot,
    removeBot,
  } = useOrderController();

  const { activeBots, idleBots } = useMemo(() => {
    const processingCount = state.bots.filter(
      (bot) => bot.status === 'processing',
    ).length;

    return {
      activeBots: processingCount,
      idleBots: state.bots.length - processingCount,
    };
  }, [state.bots]);

  return (
    <main className="app">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">FeedMe Take Home Assignment</p>
        <h1 id="page-title">McDonald's Order Controller</h1>
        <p className="hero-copy">
          A frontend MVP that keeps all orders in memory, prioritizes VIP orders,
          and lets cooking bots process one order every {processingTimeMs / 1000}{' '}
          seconds.
        </p>
      </section>

      <section className="controls" aria-label="Order controller actions">
        <button onClick={addNormalOrder}>New Normal Order</button>
        <button className="vip-button" onClick={addVipOrder}>
          New VIP Order
        </button>
        <button onClick={addBot}>+ Bot</button>
        <button onClick={removeBot} disabled={state.bots.length === 0}>
          - Bot
        </button>
      </section>

      <section className="summary" aria-label="Controller summary">
        <SummaryCard label="Pending" value={state.pendingOrders.length} />
        <SummaryCard label="Bots" value={state.bots.length} />
        <SummaryCard label="Active" value={activeBots} />
        <SummaryCard label="Idle" value={idleBots} />
        <SummaryCard label="Complete" value={state.completedOrders.length} />
      </section>

      <section className="board" aria-label="Order status board">
        <OrderPanel
          title="PENDING"
          description="Waiting orders. VIP orders stay ahead of normal orders."
          orders={state.pendingOrders}
          emptyMessage="No pending orders."
        />

        <BotPanel bots={state.bots} />

        <OrderPanel
          title="COMPLETE"
          description="Orders completed by cooking bots."
          orders={state.completedOrders}
          emptyMessage="No completed orders yet."
        />
      </section>
    </main>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
};

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type OrderPanelProps = {
  title: string;
  description: string;
  orders: Order[];
  emptyMessage: string;
};

function OrderPanel({ title, description, orders, emptyMessage }: OrderPanelProps) {
  return (
    <article className="panel">
      <PanelHeader title={title} description={description} count={orders.length} />
      {orders.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <ul className="item-list" aria-label={`${title} orders`}>
          {orders.map((order) => (
            <li className={`order-card ${order.type}`} key={order.id}>
              <span className="badge">{order.type === 'vip' ? 'VIP' : 'Normal'}</span>
              <strong>{orderLabel(order)}</strong>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

type BotPanelProps = {
  bots: Bot[];
};

function BotPanel({ bots }: BotPanelProps) {
  return (
    <article className="panel bot-panel">
      <PanelHeader
        title="COOKING BOTS"
        description="Each bot processes one order at a time."
        count={bots.length}
      />
      {bots.length === 0 ? (
        <p className="empty-state">No cooking bots. Add one to start processing.</p>
      ) : (
        <ul className="item-list" aria-label="Cooking bots">
          {bots.map((bot) => (
            <li className={`bot-card ${bot.status}`} key={bot.id}>
              <div>
                <strong>Bot #{bot.id}</strong>
                <p>{bot.status === 'idle' ? 'IDLE' : 'PROCESSING'}</p>
              </div>
              {bot.order ? (
                <span className={`pill ${bot.order.type}`}>{orderLabel(bot.order)}</span>
              ) : (
                <span className="pill idle">Waiting for order</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

type PanelHeaderProps = {
  title: string;
  description: string;
  count: number;
};

function PanelHeader({ title, description, count }: PanelHeaderProps) {
  return (
    <header className="panel-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <span className="count-badge">{count}</span>
    </header>
  );
}

export default App;
