import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Leads", value: 150 },
  { name: "Oportunidades", value: 45 },
  { name: "Clientes", value: 12 },
];

export default function FunilChart({ dados = data }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <FunnelChart>
        <Tooltip />
        <Funnel dataKey="value" data={dados} isAnimationActive>
          <LabelList dataKey="name" position="right" />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}
