interface StatsCardProps {
  title: string;
  value: string;
  icon: "robot" | "messages" | "users" | "chart";
  color: "blue" | "green" | "purple" | "amber";
}

const iconMap = {
  robot: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  messages: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
};

const colorMap = {
  blue: {
    bg: "bg-hsl(207,90%,97%)",
    text: "text-hsl(207,90%,54%)",
  },
  green: {
    bg: "bg-hsl(142,76%,90%)",
    text: "text-hsl(142,76%,36%)",
  },
  purple: {
    bg: "bg-hsl(240,50%,95%)",
    text: "text-hsl(240,50%,60%)",
  },
  amber: {
    bg: "bg-hsl(48,96%,95%)",
    text: "text-hsl(48,96%,53%)",
  },
};

export default function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const iconElement = iconMap[icon];
  const colors = colorMap[color];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-hsl(20,5.9%,90%)">
      <div className="flex items-center">
        <div className={`h-12 w-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
          <div className={colors.text}>
            {iconElement}
          </div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-hsl(25,5.3%,44.7%)">{title}</p>
          <p className="text-2xl font-bold text-hsl(20,14.3%,4.1%)">{value}</p>
        </div>
      </div>
    </div>
  );
}
