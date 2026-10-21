// Banco do Vale — regras compartilhadas
export const BANK = {
  maxLoan: 2000,
  loanInterestPct: 6, // 6% por estação (4 dias por estação = aprox 28 dias)
  maxTransfer: 5000,
};

export function bankInfoFor(player) {
  const bal = player.bankBalance ?? 0;
  const loan = player.loan ?? null;
  const history = player.bankHistory ?? [];
  return { balance: bal, loan, history: history.slice(-20), cash: player.gold ?? 0 };
}
