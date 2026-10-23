/**
 * Teste determinístico das áreas de trabalho (sem servidor).
 *
 * Garante que toda vaga aberta é jogável: salário, turno válido,
 * escala, férias, local existente e tarefas que usam itens reais.
 *
 * Uso: node test/jobs.test.js
 */
import { JOBS, jobShiftHours, isWorkday, isVacationDay } from "../shared/careers.js";
import { BUILDINGS, CROPS, ITEM_INFO, TOOLS } from "../shared/constants.js";
import { RECIPES } from "../shared/careers.js";

let failed = 0;
let total = 0;
function ok(name, cond, extra = "") {
  total++;
  if (!cond) failed++;
  console.log(`${cond ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
}

/** Todo id de item que o jogo conhece hoje. */
const KNOWN = new Set([
  ...Object.keys(CROPS), ...Object.keys(ITEM_INFO), ...Object.keys(TOOLS),
  ...Object.keys(CROPS).map((c) => `${c}_seed`),
  ...RECIPES.map((r) => r.id),
]);
const BUILDING_IDS = new Set(BUILDINGS.map((b) => b.id));

const list = Object.values(JOBS);
ok("Existem 7 áreas de trabalho", list.length === 7, list.map((j) => j.short).join(", "));
ok("As áreas pedidas estão todas lá", ["caixa", "operario", "pescador", "entregador", "agricultor"].every((id) => JOBS[id]), list.map((j) => j.id).join(","));

for (const job of list) {
  const tag = job.short;
  ok(`${tag}: salário positivo`, job.wagePerHour > 0, `$${job.wagePerHour}/h`);
  ok(`${tag}: turno com começo antes do fim`, job.shift.start < job.shift.end, `${job.shift.start}–${job.shift.end}`);
  ok(`${tag}: turno dentro do dia (0–1440)`, job.shift.start >= 0 && job.shift.end <= 1440);
  const hours = jobShiftHours(job);
  ok(`${tag}: carga horária entre 1h e 12h`, hours >= 1 && hours <= 12, `${hours}h`);
  ok(`${tag}: pelo menos um dia de trabalho`, Array.isArray(job.workdays) && job.workdays.length >= 1, job.workdays.join(","));
  ok(`${tag}: dias válidos (0–6)`, job.workdays.every((d) => d >= 0 && d <= 6));
  ok(`${tag}: tem férias nas 4 estações`, [0, 1, 2, 3].every((s) => Array.isArray(job.vacationDays[s]) && job.vacationDays[s].length > 0));
  ok(`${tag}: local existe no mapa`, BUILDING_IDS.has(job.building), job.building);
  ok(`${tag}: tarefas usam itens conhecidos`, job.tasks.length > 0 && job.tasks.every((t) => KNOWN.has(t)), job.tasks.filter((t) => !KNOWN.has(t)).join(",") || "todas ok");
  ok(`${tag}: tem verbo de ação`, typeof job.verb === "string" && job.verb.length > 0, job.verb);
  ok(`${tag}: paga usando ouro do jogo`, typeof job.wagePerHour === "number");
}

// escala e férias funcionam de fato
const caixa = JOBS.caixa;
const monday = isWorkday(caixa, 1, 0);
const tuesday = isWorkday(caixa, 2, 0);
ok("Escala respeita o dia da semana", monday && !tuesday, `seg=${monday} ter=${tuesday}`);
ok("Férias reconhecidas no dia certo", isVacationDay(caixa, 20, 0) && !isVacationDay(caixa, 19, 0));

// nenhuma área repete outra
const wages = list.map((j) => `${j.building}:${j.verb}`);
ok("Cada área tem local/ação própria", new Set(wages).size === wages.length, wages.join(" | "));

console.log(failed === 0 ? `🎉 TRABALHOS OK (${total}/${total})` : `❌ ${failed} falha(s) de ${total}`);
process.exit(failed === 0 ? 0 : 1);
